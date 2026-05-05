# Meal Tracker

A mobile-first, single-page meal tracker for the **80 Day Obsession Plan E** nutrition program (2,300–2,499 cal). One user, no auth, no backend. Pure HTML/CSS/JS — no build step, no dependencies.

## Run it

Open `index.html` directly in a browser, or serve the folder statically:

```sh
python3 -m http.server 8000
# then visit http://localhost:8000
```

For phone access, host the folder anywhere static (GitHub Pages, Netlify drop, S3, etc.) or serve from your laptop on the local network.

## First run

You'll be asked to set your **program start date** (Day 1). Everything derives from that:
- Current program week (1–12)
- Rotation week (1, 2, or 3 — repeats 4× over 12 weeks)
- Today's day-of-week menu

## Daily use

The "Today" view shows your 7 meal slots + workout marker for the current day. The slot whose time matches "now" is highlighted with a **NOW** badge — that's what to eat next.

- **Tap a meal** to mark it done. Container progress updates.
- **Tap a water dot** to log ~10 oz toward the 123 oz daily target.
- Done meals dim and strike through. State auto-saves to `localStorage`, scoped per date.

## Other views

- **📅 Week overview**: full Mon–Sat dinner list for the current rotation week. Tap a day for its full meal plan.
- **⚙ Settings**: change start date, reset today, export/import all state as JSON.

## Files

```
index.html   # Markup shell
styles.css   # Dark theme, mobile-first
data.js      # Meal rotation tables + slot definitions (Plan E)
app.js       # State, date math, render, event handlers
```

Sunday is treated as a rest day: 5 evenly spaced meals, no workout block, same daily container totals.

## Data persistence

Everything lives in `localStorage` under the `mealtracker:` namespace:
- `mealtracker:startDate` — your Day 1
- `mealtracker:checked:YYYY-MM-DD` — checked-off meals per day
- `mealtracker:water:YYYY-MM-DD` — ounces logged per day
- `mealtracker:view` — last view (today / week)

Use **Settings → Export** to copy your state, **Import** to restore. Clearing browser storage will wipe everything; export first.
