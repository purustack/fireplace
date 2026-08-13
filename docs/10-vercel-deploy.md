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
| `AUTH_GOOGLE_ID` | Google OAuth client ID (optional — enables “Continue with Google”) |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret |

Then **Redeploy**.

### Google login

1. Open [Google Cloud Console → APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials)
2. Create an **OAuth 2.0 Client ID** (Web application)
3. Authorized JavaScript origins:
   - `http://localhost:3000`
   - `https://your-app.vercel.app`
4. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://your-app.vercel.app/api/auth/callback/google`
5. Set `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` on Vercel (and in local `.env`), then redeploy

The Google button only appears when both env vars are set. Existing email/password accounts with the same Google email are linked automatically.

## 4. After first deploy

1. Copy the `*.vercel.app` URL
2. Set `AUTH_URL` and `NEXT_PUBLIC_APP_URL` to that URL (https, no trailing slash)
3. Redeploy once

## Notes

- DB stays on **Neon** (free).
- File uploads use `/tmp` on Vercel — fine for MVP demos; files are not durable across cold starts. Add S3 / Vercel Blob later for production uploads.
- Do not seed production unless you want demo accounts live.
