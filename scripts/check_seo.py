#!/usr/bin/env python3
"""Pre-deploy SEO and link checker for the static site (no dependencies).

    python scripts/check_seo.py              # checks everything, derives the domain from index.html
    python scripts/check_seo.py https://your-domain.example

Exits with status 1 if any ERROR is found. WARN items are advice only.
"""
import glob, json, os, re, sys, xml.etree.ElementTree as ET
from html.parser import HTMLParser
from urllib.parse import urlparse

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'public')
errors, warns = [], []
def err(p, m): errors.append('%s: %s' % (p, m))
def warn(p, m): warns.append('%s: %s' % (p, m))

class P(HTMLParser):
    def __init__(s):
        super().__init__(); s.title = ''; s.in_t = False; s.metas = []; s.links = []; s.a = []; s.imgs = []; s.ld = []; s.in_ld = False; s.ids = set(); s.h1 = 0; s.srcs = []
    def handle_starttag(s, t, a):
        a = dict(a)
        if t == 'title': s.in_t = True
        elif t == 'meta': s.metas.append(a)
        elif t == 'link': s.links.append(a)
        elif t == 'a': s.a.append(a)
        elif t == 'img': s.imgs.append(a)
        elif t == 'h1': s.h1 += 1
        elif t == 'script':
            if a.get('type') == 'application/ld+json': s.in_ld = True; s.ld.append('')
            elif a.get('src'): s.srcs.append(a['src'])
        if 'id' in a: s.ids.add(a['id'])
    def handle_endtag(s, t):
        if t == 'title': s.in_t = False
        if t == 'script': s.in_ld = False
    def handle_data(s, d):
        if s.in_t: s.title += d
        if s.in_ld: s.ld[-1] += d

def parse(rel):
    p = P(); p.feed(open(os.path.join(ROOT, rel), encoding='utf8').read()); return p
def meta(p, key, val): 
    for m in p.metas:
        if m.get(key) == val: return m.get('content')
def walk(o):
    if isinstance(o, dict):
        yield o
        for v in o.values(): yield from walk(v)
    elif isinstance(o, list):
        for v in o: yield from walk(v)
def urls_in(o):
    for d in walk(o):
        for v in d.values():
            if isinstance(v, str) and v.startswith('http'): yield v

def main():
    rels = ['index.html', 'blog.html'] + sorted(os.path.relpath(p, ROOT).replace('\\', '/') for p in glob.glob(os.path.join(ROOT, 'blog', '*.html')))
    parsed = {r: parse(r) for r in rels}
    domain = sys.argv[1].rstrip('/') if len(sys.argv) > 1 else None
    if not domain:
        c = [l.get('href') for l in parsed['index.html'].links if l.get('rel') == 'canonical']
        if c:
            u = urlparse(c[0]); domain = '%s://%s' % (u.scheme, u.netloc)
    if not domain: err('index.html', 'no canonical URL, so no production domain is set. Run: python scripts/set_domain.py https://your-domain')
    host = urlparse(domain).netloc if domain else None
    if host and ('hatchable' in host or 'aviral-goyal' in host): err('domain', 'canonical host %s is not the Divine Travels production domain' % host)
    titles, descs = {}, {}
    for rel, p in parsed.items():
        title = p.title.strip(); d = meta(p, 'name', 'description')
        if not title: err(rel, 'missing <title>')
        elif len(title) > 65: warn(rel, 'title is %d chars (aim for 50-60)' % len(title))
        if not d: err(rel, 'missing meta description')
        elif len(d) < 70: warn(rel, 'meta description is short (%d chars)' % len(d))
        elif len(d) > 165: warn(rel, 'meta description is %d chars; Google may truncate' % len(d))
        titles.setdefault(title, []).append(rel); descs.setdefault(d, []).append(rel)
        if p.h1 != 1: err(rel, 'expected exactly one <h1>, found %d' % p.h1)
        if not meta(p, 'name', 'viewport'): err(rel, 'missing viewport meta')
        if 'noindex' in (meta(p, 'name', 'robots') or ''): err(rel, 'page is noindex')
        for k in ('og:title', 'og:description', 'og:type', 'og:site_name'):
            if not meta(p, 'property', k): err(rel, 'missing ' + k)
        if not meta(p, 'name', 'twitter:card'): err(rel, 'missing twitter:card')
        expect = (domain + ('/' if rel == 'index.html' else '/' + rel)) if domain else None
        canon = [l.get('href') for l in p.links if l.get('rel') == 'canonical']
        if len(canon) != 1: err(rel, 'expected 1 canonical, found %d' % len(canon))
        elif expect and canon[0] != expect: err(rel, 'canonical %s should be %s' % (canon[0], expect))
        if expect:
            if meta(p, 'property', 'og:url') != expect: err(rel, 'og:url should be ' + expect)
            for k, v in (('property', 'og:image'), ('name', 'twitter:image')):
                if meta(p, k, v) != domain + '/assets/og-image.png': err(rel, '%s should be %s/assets/og-image.png' % (v, domain))
        if not p.ld: err(rel, 'no JSON-LD structured data')
        for i, raw in enumerate(p.ld):
            try: o = json.loads(raw)
            except Exception as e: err(rel, 'JSON-LD block %d is invalid JSON: %s' % (i + 1, e)); continue
            for u in urls_in(o):
                if 'hatchable' in u: err(rel, 'JSON-LD still contains the old domain: ' + u)
                elif host and u.startswith('http') and urlparse(u).netloc not in (host, 'schema.org', 'wa.me', 'www.schema.org') : warn(rel, 'JSON-LD links to another host: ' + u)
        for im in p.imgs:
            if not im.get('alt') and im.get('alt') != '': err(rel, 'image without alt: ' + im.get('src', '')[:60])
        # links and assets
        for a in p.a:
            h = a.get('href')
            if not h or h.startswith(('mailto:', 'tel:', 'javascript:')): continue
            if h.startswith('http'):
                if 'hatchable' in h: err(rel, 'link to old domain: ' + h)
                continue
            if h.startswith('/index.html'): warn(rel, 'link %s duplicates the homepage URL; use /' % h)
            path, _, frag = h.partition('#'); path = path.split('?')[0]
            tgt_rel = rel if path == '' else (path.lstrip('/') if path.startswith('/') else os.path.normpath(os.path.join(os.path.dirname(rel), path)).replace('\\', '/'))
            if tgt_rel == '': tgt_rel = 'index.html'
            tgt = os.path.join(ROOT, tgt_rel)
            if not os.path.exists(tgt): err(rel, 'broken link ' + h); continue
            if frag and tgt_rel.endswith('.html'):
                ids = parsed[tgt_rel].ids if tgt_rel in parsed else parse(tgt_rel).ids
                if frag not in ids: err(rel, 'anchor #%s not found in %s' % (frag, tgt_rel))
        for ref in [l.get('href', '') for l in p.links] + p.srcs + [i.get('src', '') for i in p.imgs]:
            if ref.startswith('/') and not os.path.exists(os.path.join(ROOT, ref.lstrip('/'))): err(rel, 'missing local file ' + ref)
    for t, r in titles.items():
        if len(r) > 1: err(', '.join(r), 'duplicate title: ' + t)
    for d, r in descs.items():
        if len(r) > 1 and d: err(', '.join(r), 'duplicate meta description')
    # sitemap
    try:
        ns = '{http://www.sitemaps.org/schemas/sitemap/0.9}'
        locs = [e.text for e in ET.parse(os.path.join(ROOT, 'sitemap.xml')).getroot().iter(ns + 'loc')]
        want = {(domain + ('/' if r == 'index.html' else '/' + r)) for r in rels} if domain else set()
        for l in locs:
            if 'hatchable' in l: err('sitemap.xml', 'old domain in ' + l)
            elif want and l not in want: err('sitemap.xml', 'unexpected URL ' + l)
        for w in sorted(want - set(locs)): err('sitemap.xml', 'missing ' + w)
        if len(locs) != len(set(locs)): err('sitemap.xml', 'duplicate <loc> entries')
    except Exception as e: err('sitemap.xml', 'invalid or missing: %s' % e)
    # robots
    try:
        rb = open(os.path.join(ROOT, 'robots.txt'), encoding='utf8').read()
        sm = re.findall(r'(?im)^sitemap:\s*(\S+)', rb)
        if domain and sm != [domain + '/sitemap.xml']: err('robots.txt', 'Sitemap line should be %s/sitemap.xml, found %s' % (domain, sm))
        if re.search(r'(?im)^disallow:\s*/\s*$', rb): err('robots.txt', 'Disallow: / blocks the whole site')
    except Exception as e: err('robots.txt', 'missing: %s' % e)
    # 404 page
    if os.path.exists(os.path.join(ROOT, '404.html')):
        if 'noindex' not in (meta(parse('404.html'), 'name', 'robots') or ''): err('404.html', 'should be noindex')
    else: warn('404.html', 'missing custom 404 page')
    # stray secrets / old domain anywhere
    for f in glob.glob(os.path.join(ROOT, '**', '*'), recursive=True):
        if os.path.isfile(f) and f.endswith(('.html', '.js', '.css', '.xml', '.txt', '.json', '.webmanifest')):
            t = open(f, encoding='utf8', errors='ignore').read()
            if 'hatchable' in t: err(os.path.relpath(f, ROOT), 'still mentions the old hatchable domain')
            if re.search(r'(?i)(api[_-]?key|secret|password)\s*[:=]\s*[\'"][^\'"]{6,}', t): err(os.path.relpath(f, ROOT), 'possible secret in file')
    print('Checked %d pages%s.' % (len(rels), ' against ' + domain if domain else ''))
    for w in warns: print('WARN  ' + w)
    for e in errors: print('ERROR ' + e)
    print('\n%d error(s), %d warning(s).' % (len(errors), len(warns)))
    sys.exit(1 if errors else 0)

if __name__ == '__main__': main()
