# alive painting gallery

A small one-room exhibition site.
Lives at **[gallery.jessylab.cc](https://gallery.jessylab.cc)**.

You stand in the centre of a rotunda. Eleven Picasso paintings hang
around you. Hover one — it breathes (silent). Click it — the camera
steps closer and the sound turns on. ESC backs you out to the centre.

## Stack

- Vite + React 19 + Tailwind CSS v4 + three.js / @react-three/fiber
- Same vite-dev-in-prod pattern as `jessylab.cc`: systemd runs `pnpm dev`,
  nginx reverse-proxies with Let's Encrypt TLS
- Assets in `public/works/<show-id>/`, referenced from `src/data/works.ts`

---

## Local dev

```sh
pnpm install
pnpm dev          # http://127.0.0.1:5174
```

## Server

- Host: `ssh root@8.216.48.63` (Aliyun ECS, Ubuntu 24.04)
- Repo path: `/home/jessy/alive-painting-gallery` (owned by `jessy`)
- Service: `systemctl status alive-gallery`
- Logs:    `journalctl -u alive-gallery -f`

⚠ Aliyun anti-abuse blocks rapid SSH. Bundle commands in a single ssh
invocation rather than firing many short ones.

## Ship a new version

```sh
# locally — commit, push
git push origin main

# on the server — pull, restart
ssh root@8.216.48.63 'cd /home/jessy/alive-painting-gallery \
  && sudo -u jessy git pull --ff-only \
  && systemctl restart alive-gallery'
```

Cold boot ~5s. Nginx keeps serving the old version until the new
process binds, so visitors don't see a 502.

---

## Add a work to the current show

1. Drop a static image (and an optional matching motion video) into
   `public/works/picasso-in-motion/`. Encoding: `.webp` / `.jpeg` for
   stills, `.mp4` for motion. Chinese filenames are fine — they're
   URL-encoded at render time.

2. Add an entry in `src/data/works.ts`:
   ```ts
   {
     id: 'kebab-slug',
     title: '中文画名',
     titleEn: 'English Title',
     year: 1937,                           // null = unknown
     staticSrc: `${ROOT}/中文画名.webp`,
     motionSrc: `${ROOT}/动起来.mp4`,       // null = static-only
   }
   ```
3. Push → SSH-restart as above.

> Note: works without `motionSrc` are filtered out of the rotunda today —
> static-only entries don't render at all. Add the motion file before
> committing the data entry, or comment the entry until the video is ready.

## Add a new show

Each show lives in its own asset folder `public/works/<show-id>/`. To add
a second show alongside Picasso, the cleanest move is to:

1. Make `works.ts` export multiple arrays keyed by show id.
2. Add a tiny route layer (the data shape already keys by `id`, partition
   is cheap).

Not built today because the current show is single. Cross that bridge
when the second show is ready.

## Hostname / TLS

- DNS: A record `gallery.jessylab.cc → 8.216.48.63` (Namecheap)
- Cert: `certbot --nginx` (auto-renews via `certbot.timer`)
- Nginx site: `/etc/nginx/sites-available/gallery.jessylab.cc`

If you change the hostname or add another, update
`vite.config.ts` `server.allowedHosts` — without it the dev server
returns 403 for any host other than localhost.
