# Ryukura △ Solo Camp

Personal portfolio for **Ryukura**, IT enthusiast and home lab architect from Depok, Indonesia.
Live at [about.ryukura.biz.id](https://about.ryukura.biz.id/).

The theme is Shima Rin from *Yuru Camp△*: the page follows one of her solo trips, from dusk to night to a campfire.

## Sections

| Section | What's there |
| --- | --- |
| **Hero** | Rin at dusk (or riding her scooter on phones), live WIB clock, HUD markers, sky darkens as you scroll |
| **01 · Basecamp** | About, plus personal info as a "solo camper permit" (age is calculated automatically) |
| **02 · Loadout** | Skills as camping gear, rated with △ out of ten |
| **Interlude** | Animated Mt. Fuji / Lake Motosu night scene with labelled HUD markers |
| **03 · Trail log** | Projects and services on a scroll-drawn route (live GitHub stars for BEBASID) |
| **04 · Rin** | Field notes and a gallery with a lightbox |
| **05 · Signals** | Links over a pixel campfire with rising embers |

Small extras: a short intro (once per session, skippable), shooting stars tagged as "network packets", a 🔥 button that plays procedurally generated campfire sound (Web Audio, no files), a chibi Rin who lights the fire when clicked, another one who peeks in at the end, and a meteor shower if you click the △ logo five times.

## Stack

Plain static site with no build step and no dependencies.

```
index.html
favicon.ico
assets/
  css/style.css
  js/main.js
  img/            optimized WebP / PNG art
```

Fonts come from Google Fonts: Bricolage Grotesque, JetBrains Mono and Zen Maru Gothic.

## Run locally

```bash
python3 -m http.server 8000 --bind 0.0.0.0
```

Then open <http://localhost:8000>.

## Deploy

Upload `index.html`, `favicon.ico` and `assets/` to any static host. Nothing else is needed.

## Editing content

All text is in `index.html`. A few things are worth knowing:

- **Skill levels:** set with `data-level` on each `.gear` card. The △ pips are generated from it.
- **Birthday:** set with `data-date="YYYY-MM-DD"` on `#birthday`. Age and stats update from it.
- **GitHub stars:** any element with `data-repo="owner/name"` shows a live star count, and stays hidden if the API call fails.
- **HUD markers:** positioned with `--x` / `--y` as percentages of the artwork, so they stay pinned to the same spot at any screen size.

Accessibility: respects `prefers-reduced-motion` (no intro, meteors or parallax), works without JavaScript, and the layout holds down to 320px wide.

## Credits

Illustrations belong to their original artists. *Yuru Camp△* © あfろ・芳文社／野外活動委員会.
This is a non-commercial fan-themed personal page.
