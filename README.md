# Table & Vine — Inventory Tracker

Inventory tracker for the Beer/Wine/Spirits department at Table & Vine, Big Y Franklin.

Zero dependencies. Runs entirely in the browser using localStorage.

## Quick start

Open `index.html` in any browser. That's it — no install, no server.

## Installing as a PWA on iPhone

Service workers and PWA install require serving over HTTPS (or localhost).
The easiest free option is GitHub Pages:

1. Push this folder to a GitHub repo.
2. Go to **Settings > Pages** and set the source to the `main` branch.
3. Open the published URL in Safari on your iPhone.
4. Tap **Share > Add to Home Screen**.

The app caches itself offline — after the first load it works without internet.

## Data storage

All inventory data lives in the browser's localStorage. It persists across
sessions but is tied to that browser on that device. Use the CSV export on the
Summary tab to back up your data.
