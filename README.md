# Geography Notes — Climatology integrated

## Ready-made website
Upload the files and `assets/` folder (preserving folder structure) to your site root. Open `index.html#book`, then select **Climatology · Neetu Singh (Part 2 of 14)**.

## Existing Geography Notes repo (important)
If your repo already has content in `notes.json`, **do NOT replace that file with the one in this package**. Instead, append the object from `notes-entry.json` into your existing JSON array. Also upload `climatology-neetu-singh-part-2.html` and the `assets` folder. Your original `index.html` can remain unchanged because it already supports the `tab: book` property and `file` links. `manifest.json`, `sw.js`, and the icons are optional replacements; preserve your existing versions if they are customized.

Example `notes.json` with existing notes:
```json
[
  { "tab": "notes", "subject": "Cartography", "title": "Existing note", "file": "cartography.html" },
  { ...the object from notes-entry.json... }
]
```
The ellipsis above is a placeholder, not valid JSON. Paste the actual full object. Remove duplicate entries if already present.

## Hosting
This is static HTML/JSON and works on GitHub Pages, Netlify or any static host. It must be served via HTTP(S): a raw `file://` index page cannot use `fetch('notes.json')` in all browsers.
The service worker saves local pages and seven original schematic diagrams for offline use after an initial online visit. Original third-party illustration links and Google fonts require internet connectivity.

## Content integrity
Based on the supplied `Pasted text(1).txt` (source preserved as `source-climatology.md`). Includes the source overview, 11 chapters, all 100 original question texts with four options and explanations, and the final revision sheet. This is not a reproduction of the underlying 90-page handwritten PDF; it integrates the provided generated text.
