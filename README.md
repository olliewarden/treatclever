# TreatClever

Static site: interactive comparison tool + blog (index.html) plus ~2,350
programmatic SEO pages generated at build time by generate.js.

Build: `node generate.js` (no dependencies). Output goes to `dist/`.
Netlify runs this automatically via netlify.toml.

To add/update wait-time or cost data, edit data.js, then rebuild.
