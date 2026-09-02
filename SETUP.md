# PC Forge — Setup Guide

Follow these steps **in order**. You only do each step once.

---

## Step 1: Install Node.js (one time)

1. Go to https://nodejs.org
2. Download the **LTS** version (the green button)
3. Run the installer — click Next through everything
4. Restart your computer

To verify it worked, open **PowerShell** and type:

```
node --version
```

You should see something like `v20.x.x`.

---

## Step 2: Install project dependencies (one time)

Open PowerShell in this folder and run:

```
cd C:\Users\Admin\OneDrive\Desktop\Computer
npm install
```

Wait until it finishes (may take 1-2 minutes).

---

## Step 3: Create a free Supabase account (one time)

Supabase handles login, database, and chat. It's free for small sites.

1. Go to https://supabase.com and click **Start your project**
2. Sign up (GitHub or email)
3. Click **New Project**
   - Name: `pc-forge`
   - Database password: pick something and **save it somewhere**
   - Region: pick the closest to you (e.g. Canada if available)
4. Wait ~2 minutes for the project to finish setting up

---

## Step 4: Set up the database (one time)

1. In your Supabase project, click **SQL Editor** in the left sidebar
2. Click **New query**
3. Open the file `supabase/schema.sql` from this project folder
4. Copy **everything** in that file and paste it into the SQL Editor
5. Click **Run** (or press Ctrl+Enter)
6. You should see "Success. No rows returned"
7. Run `supabase/fix-all-security.sql` the same way (security fixes)

---

## Step 5: Get your Supabase keys (one time)

1. In Supabase, click **Project Settings** (gear icon, bottom left)
2. Click **API** in the sidebar
3. Copy these two values:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon public** key (long string under "Project API keys")

---

## Step 6: Create your `.env.local` file (one time)

1. In this project folder, find the file `.env.example`
2. Make a copy and rename the copy to `.env.local`
3. Open `.env.local` in Notepad and replace the placeholder values:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-actual-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key-here
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

4. Save the file

---

## Step 7: Run the site locally

In PowerShell:

```
npm run dev
```

Open your browser to **http://localhost:3000**

You should see the homepage with your previous builds.

---

## Step 8: Create your admin account (one time)

Your admin account is **not** created through the public signup page. All public signups are buyers only.

1. Sign up once through Supabase or use your existing account
2. In Supabase → **SQL Editor**, run (replace with your email):

```sql
UPDATE public.profiles SET role = 'builder' WHERE email = 'your-email@example.com';
```

3. Log in at **http://localhost:3000/admin/login**

Bookmark that URL — this is your private admin portal. Do not link it on the public website.

---

## Editing your site (no coding needed)

### Change site name, tagline, your bio

Edit this file in Notepad:

```
content/site.json
```

Change the text values, save, and refresh the browser.

### Add or edit your previous builds

Edit this file in Notepad:

```
content/builds.json
```

Each build has: title, description, image URL, specs list, budget, use case.

To use your own photos: put images in the `public/builds/` folder and set
`"image": "/builds/my-photo.jpg"` in builds.json.

---

## Daily commands (bookmark these)

| What you want | Command |
|---|---|
| Start the site locally | `npm run dev` |
| Stop the site | Press `Ctrl+C` in PowerShell |
| Deploy to Vultr | See `DEPLOY-VULTR.md` |

---

## Troubleshooting

**"Invalid API key" or blank pages after login**
→ Check your `.env.local` has the correct Supabase URL and key.

**Homepage works but login doesn't**
→ Make sure you ran `supabase/schema.sql` in Step 4.

**Images not showing**
→ Image URLs must start with `https://` or be local paths like `/builds/photo.jpg`.

**Port 3000 already in use**
→ Run `npm run dev -- -p 3001` and open http://localhost:3001 instead.

---

## Need help?

If something breaks, note the exact error message from PowerShell and ask for help.
