# Andy's training plan app

A small offline web app (PWA) with Andy's two plans: the HYROX Stockholm detailed plan (27 Oct to 11 Dec 2026) and the 2026–27 season plan v3. Each plan is in Chinese and English.

Live site: https://andyxuedct.github.io/Training-Plan/

## On iPhone

Open the link in Safari, tap Share, then Add to Home Screen.

## What it does

- Swipe left and right (or tap the switch at the top) between the two plans.
- 中 / EN switches the language.
- Today's session shows at the top of the HYROX plan, and the race countdown sits in the header.
- Every day has "Mark done" and a log for time, distance, pace, heart rate, RPE and weights. The log stays in the phone's browser storage; 📋 shows it, copies it as text, or exports and imports a backup.
- Works offline after the first visit. When the plan changes here, the phone picks it up the next time it opens online.

## Updating the plan

The plan text comes from the four designed plan pages. Save their full HTML as `detailed-en.html`, `detailed-zh.html`, `v3-en.html` and `v3-zh.html` in one folder, then run:

```
python3 tools/build.py path/to/folder
```

That rewrites `content/` and bumps the service-worker version. Commit and push to `main`; GitHub Pages republishes in a minute or two.

## Apple Calendar

`calendar.ics` is a subscribable feed with one all-day event per day of the HYROX plan (Chinese, then English, in the notes). On iPhone: Settings → Apps → Calendar → Calendar Accounts → Add Account → Other → Add Subscribed Calendar, and paste `https://andyxuedct.github.io/Training-Plan/calendar.ics`. The app's 📋 sheet also has a one-tap subscribe button. `tools/build.py` rebuilds the feed; `python3 tools/calendar_feed.py SITE_URL` rebuilds it on its own.
