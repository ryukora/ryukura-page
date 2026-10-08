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
robots.txt
sitemap.xml
site.webmanifest
eaa6ee8cf50535af48afce7cfa6e2a02.txt   IndexNow key (keep it at the site root)
assets/
  css/style.css
  js/main.js
  img/            optimized WebP / PNG art, icons, og-card.jpg
```

Fonts come from Google Fonts: Bricolage Grotesque, JetBrains Mono and Zen Maru Gothic.

## Run locally

```bash
python3 -m http.server 8000 --bind 0.0.0.0
```

Then open <http://localhost:8000>.

## Deploy

Upload everything in the repo except `README.md` to the root of any static host. Everything is plain files, nothing to build.

## Editing content

All text is in `index.html`. A few things are worth knowing:

- **Skill levels:** set with `data-level` on each `.gear` card. The △ pips are generated from it.
- **Birthday:** set with `data-date="YYYY-MM-DD"` on `#birthday`. Age and stats update from it.
- **GitHub stars:** any element with `data-repo="owner/name"` shows a live star count, and stays hidden if the API call fails.
- **HUD markers:** positioned with `--x` / `--y` as percentages of the artwork, so they stay pinned to the same spot at any screen size.

Accessibility: respects `prefers-reduced-motion` (no intro, meteors or parallax), works without JavaScript, and the layout holds down to 320px wide.

## SEO and link previews

Already in place:

- **Search:** descriptive title and description, canonical URL, `robots` meta allowing large image previews, `robots.txt`, and `sitemap.xml` (with image entries).
- **Structured data:** JSON-LD `WebSite` + `ProfilePage` + `Person` (job title, location, skills, and `sameAs` links to GitHub, X, Steam and the homepage).
- **Link previews:** Open Graph and Twitter Card tags with a 1200×630 card (`assets/img/og-card.jpg`). This covers Facebook, Discord, X, LinkedIn, WhatsApp, Telegram and Slack. `theme-color` sets the orange accent bar on Discord embeds.
- **Icons:** `favicon.ico`, 48px and 192px PNG icons (Google shows these in results), Apple touch icon, and a web manifest with a maskable icon.
- **Identity:** `rel="me"` links to GitHub and X.

### After deploying

1. **Google:** add the site in [Search Console](https://search.google.com/search-console). A *Domain* property verified by a DNS TXT record on `ryukura.biz.id` covers every subdomain. Submit `https://about.ryukura.biz.id/sitemap.xml`, then use *URL Inspection → Request indexing*.
2. **Bing:** in [Bing Webmaster Tools](https://www.bing.com/webmasters), choose *Import from Google Search Console* (or verify the same way) and submit the sitemap. DuckDuckGo, Yahoo and Ecosia get most of their results from Bing, so this covers them too.
3. **IndexNow** (Bing, Yandex, Seznam, Naver): ping it after each update so they recrawl straight away.

   ```bash
   curl "https://api.indexnow.org/indexnow?url=https://about.ryukura.biz.id/&key=eaa6ee8cf50535af48afce7cfa6e2a02"
   ```

4. **Check the results:**
   - [Rich Results Test](https://search.google.com/test/rich-results) and the [Schema Markup Validator](https://validator.schema.org/) for structured data.
   - [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) and [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/) for previews. Both also force those sites to re-fetch the page.
   - Discord and X show the preview when you paste the link into a message or post.

### When content changes

- Update `dateModified` in the JSON-LD and `<lastmod>` in `sitemap.xml`, then ping IndexNow.
- Social sites cache preview images for days. If you replace the card, give it a new filename (e.g. `og-card-2.jpg`) and update the `og:image` / `twitter:image` tags.

## Credits

Illustrations belong to their original artists. *Yuru Camp△* © あfろ・芳文社／野外活動委員会.
This is a non-commercial fan-themed personal page.
