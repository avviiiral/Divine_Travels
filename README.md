# Divine Travels — Static Taxi Website

A lightweight, responsive taxi-service website for Divine Travels, focused on taxi searches in **Ujjain, Indore, Dewas, Bhopal and nearby places in Madhya Pradesh**.

## Static deployment — no backend required

This branch intentionally removes Django, database migrations, API handlers and the enquiry admin panel. It can be deployed as a static website to **Netlify or Vercel** without a Python runtime or database.

### Booking flow

The booking form validates the visitor's details in the browser and opens WhatsApp with a prefilled trip enquiry to **+91 96853 66855**. The customer must press Send in WhatsApp to submit the enquiry. This static version does not store enquiries in a website database and does not include a private admin dashboard.

### Deploy to Netlify

1. Push this branch to GitHub and import the repository into Netlify.
2. Set the branch to `feature/static-seo-netlify-blog` (or merge it into `main` first).
3. Build command: leave blank.
4. Publish directory: `public`.
5. Deploy the site.

The `netlify.toml` file sets the publish directory.

### Deploy to Vercel

1. Import the repository into Vercel.
2. Set the production branch to this branch or merge it into `main`.
3. Set the output directory to `public`; no build command is required.
4. Deploy.

The `vercel.json` file configures static output.

### Local preview

From the repository root:

```powershell
python -m http.server 5500 --directory public
```

Open http://127.0.0.1:5500/.

## SEO and content

- Local service title and meta description targeting taxi service in Ujjain, Indore, Dewas and Bhopal.
- TaxiService structured data, contact details and service-area content.
- Blog index at `/blog.html`.
- Static travel guides:
  - `/blog/mahakaleshwar-darshan-guide.html`
  - `/blog/ujjain-to-omkareshwar.html`
  - `/blog/maheshwar-mandu-itinerary.html`
- `public/robots.txt` and `public/sitemap.xml` for search crawlers.

### Before launch: set your canonical domain

The current SEO metadata and sitemap contain the previous Hatchable domain. After deploying, replace `https://divine-travels.hatchable.site` in `public/index.html`, `public/blog.html`, the three blog articles, `public/robots.txt`, and `public/sitemap.xml` with your final Netlify/Vercel custom domain. Keep each canonical URL unique and aligned with the actual public page URL. Then submit `https://YOUR-DOMAIN/sitemap.xml` in Google Search Console.

Only publish service areas, rates, reviews and travel claims that are accurate. SEO improvements cannot guarantee a particular ranking.

## Contact

- Phone / WhatsApp: +91 96853 66855
- Service area: Ujjain, Indore, Dewas, Bhopal and nearby cities, towns and villages.
