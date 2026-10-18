# CLAUDE.md

Animated stories for Marco Mark's social posts, rendered to video with Remotion. The words come from Marco; the visuals are Claude's.

## This repo is public

Anything committed here can be read by anyone. Nothing about employers, clients, colleagues, internal tools or figures, even in a commit message, a placeholder or a comment. If a story touches work, keep it generic ("a real ticket from work"). When unsure, leave it out and ask.

## No house style

Like marcomark.co.uk, every story gets its own look, chosen to suit what it's saying. Retro computing, 80s/90s, surf and tiki, clean Swiss, something new: all fair game. Don't reuse a previous story's look by default, and don't promote one into `src/kit/`. The kit holds only style-free helpers (sizing, formats). If a new story genuinely wants an existing look, import it from that story's folder on purpose.

## Marco's ideas, your craft

Treat what Marco gives you as guidance, not a script. Work out why the idea matters and where it lands hardest, then shape the words, pacing and visuals to fit. Rewrite, cut and tighten freely. What you can't do is invent opinions, facts or experiences he hasn't had: the substance comes from his posts, drafts or messages, and the story's header comment names the source.

## Workflow

- One folder per story in `src/stories/`, registered in `src/Root.tsx` in both formats (9:16 and 16:9).
- Check stills of a few key frames in both shapes before rendering the whole thing; vertical is where things overflow.
- Render full quality to `out/` (gitignored), then commit 720p previews to `renders/<story>/` (`vertical.mp4`, `landscape.mp4`, `still.jpg`) at a few MB each, and add a row to the README's Watch table.
- Renders are slow on 4 cores. Avoid per-frame SVG filters (feTurbulence on every sheet made a 60s render crawl); bake textures into PNGs instead.
- Bundle fonts in `public/fonts/<font>/` with their licence. Never load fonts from a CDN at render time.
- `npm run typecheck` must pass.

## Writing

British English. Write as Marco speaks. No em dashes or AI-sounding phrasing.
