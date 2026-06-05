# alive painting gallery

A small one-room exhibition site by Jessy.
Lives at **[gallery.jessylab.cc](https://gallery.jessylab.cc)**.

Each painting in a show stands as a still on a warm-white wall.
Hover one and it begins to breathe — the painting fades into a
short looping motion. Move away and it returns to rest, and the
video resets to its first frame so the next visitor starts from
the painting again.

The first show, **Picasso, Once More Breathing.**, takes a handful
of Picasso pieces and lets them breathe for a moment.

## Stack

- Vite + React 19 + Tailwind CSS v4
- Same vite-dev-in-prod pattern as `jessylab.cc` —
  systemd runs `pnpm dev`, nginx reverse-proxies with Let's Encrypt TLS
- Assets in `public/works/<show-id>/`, referenced from `src/data/works.ts`

## Add a work

1. Drop a static image (and an optional matching motion video) into
   `public/works/<show-id>/`. Encoding: `.webp` / `.jpeg` for stills,
   `.mp4` for motion.
2. Add an entry in `src/data/works.ts`:
   ```ts
   {
     id: 'kebab-slug',
     title: '中文画名',
     titleEn: 'English Title',
     year: 1937,                              // null = unknown
     staticSrc: `${ROOT}/中文画名.webp`,
     motionSrcs: [`${ROOT}/动起来.mp4`],       // [] = static only
     note: '可选的策展说明',
   }
   ```
3. The list reorders itself so motion works appear first. A new entry
   becomes a `no. NN` station in the museum walk automatically.

If a work has multiple motion takes (e.g. moving-camera vs. fixed),
split it into two entries — each gets its own hover-alive moment.

## Add a show

The current build is single-show by URL convention. To add a second
show later, the cleanest move is to wrap `WorksList` in a route and
add a top-level overview at `/`. The data shape (`works.ts`) already
keys works by `id` so the partition is cheap.

## Local dev

```sh
pnpm install
pnpm dev          # http://127.0.0.1:5174
```

## Deploy

Production runs the dev server behind nginx:

- systemd unit: `/etc/systemd/system/alive-gallery.service`
  (User=jessy, ExecStart=`pnpm dev --host 127.0.0.1 --port 5175`,
  Restart=on-failure)
- nginx site: `/etc/nginx/sites-available/gallery.jessylab.cc`
  reverse-proxying to `127.0.0.1:5175` with ws upgrade headers
- TLS via certbot --nginx (auto-renews via `certbot.timer`)
- DNS: A record `gallery.jessylab.cc → 8.216.48.63` (Namecheap)

Ship a new version:

```sh
# locally
git push origin main

# on server
ssh root@8.216.48.63
cd /home/jessy/alive-painting-gallery
sudo -u jessy git pull --ff-only
systemctl restart alive-gallery
```

Restart is needed because vite plugins are loaded once at startup.
Cold boot is ~5s; nginx keeps serving the old version until the new
process binds.

### Adding a hostname

If you ever change the hostname or add another, update
`vite.config.ts` `server.allowedHosts` — without it the dev server
returns 403 for any host other than localhost.
