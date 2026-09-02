# Fix All Issues — Step by Step

Run through these in order. Each section fixes a different problem.

---

## 1b. Run delivery confirmation SQL

1. Open `supabase/delivery-confirmation.sql`
2. Copy and run in Supabase SQL Editor

This adds the "customer confirms receipt" feature.

---

## 1. Run security SQL in Supabase (CRITICAL)

1. Go to https://supabase.com → your project → **SQL Editor**
2. Open `supabase/fix-all-security.sql` from this project
3. Copy everything and paste into SQL Editor
4. Click **Run**

This fixes:
- Users making themselves admin
- Buyers changing build status/price
- Duplicate build requests
- Builder names not showing in chat

---

## 2. Fix email verification redirect (Supabase dashboard)

1. **Authentication** → **URL Configuration**
2. Set **Site URL** to: `https://nobscomputers.ca`
3. Add **Redirect URLs**:
   ```
   https://nobscomputers.ca/**
   https://www.nobscomputers.ca/**
   https://nobscomputers.ca/auth/callback
   http://localhost:3000/**
   http://localhost:3000/auth/callback
   ```
4. Click **Save**

---

## 3. Fix "email rate limit exceeded"

Supabase limits how many emails it sends per hour on the free plan (~3–4 per hour).

### Quick fix (for testing)
1. Supabase → **Authentication** → **Providers** → **Email**
2. Turn **OFF** "Confirm email"
3. Save

Users can sign up and log in immediately without verification emails.

### Better fix (for production)
Set up custom SMTP so you get higher limits:
1. Supabase → **Project Settings** → **Authentication** → **SMTP Settings**
2. Use a service like [Resend](https://resend.com) (free tier: 100 emails/day)
3. Enter your SMTP credentials and save

### If you're just testing
- Wait ~1 hour before trying signup again
- Use a different email address
- Delete test users in Supabase → **Authentication** → **Users**

---

### Fix logout or email links going to localhost

If logout or verification links redirect to `localhost:3000`, add this to `.env.local` on your VM:

```
NEXT_PUBLIC_SITE_URL=https://nobscomputers.ca
```

Then rebuild: `npm run build && pm2 restart nobs-computers`

Also update Nginx to forward the real host (see DEPLOY-VULTR.md step 11) and reload: `nginx -t && systemctl reload nginx`

---

On your PC:
```powershell
git add .
git commit -m "Fix security, signup, and deployment issues"
git push
```

On your VM:
```bash
cd /var/www/Computer && git pull && npm install && npm run build && pm2 restart nobs-computers
```

---

## 5. Update `.env.local` on VM

```bash
nano /var/www/Computer/.env.local
```

Make sure it has:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=https://nobscomputers.ca
```

Then rebuild:
```bash
cd /var/www/Computer && npm run build && pm2 restart nobs-computers
```

---

## What was fixed in code

| Problem | Fix |
|---------|-----|
| Users could become admin | SQL trigger blocks role changes |
| Buyers could edit status/price | SQL trigger blocks those fields |
| Signup ignored email confirmation | Shows "check your email" screen |
| Email rate limit error | Friendlier error message + guide above |
| Auth callback open redirect | Validates redirect path |
| Admin role could be overwritten | `getUserRole` no longer overwrites on error |
| Login redirect ignored | Login now uses `?redirect=` param |
| Chat shows "User" for builder | SQL allows reading builder names |
| Sign-out via GET (CSRF) | Only POST allowed now |
| Chat send failures silent | Shows error message |
| Navbar auth flash | Loading skeleton while checking auth |
| `/admin` not role-checked in middleware | Non-builders redirected to `/buyer` |
| PM2 name mismatch in docs | All docs use `nobs-computers` |
| Missing `.env.example` | File created |
| Duplicate build requests | One request per buyer (SQL unique index) |

---

## Test checklist

- [ ] Sign up on https://nobscomputers.ca/signup
- [ ] Verify email link goes to nobscomputers.ca (not localhost)
- [ ] Log in as buyer → dashboard works
- [ ] Submit survey → shows on admin dashboard
- [ ] Chat works (builder name shows, not "User")
- [ ] Log in as admin at /admin/login
- [ ] Log out works
