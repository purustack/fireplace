# Fireplace on Vultr

## Recommended setup

| Piece | Choice |
|-------|--------|
| App host | Vultr Cloud Compute (Ubuntu 24.04) |
| Database | Neon (already connected) |
| Runtime | Docker Compose (`app` + Caddy) |
| TLS | Automatic via Caddy (needs a domain) |

## What you need to provide

1. **Vultr VPS** — Ubuntu 24.04, at least **1 vCPU / 2 GB RAM** (2 GB+ preferred for Next.js builds)
2. **SSH access** — root or sudo user + IP (or add this machine’s SSH key to the VPS)
3. **Domain (recommended)** — DNS A record pointing to the VPS IP  
   Without a domain we can still serve on `http://YOUR_IP` (no HTTPS)
4. Confirm **Neon** stays as production DB
5. Production URLs — e.g. `https://yourdomain.com`

## On the VPS (one-time)

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# log out/in, then:

git clone git@github.com:purustack/fireplace.git
cd fireplace
cp .env.example .env.production
nano .env.production   # set DATABASE_URL, AUTH_SECRET, AUTH_URL, NEXT_PUBLIC_APP_URL
```

`.env.production` example:

```env
DATABASE_URL="postgresql://...neon.tech/neondb?sslmode=require"
AUTH_SECRET="generate-with-openssl-rand-base64-32"
AUTH_URL="https://yourdomain.com"
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
STORAGE_DRIVER="local"
STORAGE_LOCAL_PATH="./storage"
MAX_UPLOAD_BYTES=10485760
FIREPLACE_DOMAIN=yourdomain.com
```

Deploy:

```bash
# Put your domain in deploy/Caddyfile (or export FIREPLACE_DOMAIN)
export FIREPLACE_DOMAIN=yourdomain.com
docker compose -f docker-compose.prod.yml up -d --build
```

Useful:

```bash
docker compose -f docker-compose.prod.yml logs -f app
docker compose -f docker-compose.prod.yml ps
```

## Security notes

- Never commit `.env.production`
- Rotate the Neon password if it was shared in chat
- Open only ports **22**, **80**, **443** in the Vultr firewall
