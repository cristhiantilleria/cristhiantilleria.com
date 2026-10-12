# cristhiantilleria.com

Portfolio site for Cristhian Tilleria. Static HTML, no framework and no dependencies.

`node build.js` combines `src/template.html` with the content in `content/` and writes one HTML page per view into `dist/`.

## Editing

- **Content:** sign in at https://app.pagescms.org and open this repository, or edit the JSON in `content/` directly.
  - `content/site.json`: contact email, booking link, services, process steps, social links, search description.
  - `content/projects/`: one file per project (cover, gallery, approach, summary).
  - `content/visuals.json`: the pieces on the Visuals canvas.
- **Images:** uploads go in `media/`. On Vercel they are resized automatically when served.
- **Share previews:** an optional 1200×630 JPG at `media/share/<page>.jpg` (for example `work-level-up.jpg`) is used as that page's link preview.
- **Design and behaviour:** `src/template.html` holds all markup, styles and scripts.
- **Favicon and other root files:** `static/`.

## Publishing

Pushing to `main` builds and deploys to https://www.cristhiantilleria.com on Vercel.

The contact form sends through FormSubmit to the address in `content/site.json`.

The site that was here before this version is kept on the `old-site` branch.
