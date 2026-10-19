# Divine Travels Website

Local taxi booking website for Divine Travels, focused on customers searching for taxi and cab services in **Ujjain, Indore, Dewas, Bhopal, and nearby towns and villages in Madhya Pradesh**.

## Services
- Local city taxi
- One-way and intercity cab
- Outstation trips
- Round trips
- Local rentals
- Airport transfers
- WhatsApp and phone enquiries

## Contact
- Phone / WhatsApp: +91 96853 66855
- Service area: Ujjain, Indore, Dewas, Bhopal and nearby cities, towns and villages

## Project structure
- `public/index.html`: responsive marketing and booking page, local service content, FAQ, structured data
- `public/styles.css`, `public/seo-local.css`: visual styling and local SEO section styling
- `public/app.js`: booking form and site navigation interactions
- `public/config.js`: API base configuration for hosted JavaScript endpoints or a future Django API
- `public/admin.html`, `public/admin.js`, `public/admin.css`: trip enquiry dashboard (API route is access-gated by the hosting platform)
- `api/enquiries.js`: trip enquiry creation endpoint for the current Hatchable deployment
- `api/admin/enquiries.js`: admin-only enquiry management endpoint
- `migrations/0001_trip_enquiries.sql`: database schema for trip enquiries
- `public/robots.txt`, `public/sitemap.xml`: search crawler instructions and sitemap

## Local preview
The `public` directory can be served as a static site for visual preview:

```bash
python -m http.server 8000 --directory public
```

Booking submission uses the deployed API by default. For a standalone local preview, configure `window.DIVINE_API_BASE` to the backend URL. The deployed website currently uses Hatchable's JavaScript API and PostgreSQL. The Django/DRF backend prepared separately must be deployed to a Python-capable host and configured before switching the form over to Django.

## Local SEO notes
The page title, meta description, content headings, FAQs and `TaxiService` JSON-LD target local services and locations. Only claim routes/availability that Divine Travels actually serves. Update the sitemap's canonical URL when a custom domain is connected, then submit it in Google Search Console. Local SEO work does not guarantee any particular search ranking.

## Deployment
This repository contains site source. The live website is currently hosted separately at https://divine-travels.hatchable.site. The hosting project may remain private until the owner changes visibility to Public. GitHub repository visibility and website-hosting visibility are separate settings.
