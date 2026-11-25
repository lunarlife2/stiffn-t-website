# Stiffn't website

The website for **Stiffn't**, the macOS menu-bar app where Steven, a black cat, reminds you to take stretch breaks.
It uses the app's own design system (colors, fonts, buttons, hand-drawn outlines, sticker boxes), copied from the
Xcode project.

Author: Yimei Winata

- `/`: Home (hero, about, how it works, Laser, accessories, get the app)
- `/photobooth`: a single photo or a 3-photo strip with Steven, his accessories and a Steven frame (camera only; everything stays on the device unless the visitor chooses "Get it on my phone")
- any other URL: the 404 page

## Run it

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build
npm run lint
```

Built with Next.js (App Router), TypeScript, Tailwind CSS 4 and npm. No database, login, analytics or cookies. The only
server feature is the Photobooth's "Get it on my phone" (see [Photobooth QR setup](#photobooth-qr-setup)).

## Deploy to Vercel

1. Push this folder to a GitHub repository.
2. On vercel.com, choose **Add New → Project** and import the repository.
3. Framework preset: **Next.js**. Keep the defaults (`npm run build`). If the repository root is not this folder, set
   **Root Directory** to it.
4. Deploy. Page links in shared previews (Open Graph) use the production domain automatically
   (`VERCEL_PROJECT_PRODUCTION_URL`).

## Where to put your links

Everything you fill in later is in **`src/config/site.ts`**, and nowhere else:

- `downloadUrl`: the TestFlight link (`https://testflight.apple.com/join/EPH1D269`). Every "Download for Mac"
  button (header, hero, get the app) and the footer's Download link read it, and open it in a new tab.
- `social.instagram`, `social.tiktok`: full URLs. An empty link hides its icon; if both are empty, "Follow us" is
  hidden too. (Both are still empty.)
- `studio`: the name in the footer's copyright line.

## Draft copy

All website text written for the site is marked `// DRAFT COPY` (or `{/* DRAFT COPY */}`) in the code. Search for
`DRAFT COPY` to review it. Interaction names and descriptions, accessory names, prices and streak numbers come from
the app's code (see `src/config/catalog.ts`).

The footer doesn't link the font license. The Darumadrop One license file stays next to the font in `src/fonts/`,
as the SIL Open Font License requires.

## Design system

- **Tokens:** `src/styles/tokens.css`. Every value is noted with the app file it came from. Tailwind reads them
  (`src/app/globals.css`, `@theme inline`), so `bg-green-primary-500`, `font-display` and so on use the app's values.
- **Type scale:** the app's sizes are macOS points. On the web, every size is multiplied by **16 / 13 ≈ 1.23**
  (`--type-scale`), so Body 13 → 16px, Title 2 17 → 21px, Title 1 22 → 27px, Large Title 26 → 32px,
  page titles 30 → 37px. The ratios between levels stay the same. Button and pill heights use the same scale
  (36 → 44px).
- **Fonts:** Darumadrop One is loaded from `src/fonts/` with `next/font/local`. SF Pro Rounded is not copied (Apple's
  license doesn't allow web use): text uses `ui-rounded, "SF Pro Rounded", Nunito, system-ui`, with Nunito loaded from
  `next/font/google` as the fallback.
- **Components** (`src/components/`): `Button` (primary, secondary, tertiary, underlined, neutral, destructive,
  positive, warning, sidebar × normal, hover, pressed, disabled), `BrushStroke` (a line-for-line port of
  `BrushStroke.swift`, same seeds, so it wobbles the same way; algorithm in `src/lib/brushStroke.ts`), `Panel` / `Card`,
  `Badge` ("Active"), `Sunburst`, `SegmentedPill`, `Header`, `Footer`, `MobileMenu`.
- **Keyboard focus:** the app has none, so the website adds a second BrushStroke ring (black, lineWidth 3, seed 7,
  4px outside the element).

## Assets copied from the app

Copied from `Sunrise/Stretchy-Lah!/` in [lunarlife2/Sunrise-Challenge](https://github.com/lunarlife2/Sunrise-Challenge)
at commit `51b2b38`. The website never links to the app folder.

| Website | From the app |
| --- | --- |
| `src/fonts/DarumadropOne-Regular.ttf`, `DarumadropOne-OFL.txt` | `Resource/Fonts/` |
| Site icon: `src/app/favicon.ico` (16, 32, 48), `src/app/icon.png` (512), `src/app/apple-icon.png` (180, no transparency); header logo `public/images/ui/app-icon.png` | `Resource/Assets.xcassets/AppIcon.appiconset/Stiffn't_App Icon.png` (the app icon), scaled down. Next.js links them from `src/app/` itself; there is no web manifest |
| `public/images/steven/steven-front-facing.svg` / `.png` | `steven-front-facing.imageset`, `steven-front-facing-png.imageset` |
| `public/images/steven/steven-picked-up.png`, `steven-loafing.png` | `steven-pick/steven-picked-up-png.imageset`, `steven-loaf/steven-loafing.imageset` |
| `public/images/steven/steven-sitting.png` | the 8 `steven-sit/*` layers (810 × 810, same canvas), stacked in the app's order into one picture |
| `public/images/steven/steven-stretching.png` (+ `-body`, `-tail`) | the 6 `steven-buddy/steven-buddy-stretch-*` layers (1080 × 1080), stacked in the app's order (the hero animates the tail as its own layer). `public/images/steven/small/` holds 760px copies of `-body` and `-tail` for the hero |
| `public/images/steven/steven-heart-eyes.png`, `steven-happy.png` (Photobooth stickers) | `steven-summary/summary-heart-eyes.imageset`, `summary-squint.imageset`, as they are |
| `public/images/steven/steven-crouching.png` (Photobooth sticker) | `steven-vomit/vomit-1.imageset` (SVG), drawn at 2× (540 × 660) and centred on a 660 × 660 square like the other stickers |
| `public/images/accessories/*.png` | `crown`, `glasses`, `bow`, `bow-blue`, `wings`, `wings-pink` image sets. `accessories/small/` holds 270px copies of crown, glasses and bow for the Home cards |
| `public/images/interactions/laser.png` | `laser.imageset` |
| `public/images/mystery-box/*.png` | `mistery-box/mystery-box-base.imageset`, `mystery-box-lid.imageset` |
| `public/images/stretch/body-stretch.png` | `dashboard-stretch/body-stretch.imageset` |
| `public/images/ui/coin.png`, `stroke-sidebar.png` | same-named image sets |

The image sets have one file each (no separate `@2x` files), so those files were copied as they are.

**Videos:** the app has no per-interaction videos (every Shop card plays the placeholder `Resource/1101.mp4`).
The Laser preview in `public/videos/` was made from the owner's recording (kept locally in `assets/interaction-videos/`,
ignored by git): 960px wide, H.264 CRF 28, no audio, `faststart`, 0.2 MB. The poster in
`public/videos/posters/` are frame 1 s of each. To re-make one:

```bash
ffmpeg -i assets/interaction-videos/laser_preview.mp4 -an -vf "scale=960:-2:flags=lanczos,fps=30" \
  -c:v libx264 -profile:v high -pix_fmt yuv420p -preset slow -crf 28 -movflags +faststart public/videos/laser.mp4
ffmpeg -ss 1 -i public/videos/laser.mp4 -frames:v 1 -vf "scale=640:-2" -q:v 4 public/videos/posters/laser.jpg
```

## Photobooth output

One layout for both modes (`src/lib/photobooth.ts`, `PAPER`), used by the live preview and the PNG:

- **1200 px wide**. Photo slots are **4:3, 1080 × 810**, 60 px margins at the sides and top, 40 px between slots,
  6 px black outline, corner 24. Footer 260 px: "Stiffn't" (Darumadrop, 110 px) and the date (40 px).
- **Single photo: 1200 × 1130 px.** **Strip: 1200 × 2830 px.**
- Files: `stiffnt-photo-YYYY-MM-DD-HHmm.png` and `stiffnt-strip-YYYY-MM-DD-HHmm.png`.
- **Frames** (Steven on the edges, never over the middle of a photo): Classic, Hanging (picked-up pose),
  Stretch (stretching pose), Corner (sitting pose), Sleepy (loafing pose), and a ×20 version of each pose (Standing,
  Sitting, Hanging, Sleepy, Stretch ×20: small copies of that pose, 110 px, spread all round the edges (20 on the preview and a single photo, about 38 on a strip) and
  clear of the printed name and date). **Colours**: Cream, Green,
  Yellow, and the sunburst in green (the app's), yellow, blue and orange. Any frame works with any colour, in both modes.
- Stickers can be placed before "Take photo" and are locked from then until Retake or Cancel. They're the same on all
  3 photos of a strip.
- Setting up, the page fits the window: the live preview is one 4:3 photo (frame, colour and stickers on it, no printed
  footer), sized by the height left on screen, with the Frames / Colour / Stickers panel beside it (under it on
  phones). The site footer is hidden until the result screen.
- No photo upload as a fallback: if the camera is blocked or missing, the page explains how to allow it.

## Photobooth QR setup

"Get it on my phone" uploads one finished photo or strip, **only when the visitor presses "Upload and show QR"**, so
they can open it on their phone at `/p/<id>`. Everything else in the Photobooth stays on the visitor's device.

### 1. Create the Blob store

1. In the Vercel dashboard, open the project → **Storage** → **Create Database** → **Blob**.
2. Choose **Private** access, give it a name (e.g. `stiffnt-photobooth`), and **Connect** it to the project
   (all environments).
3. Vercel adds `BLOB_READ_WRITE_TOKEN` to the project's environment variables by itself.

### 2. Environment variables

Set these in **Project → Settings → Environment Variables** (never commit them; `.env.example` lists them empty):

| Variable | What it is |
| --- | --- |
| `BLOB_READ_WRITE_TOKEN` | Added when you connect the Blob store. Lets the site save and read photos. |
| `CRON_SECRET` | Any long random string (e.g. from a password manager). Vercel sends it to the clean-up job; anyone without it gets "Unauthorized". |

Redeploy after adding them. For local testing, `npm run dev` without a token saves photos to `.photobooth-dev/`
(git-ignored) instead of Blob; production always uses Blob.

### 3. Auto-delete after 24 hours

- `vercel.json` runs `/api/cron/cleanup` **once a day** (03:00 UTC), which deletes every photo older than the
  lifetime. Once a day is the most the free Hobby plan allows; on Pro you can change the schedule to `"0 * * * *"`
  (hourly).
- Photos are never served straight from Blob: the page `/p/<id>` and the picture `/api/photo/<id>` check the photo's
  age on every request and treat anything older than the lifetime as gone. So for visitors a photo expires at exactly
  24 hours, even if the daily clean-up hasn't removed the file yet.
- To change the time, edit `photoLifetimeHours` in `src/config/site.ts` (the page texts follow it).

### Limits and privacy

- PNG or JPEG only, checked from the file's own bytes; at most `maxUploadMB` (4 MB: Vercel functions accept at most
  4.5 MB per request). A PNG bigger than that is uploaded as a JPEG (quality 0.9) instead; the download stays PNG.
- At most `uploadsPerHour` (10) per visitor (IP) per hour. This is counted in each server instance's memory, so it's
  best effort: a new instance starts at zero. Hashed IPs are kept for an hour and never logged.
- Links use a random 24-character id (about 143 bits), so they can't be guessed; there's no list of photos anywhere.
  `/p/<id>` and the picture are `noindex, nofollow`.

### Cost

Vercel Blob has a free allowance for storage and data transfer each month. Photos are small and deleted within a day,
so normal use should stay inside it. If the Photobooth gets very popular and goes past the free allowance, Vercel
either bills the extra (Pro) or limits the store until you upgrade (Hobby); check Vercel's Blob pricing page for the
current numbers and **Usage** in the dashboard.

## Not found in the app's code, or changed for the web

- **Dark mode:** the app's color sets have no dark values, so the site is light only.
- **Focus style:** not in the app; the BrushStroke ring above was added with the owner's OK.
- **Hero title size** (64–120px) and the hero layout: the app has no hero; the white Darumadrop with a hard black shade
  follows StreakView's streak count. Steven is sized by the window's height too, so Steven, the name, the pitch and
  Download fit in the first screen (stacked on phones and tablets, side by side from 900px).
- **Home order:** hero (slogan "Stiffn't With Steven"), Meet Steven (with what the app is for; there is no separate
  About section), How it works, Laser, Accessories, Photobooth card, Get Stiffn't.
- **Section gap:** one website-only `--section-gap` in `globals.css` (64px, 48px on phones) between all Home sections.
- **Large button:** `large` on `Button` / `DownloadButton` (4/3 of the app's button) for the two main Download buttons.
  Small buttons, header and footer links are at least 44px tall to tap.
- **"Active" badge:** 19px bold instead of 13 × scale medium, so white on greenPrimary500 passes the large-text
  contrast rule.
- **Header:** built from the app's sidebar (`MainView.swift`: greenPrimary200 → 300 gradient, 1.5 black outline,
  `.sidebar` tabs).
- **Laser card:** shows a visible play/pause button (the app plays on hover only); its blurb from `PlayMode.swift`
  sits beside the card.
- **Accessories on Steven:** each card shows a different pose wearing one accessory, placed with that pose's spots
  (`AccessorySpots.sitting`, `.pickedUp`, `.loafing`). The app has no single picture of Steven wearing an accessory.
- **System requirements:** `MACOSX_DEPLOYMENT_TARGET = 26.6`. That a camera is needed is draft copy.
- **Next.js config:** `next.config.ts` ran every `*.css` file through the Tailwind loader, which broke CSS Modules;
  it now skips `*.module.css`.
