# Cristhian Tilleria — portfolio

Static site. `node build.js` combines `src/template.html` with the content in `content/` and writes `dist/`.

- **Edit content:** sign in at https://app.pagescms.org and open this repository, or edit the JSON in `content/` directly.
- **Projects:** one file per project in `content/projects/`. Images go in `media/`.
- **Design and behaviour:** `src/template.html`.
- **Deploy:** pushes to `main` build and deploy on Vercel.

- **Cover videos:** `tools/render-cover.py` renders a looping gallery-wall clip from a project's images with Blender, e.g. `Blender -b -P tools/render-cover.py -- out.mp4 960 720 120 0 img1 img2 ...`.
