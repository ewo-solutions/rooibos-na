# Rooibos North America website

Static site (no build step needed to run). Deploy the repo root to Netlify.

- Pages: `/`, `/products/`, `/about/`, `/certifications/`, `/news/`, `/contact/`
- `css/site.css`, `js/site.js` — styles, curtain load, scroll reveals, product carousel
- `assets/` — **images and PDFs go here** (`assets/*.jpg`, `assets/certs/*.pdf`), filenames exactly as in the design handoff
- `tools/` — converter that generated the pages from the Claude Design prototype (reference only)

Local preview: `npx serve .`
