#!/usr/bin/env python3
"""Apply the production domain to every SEO field of the static site.

Usage (from the repo root):
    python scripts/set_domain.py https://your-domain.example
    python scripts/set_domain.py https://your-domain.example --dry-run

Sets, on every page: canonical, og:url, og:image (+ size/alt), twitter:image,
JSON-LD urls/images (LocalBusiness, WebSite, Blog, Article, BreadcrumbList),
then regenerates public/sitemap.xml and public/robots.txt.
Safe to re-run: it overwrites fields instead of appending duplicates.
"""
import glob, html, json, os, re, subprocess, sys
from datetime import date
from urllib.parse import urlparse

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'public')
OG_IMAGE_PATH = '/assets/og-image.png'
LOGO_PATH = '/assets/icon-512.png'
SKIP = {'404.html'}

def rd(p): return open(p, encoding='utf8', newline='').read()
def wr(p, s): open(p, 'w', encoding='utf8', newline='').write(s)
def dump(o): return json.dumps(o, ensure_ascii=False, separators=(',', ':'))

def pages():
    out = ['index.html', 'blog.html'] + sorted(os.path.relpath(p, ROOT).replace('\\', '/') for p in glob.glob(os.path.join(ROOT, 'blog', '*.html')))
    return [p for p in out if p not in SKIP]

def page_url(domain, rel):
    return domain + '/' if rel == 'index.html' else domain + '/' + rel

def validate(domain):
    u = urlparse(domain)
    if u.scheme != 'https' or not u.netloc or '.' not in u.netloc or u.path not in ('', '/') or u.query or u.fragment:
        sys.exit('Domain must look like https://example.com (https, no path, no query).')
    host = u.netloc.lower()
    if 'hatchable' in host: sys.exit('That is the OLD domain. Use the final production domain.')
    if 'aviral-goyal' in host: sys.exit("That is the developer's portfolio domain, not the Divine Travels domain.")
    if host.endswith(('.netlify.app', '.vercel.app')):
        print('WARNING: %s is a platform subdomain. Fine as a temporary address, but switching to a custom domain later changes every canonical URL.' % host)
    return 'https://' + host

def set_tag(s, kind, key, content):
    """Set (replace or insert after the robots meta) a <meta> or canonical <link>."""
    if kind == 'canonical':
        tag = '<link rel="canonical" href="%s">' % content
        pat = r'<link rel="canonical"[^>]*>'
    else:
        tag = '<meta %s="%s" content="%s">' % (kind, key, html.escape(content, quote=True))
        pat = r'<meta %s="%s"[^>]*>' % (kind, re.escape(key))
    if re.search(pat, s): return re.sub(pat, lambda m: tag, s, count=1)
    m = re.search(r'<meta name="robots"[^>]*>', s)
    if not m: sys.exit('No <meta name="robots"> anchor found; cannot insert ' + tag)
    return s[:m.end()] + '\n' + tag + s[m.end():]

def title_of(s): return html.unescape(re.search(r'<title>(.*?)</title>', s, re.S).group(1).strip())
def short_title(t): return t.split('|')[0].strip()

def breadcrumb(domain, rel, s):
    items = [('Home', domain + '/'), ('Travel blog', domain + '/blog.html')]
    if rel.startswith('blog/'): items.append((short_title(title_of(s)), page_url(domain, rel)))
    return {'@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': [
        {'@type': 'ListItem', 'position': i + 1, 'name': n, 'item': u} for i, (n, u) in enumerate(items)]}

def update_ld(s, domain, rel):
    url = page_url(domain, rel); og = domain + OG_IMAGE_PATH
    blocks = list(re.finditer(r'<script type="application/ld\+json">(.*?)</script>', s, re.S))
    seen = set(); out = []; last = 0
    for b in blocks:
        o = json.loads(b.group(1)); t = o.get('@type'); ts = t if isinstance(t, list) else [t]
        seen.update(ts)
        if 'TaxiService' in ts or 'LocalBusiness' in ts:
            o.update({'@id': domain + '/#business', 'url': domain + '/', 'logo': domain + LOGO_PATH, 'image': [og]})
        elif t == 'Article':
            o.update({'url': url, 'mainEntityOfPage': {'@type': 'WebPage', '@id': url}, 'image': [og]})
        elif t == 'Blog':
            o.update({'url': url})
        elif t == 'BreadcrumbList':
            o = breadcrumb(domain, rel, s)
        out.append(s[last:b.start()] + '<script type="application/ld+json">' + dump(o) + '</script>'); last = b.end()
    s = ''.join(out) + s[last:]
    extra = []
    if rel == 'index.html' and 'WebSite' not in seen:
        extra.append({'@context': 'https://schema.org', '@type': 'WebSite', 'name': 'Divine Travels', 'url': domain + '/', 'inLanguage': 'en-IN'})
    if rel == 'blog.html' and 'Blog' not in seen:
        extra.append({'@context': 'https://schema.org', '@type': 'Blog', 'name': 'Divine Travels Madhya Pradesh Travel Blog', 'url': url, 'inLanguage': 'en-IN'})
    if rel != 'index.html' and 'BreadcrumbList' not in seen:
        extra.append(breadcrumb(domain, rel, s))
    if extra:
        add = '\n'.join('<script type="application/ld+json">' + dump(o) + '</script>' for o in extra)
        s = s.replace('</head>', add + '\n</head>', 1)
    return s

def lastmod(rel):
    path = os.path.join(ROOT, rel)
    try:
        out = subprocess.run(['git', 'log', '-1', '--format=%cs', '--', path], capture_output=True, text=True, cwd=ROOT).stdout.strip()
        if re.fullmatch(r'\d{4}-\d{2}-\d{2}', out): return out
    except Exception: pass
    return date.fromtimestamp(os.path.getmtime(path)).isoformat()

def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    dry = '--dry-run' in sys.argv
    if len(args) != 1: sys.exit(__doc__)
    domain = validate(args[0].rstrip('/'))
    for rel in pages():
        p = os.path.join(ROOT, rel); s = rd(p); url = page_url(domain, rel)
        s = set_tag(s, 'canonical', None, url)
        s = set_tag(s, 'property', 'og:url', url)
        s = set_tag(s, 'property', 'og:image', domain + OG_IMAGE_PATH)
        s = set_tag(s, 'property', 'og:image:width', '1200')
        s = set_tag(s, 'property', 'og:image:height', '630')
        s = set_tag(s, 'property', 'og:image:alt', 'Divine Travels: taxi service in Ujjain, Indore, Dewas and Bhopal')
        s = set_tag(s, 'name', 'twitter:image', domain + OG_IMAGE_PATH)
        s = update_ld(s, domain, rel)
        if not dry: wr(p, s)
        print(('would update ' if dry else 'updated ') + rel + '  ->  ' + url)
    locs = ''.join('  <url><loc>%s</loc><lastmod>%s</lastmod></url>\n' % (page_url(domain, r), lastmod(r)) for r in pages())
    sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + locs + '</urlset>\n'
    robots = 'User-agent: *\nAllow: /\n\nSitemap: %s/sitemap.xml\n' % domain
    if not dry:
        wr(os.path.join(ROOT, 'sitemap.xml'), sitemap); wr(os.path.join(ROOT, 'robots.txt'), robots)
    print('\nDomain set to', domain, '(dry run, nothing written)' if dry else '')
    print('Next: python scripts/check_seo.py   then commit, deploy, and submit the sitemap in Google Search Console.')

if __name__ == '__main__': main()
