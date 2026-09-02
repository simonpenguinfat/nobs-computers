# Fix email verification redirecting to localhost
# Run through these steps in order.

## 1. Supabase dashboard (most important)

1. Go to https://supabase.com → your project
2. Click **Authentication** → **URL Configuration**
3. Set **Site URL** to:
   ```
   https://nobscomputers.ca
   ```
4. Under **Redirect URLs**, add ALL of these (one per line):
   ```
   https://nobscomputers.ca/**
   https://www.nobscomputers.ca/**
   https://nobscomputers.ca/auth/callback
   http://localhost:3000/**
   http://localhost:3000/auth/callback
   ```
5. Click **Save**

## 2. Update your live server .env.local

SSH into your VM:
```bash
nano /var/www/Computer/.env.local
```

Make sure it contains (add the SITE_URL line):
```
NEXT_PUBLIC_SUPABASE_URL=https://pazixqyjlebrktoapbdv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=https://nobscomputers.ca
```

## 3. Deploy the code update

The project now includes `/auth/callback` to handle email verification links.

On your PC:
```powershell
git add .
git commit -m "Fix email verification redirect"
git push
```

On your VM:
```bash
cd /var/www/Computer && git pull && npm run build && pm2 restart nobs-computers
```

## 4. Test

1. Sign up with a **new email** on https://nobscomputers.ca/signup
2. Check the verification email
3. The link should go to `nobscomputers.ca`, NOT localhost

## Note

Old verification emails still contain localhost links. Request a new signup or resend confirmation after fixing Supabase settings.
