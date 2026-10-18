# Showcase

Short animated stories for social posts, built with [Remotion](https://www.remotion.dev). Each story is a React component that renders to MP4.

Everything wears the Ceefax look from [marcomark.co.uk](https://marcomark.co.uk), so a video in someone's feed reads as one of mine before they've read a word.

## Running it

```bash
npm install
npm run dev       # Remotion Studio, scrub through and tweak live
npm run render    # writes MP4s to out/
npm run still     # writes a PNG thumbnail to out/
```

Remotion downloads its own headless Chrome the first time you render.

## Layout

- `src/kit/` shared building blocks: the teletext screen, header row, colour bands, typed text
- `src/stories/<story>/` one folder per video
- `src/Root.tsx` registers each story in 9:16 (phones) and 16:9 (desktop timeline)
- `public/fonts/` IBM Plex Mono, bundled so renders never depend on a font CDN

## Adding a story

1. Copy `src/stories/day-one/` and rewrite the scenes. The words should come from a post or note I've actually written.
2. Register it in `src/Root.tsx`.
3. `npm run dev`, check both shapes, then render.

## Stories

| Story | Source |
|---|---|
| Every Session Is Day One | [blog post](https://marcomark.co.uk/blog/every-session-is-day-one.html) |

## Licence

Remotion is free for individuals and companies of up to three people. See [remotion.dev/license](https://www.remotion.dev/license).
