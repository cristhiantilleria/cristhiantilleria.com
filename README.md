# cristhiantilleria.com

Portfolio site for Cristhian Tilleria. Built with [Astro](https://astro.build) as a fully static site, with content managed in [Keystatic](https://keystatic.com) (a git-based CMS: content is plain YAML/MDX files committed with the code).

```sh
npm install
npm run dev      # dev server at http://127.0.0.1:4321, Keystatic admin at /keystatic
npm run build    # static site into dist/
npm run preview  # serve dist/ locally
```

Requires Node 22.23.4 or newer.

## Editing content with Keystatic

1. Run `npm run dev`.
2. Open http://127.0.0.1:4321/keystatic.
3. Edit and press **Save**. Keystatic writes straight to the files in `src/content/` (and uploads to `public/media/`) on your machine; nothing is sent anywhere.
4. Commit and push the changed files. Pushing to `main` deploys.

The admin only exists while the dev server runs. `npm run build` leaves Keystatic out, so production is plain static HTML with no server routes and no admin.

What lives where:

| In Keystatic | File | Used on |
| --- | --- | --- |
| **Projects** (collection) | `src/content/projects/<slug>.mdx` | `/work`, `/work/<slug>` |
| **Site content** (singleton) | `src/content/site.yaml` | email, booking link, status, hero intro, about statement and portrait, ticker, services, process steps, social links, search description |
| **Lab (visuals)** (singleton) | `src/content/visuals.yaml` | `/visuals` canvas |

- A project's file name is its URL slug. Its optional extra case study text is the MDX body under the front matter.
- Projects are ordered by **Order** (1 first); untick **Show on site** to hide one.
- **Images:** uploads go to `public/media/`. On Vercel they are resized automatically when served.
- **Share previews:** an optional 1200×630 JPG at `public/media/share/<page>.jpg` (for example `work-level-up.jpg`) is used as that page's link preview.

## Code

- `src/pages/` — one route per page: `/`, `/work`, `/work/[slug]`, `/visuals` (shown as "Lab"), `/about`, `/contact`, `404`, plus `sitemap.xml` and `robots.txt`.
- `src/layouts/Base.astro` — the shared shell: head/meta/JSON-LD, loader, grid guides, header, footer, image viewer.
- `src/styles/global.css` — all styles.
- `src/scripts/site.js` — all behaviour: Lenis smooth scroll, curtain page transitions, reveals, water/SVG displacement headings, cursor tag, magnetic buttons, contact form, booking overlay, Lab canvas. `src/scripts/cal.js` — the Cal.com embed and its theme.
- `src/lib/content.ts` — reads Keystatic content with its reader at build time.
- `keystatic.config.ts` — the content schema.
- `public/` — favicon, manifest and media, copied as-is.
- `archive/legacy/` — the previous `build.js` + `template.html` build, for reference only.

Pages are real HTML files; the site script fetches the next page and swaps its `.view` in behind the transition.

## Publishing

Pushing to `main` builds and deploys to https://www.cristhiantilleria.com on Vercel (`vercel.json`: framework Astro, output `dist`, redirects from the old `/projects`, `/design` and `/photography` paths).

The contact form sends through FormSubmit to the email in `src/content/site.yaml`.

The site that was here before the current design is kept on the `old-site` branch.
