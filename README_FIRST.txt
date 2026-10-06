BALLIN' ON A BUDGET — GITHUB + LIVE DATA PACKAGE

This package is ready for the next step: putting the app on GitHub Pages.

WHAT IS INCLUDED
- index.html — the app
- data/deals.json — current external deal dataset
- manifest.webmanifest — installable PWA settings
- sw.js — service worker
- icons/ — app icons
- .github/workflows/pages.yml — automatic GitHub Pages deployment
- .nojekyll — GitHub Pages compatibility
- DATA_LAYER_README.txt — notes about the deal data layer

IMPORTANT
The app loads deal data from data/deals.json when hosted on HTTPS/GitHub Pages.
It also contains an embedded fallback snapshot so the app does not lose its deals
if the external JSON cannot be reached.

NEXT STEP
Do not change the app files yet.

When you're ready, I will walk you through GitHub one click at a time:
1. Create the GitHub repository.
2. Upload these files.
3. Commit them to main.
4. Turn on GitHub Pages using the included Actions workflow.
5. Open the live app URL.
6. Test the app on your phone and install it to the home screen.

After the live GitHub version is confirmed working, the next technical step is
connecting the deal data to a real database/backend so deals can be updated
without editing the app itself.
