---
id: cloudflare-setup
title: Cloudflare Dashboard Setup
sidebar_label: Cloudflare Setup
---

# Cloudflare Dashboard Setup

Step-by-step guide for setting up Sommelier Arena through the Cloudflare web UI. No Wrangler CLI needed (except for initial `partykit deploy`).

---

## 1. Create the KV namespace

**Workers & Pages → KV → Create namespace**

1. Log in to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Select your account in the left sidebar
3. Click **Workers & Pages** in the left nav
4. Click **KV** in the top tab bar
5. Click **Create namespace** (top right)
6. Name: `SOMMELIER_HOSTS` → click **Add**
7. The namespace appears in the list with a unique **Namespace ID** — copy it
8. Open `partykit.json` in your editor and replace `YOUR_KV_NAMESPACE_ID`:
   ```json
   { "binding": "HOSTS_KV", "id": "PASTE_NAMESPACE_ID_HERE" }
   ```
9. Run `npx partykit deploy` to apply

---

## 2. Deploy the frontend to Cloudflare Pages

**Workers & Pages → Create application → Pages**

1. Click **Workers & Pages** → **Create application** → **Pages** tab → **Connect to Git**
2. Authorize Cloudflare to access your GitHub account if prompted
3. Select your repository → click **Begin setup**
4. Configure:
   - **Project name**: `sommelier-arena`
   - **Production branch**: `cloudflare-migration`
   - **Root directory**: `front`
   - **Framework preset**: None (Astro builds to static)
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
5. Click **Environment variables (advanced)** → **Add variable**:
   - Variable name: `PUBLIC_PARTYKIT_HOST`
   - Value: `sommelier-arena.USERNAME.partykit.dev` (your PartyKit project URL)
6. Click **Save and Deploy**

---

## 3. Deploy the docs to Cloudflare Pages

Repeat Step 2 with different settings:

- **Project name**: `sommelier-arena-docs`
- **Root directory**: `docs-site`
- **Build command**: `npm run build`
- **Build output directory**: `build`
- No environment variables needed

---

## 4. Add a custom domain

**Cloudflare Pages → sommelier-arena → Custom domains**

1. Click your `sommelier-arena` Pages project
2. Click **Custom domains** tab
3. Click **Set up a custom domain**
4. Enter: `sommelier-arena.ducatillon.net` → click **Continue**
5. Cloudflare will add the required DNS CNAME automatically (since `ducatillon.net` is already managed on Cloudflare)
6. Wait for **Active** status (usually < 1 minute)

---

## 5. Deploy the proxy Worker

**Workers & Pages → Create application → Worker**

1. Click **Workers & Pages** → **Create application** → **Worker** tab
2. Name: `sommelier-arena-proxy`
3. Click **Deploy** (deploys the default hello-world worker first)
4. Click **Edit code**
5. Replace the default code with the contents of `proxy-worker/index.ts` from the repo
6. Click **Deploy** (top right)

**Add the /docs route:**

1. Go to your Worker → **Triggers** tab
2. Under **Routes** → click **Add route**
3. Route: `sommelier-arena.ducatillon.net/docs*`
4. Zone: `ducatillon.net`
5. Click **Save**

---

## 6. Verify DNS records

**ducatillon.net → DNS**

1. In the Cloudflare dashboard, click `ducatillon.net` in your domain list
2. Click **DNS** → **Records**
3. You should see a CNAME record: `sommelier-arena` → `sommelier-arena.pages.dev`
4. Proxy status should be **Proxied** (orange cloud icon)

---

## 7. Set environment variables in Pages

If you need to update `PUBLIC_PARTYKIT_HOST` after initial deploy:

1. Pages → `sommelier-arena` → **Settings** → **Environment variables**
2. Click **Add variable** or edit the existing one
3. Save → then go to **Deployments** → click **⋯** next to the latest deploy → **Retry deployment** to apply the new variable

---

## Checklist

- [ ] KV namespace `SOMMELIER_HOSTS` created; ID in `partykit.json`
- [ ] `npx partykit deploy` completed (no errors)
- [ ] Frontend Pages project deployed (`sommelier-arena`)
- [ ] Docs Pages project deployed (`sommelier-arena-docs`)
- [ ] Custom domain `sommelier-arena.ducatillon.net` active (green)
- [ ] Proxy Worker deployed with `/docs*` route
- [ ] `PUBLIC_PARTYKIT_HOST` env var set in Pages to your partykit.dev URL
- [ ] Navigate to `https://sommelier-arena.ducatillon.net/host` — dashboard loads
- [ ] Navigate to `https://sommelier-arena.ducatillon.net/docs` — docs load
