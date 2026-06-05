# alive painting gallery

A small one-room exhibition site by Jessy.

Each painting in a show stands as a still on a warm-white wall.
Hover one and it begins to breathe — the painting fades into a
short looping motion. Move away and it returns to rest.

The first show, **Picasso, Once More Breathing.**, takes a handful
of Picasso pieces and lets them breathe for a moment.

Lives at `gallery.jessylab.cc`.

## Stack

- Vite + React 19 + Tailwind CSS v4
- Same vite-dev-in-prod pattern as `jessylab.cc` —
  systemd runs `pnpm dev` behind nginx + Let's Encrypt
- Assets in `public/works/<show-id>/` — referenced from
  `src/data/works.ts`

## Add a show / a work

1. Drop static + motion files into `public/works/<show-id>/`
2. Add a `Work` entry in `src/data/works.ts`
   (`motionSrcs: []` for static-only; the layout falls back)
3. The list re-orders itself so motion works appear first

## Local dev

```sh
pnpm install
pnpm dev          # http://127.0.0.1:5174
```
