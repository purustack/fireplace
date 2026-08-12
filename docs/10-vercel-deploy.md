# Deploy Fireplace on Vercel (free Hobby)

## 1. Push latest code

Repo: https://github.com/purustack/fireplace

## 2. Import on Vercel

1. Open [vercel.com/new](https://vercel.com/new)
2. Sign in with **GitHub**
3. Import **purustack/fireplace**
4. Framework: **Next.js** (auto-detected)
5. Root directory: `.`

## 3. Environment variables

In Project → Settings → Environment Variables, add for **Production** (and Preview if you want):

| Name | Value |
|------|--------|
| `DATABASE_URL` | Neon connection string (`sslmode=require`). Prefer the **pooled** host (`…-pooler.…`) for serverless. |
| `AUTH_SECRET` | Output of `openssl rand -base64 32` |
| `AUTH_URL` | Your Vercel URL, e.g. `https://fireplace-xxxx.vercel.app` (update after first deploy if needed) |
| `NEXT_PUBLIC_APP_URL` | Same as `AUTH_URL` |
| `STORAGE_DRIVER` | `local` |
| `MAX_UPLOAD_BYTES` | `10485760` |

Then **Redeploy**.

## 4. After first deploy

1. Copy the `*.vercel.app` URL
2. Set `AUTH_URL` and `NEXT_PUBLIC_APP_URL` to that URL (https, no trailing slash)
3. Redeploy once

## Notes

- DB stays on **Neon** (free).
- File uploads use `/tmp` on Vercel — fine for MVP demos; files are not durable across cold starts. Add S3 / Vercel Blob later for production uploads.
- Do not seed production unless you want demo accounts live.
