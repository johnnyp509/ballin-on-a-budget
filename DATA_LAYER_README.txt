BALLIN' ON A BUDGET — DATA LAYER V1

Deal records now live in data/deals.json.
The app fetches that file first and automatically falls back to the embedded
323-deal snapshot if the data file is unavailable.

This is the bridge to the eventual database/API. It also means deal data can
be updated independently from the app UI code on GitHub Pages.
