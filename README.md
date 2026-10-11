# Cristhian Tilleria — portfolio

Static site. `node build.js` combines `src/template.html` with the content in `content/` and writes `dist/`.

- **Edit content:** sign in at https://app.pagescms.org and open this repository, or edit the JSON in `content/` directly.
- **Projects:** one file per project in `content/projects/`. Images go in `media/`.
- **Design and behaviour:** `src/template.html`.
- **Deploy:** pushes to `main` build and deploy on Vercel.

- **Brand reels:** `tools/reels/` holds the Blender script and one storyboard per project. From the repo root: `Blender -b -P tools/reels/reel.py -- tools/reels/level-up.py media/projects/level-up/reel.mp4 1680 640`.
