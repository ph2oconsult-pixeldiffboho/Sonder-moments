# Sonder API — Vercel + Supabase

## What this is
Next.js app that deploys to Vercel as serverless API routes.
The Expo mobile app calls these endpoints.

---

## Setup — 3 services, ~15 minutes total

### 1. Supabase (database) — 5 min

1. Go to https://supabase.com → **New project**
2. Choose a name (e.g. "sonder"), set a strong password, pick a region close to you
3. Wait ~2 minutes for it to provision
4. Go to **SQL Editor** → **New query**
5. Paste the entire contents of `supabase/schema.sql`
6. Click **Run** — you should see "Success"
7. Go to **Settings → API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret** key → `SUPABASE_SERVICE_ROLE_KEY`

### 2. Vercel (hosting) — 5 min

1. Go to https://vercel.com → **Add New Project**
2. Import your GitHub repo (connect GitHub if needed)
3. Vercel will detect it as a Next.js project automatically
4. **Before deploying**, click **Environment Variables** and add:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | from Supabase above |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | from Supabase above |
| `SUPABASE_SERVICE_ROLE_KEY` | from Supabase above |
| `JWT_SECRET` | run: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `REFRESH_TOKEN_SECRET` | run same command again for a different value |
| `ANTHROPIC_API_KEY` | from https://console.anthropic.com |
| `STRIPE_SECRET_KEY` | from https://dashboard.stripe.com (use test key first) |
| `STRIPE_WEBHOOK_SECRET` | set up webhook in Stripe dashboard pointing to your Vercel URL |
| `NEXT_PUBLIC_APP_URL` | your Vercel URL e.g. https://sonder.vercel.app |

5. Click **Deploy**

### 3. Test it

Once deployed, open:
```
https://YOUR-PROJECT.vercel.app/api/health
```

You should see:
```json
{ "status": "ok", "app": "Sonder API" }
```

---

## Local development

```bash
npm install
cp .env.example .env.local
# Fill in .env.local with your Supabase and other values
npm run dev
# API available at http://localhost:3000/api/...
```

---

## Mobile app config

In `apps/mobile/.env`:
```
# During development:
EXPO_PUBLIC_API_URL=http://localhost:3000

# After Vercel deploy:
EXPO_PUBLIC_API_URL=https://YOUR-PROJECT.vercel.app
```

---

## API endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh` | Refresh token |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Current user |
| GET | `/api/profiles` | List child profiles |
| POST | `/api/profiles` | Create child profile |
| PATCH | `/api/profiles/[id]` | Update profile |
| DELETE | `/api/profiles/[id]` | Delete profile |
| GET | `/api/lessons/worlds` | List worlds |
| GET | `/api/lessons` | List lessons |
| GET | `/api/lessons/[id]` | Get lesson with content |
| GET | `/api/lessons/next/[childId]` | Next recommended lesson |
| POST | `/api/progress` | Update lesson progress |
| GET | `/api/progress?child_id=` | Get child's progress |
| POST | `/api/sage` | Send message to Sage AI |
| GET | `/api/sage?child_id=` | List Sage sessions |
| GET | `/api/book` | Get book entries |
| POST | `/api/book` | Add book entry |
| DELETE | `/api/book/[id]` | Delete book entry |
| GET | `/api/values` | Get family values |
| POST | `/api/values` | Add a value |
| GET | `/api/notifications` | Get notifications |
| POST | `/api/notifications` | Register push token / mark read |
| POST | `/api/stripe/checkout` | Create Stripe checkout |
| POST | `/api/stripe/portal` | Open billing portal |
| POST | `/api/stripe/webhook` | Stripe webhook (register this URL in Stripe) |

---

## Stripe webhook setup

After Vercel deploy:
1. Go to https://dashboard.stripe.com → Developers → Webhooks → Add endpoint
2. URL: `https://YOUR-PROJECT.vercel.app/api/stripe/webhook`
3. Events to listen for: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
4. Copy the **Signing secret** → add as `STRIPE_WEBHOOK_SECRET` in Vercel

---

## Common issues

| Problem | Fix |
|---------|-----|
| `SUPABASE_SERVICE_ROLE_KEY not set` | Add to Vercel environment variables and redeploy |
| `Invalid JWT` | Check `JWT_SECRET` is set in Vercel env vars |
| Stripe webhook 400 | Check `STRIPE_WEBHOOK_SECRET` matches what Stripe dashboard shows |
| Supabase connection error | Check your `NEXT_PUBLIC_SUPABASE_URL` has no trailing slash |
