# NoBS Computers

A website connecting PC buyers with a custom desktop builder.

## What's in this project

```
Computer/
├── content/
│   ├── site.json          ← EDIT: site name, tagline, your bio, hero image
│   └── builds.json        ← EDIT: your previous builds gallery
├── public/
│   └── builds/            ← PUT YOUR PHOTOS HERE
├── src/                   ← App code (don't edit unless you know coding)
├── supabase/              ← Database setup (run once in Supabase)
├── SETUP.md               ← First-time local setup
├── DEPLOY-VULTR.md        ← Full deploy guide to Vultr + domain
└── .env.local             ← Supabase keys (never share or commit this)
```

## Quick start

1. Read and follow **SETUP.md**
2. Run `npm run dev`
3. Open http://localhost:3000

---

# How to edit the website (no coding required)

Most changes are made in **two JSON files** and one **photo folder**. You edit them in **Notepad** (or any text editor). No coding needed.

**Always do this after editing:**

1. Save the file
2. Preview locally (see below)
3. Publish to your live site (see [After you edit — publish changes](#after-you-edit--publish-changes))

---

## Edit site name, tagline, bio, email, hero image

**File:** `content/site.json`

**Full path on your PC:**

```
C:\Users\Admin\OneDrive\Desktop\Computer\content\site.json
```

### How to open it

1. Open **File Explorer**
2. Go to `Computer\content\`
3. Right-click `site.json` → **Open with** → **Notepad**

### What each field means

| Field | What it controls | Example |
|-------|------------------|---------|
| `siteName` | Name in the navbar and footer | `"NoBS Computers"` |
| `tagline` | Big headline on the homepage | `"Custom desktops, no fluff..."` |
| `builderName` | Your name in the intro paragraph | `"Simon Xu"` |
| `builderBio` | Short paragraph about you | `"I build custom PCs with..."` |
| `contactEmail` | Email shown in the footer | `"you@example.com"` |
| `heroImage` | Large photo at the top of the homepage | See [Images](#images) below |

### Example — change your tagline

**Before:**
```json
"tagline": "No BS, just computers built for what you actually need.",
```

**After:**
```json
"tagline": "Honest custom PCs built for Canadians.",
```

### Rules when editing JSON files

- Keep the **quote marks** `"` around text
- Put a **comma** `,` after each line except the last one in the file
- Do **not** delete `{` or `}` brackets
- If the site breaks after saving, you likely missed a comma or quote — undo and try again

---

## Edit past builds (gallery on homepage)

**File:** `content/builds.json`

**Full path:**

```
C:\Users\Admin\OneDrive\Desktop\Computer\content\builds.json
```

Each build is one block inside `[ ... ]`. The file currently has 4 builds; you can add or remove blocks.

### What each build field means

| Field | What it controls | Example |
|-------|------------------|---------|
| `id` | Unique ID (use `"1"`, `"2"`, `"3"`…) | `"1"` |
| `title` | Build name on the card | `"Mid-Range Gaming Rig"` |
| `description` | Short text under the title | `"1440p gaming powerhouse..."` |
| `image` | Photo URL or local path | See [Images](#images) |
| `specs` | List of parts (in `[ ]`, separated by commas) | `["RTX 4070", "32GB DDR5"]` |
| `budget` | Price shown on the card | `"$1,450"` |
| `useCase` | Small label on the photo | `"Gaming"` |

### Example — change one build

Find the build you want and edit the values:

```json
{
  "id": "1",
  "title": "My Best Gaming Build",
  "description": "Handles every game at 1440p max settings.",
  "image": "/builds/gaming-pc.jpg",
  "specs": ["RTX 4070", "Ryzen 7 7800X3D", "32GB DDR5", "1TB NVMe"],
  "budget": "$1,450",
  "useCase": "Gaming"
}
```

### Add a new past build

1. Copy an entire build block (from `{` to `},`)
2. Paste it **before** the final `]` at the bottom
3. Add a **comma** after the previous build's closing `}`
4. Change `id` to the next number (e.g. `"5"`)
5. Update title, description, image, specs, budget, useCase
6. Save

### Remove a past build

1. Delete one entire build block (from `{` to `},`)
2. Make sure commas between remaining builds are still correct
3. Save

---

## Images

You can use **your own photos** or **online URLs**.

### Option A — Your own photos (recommended)

1. Put image files in:

   ```
   C:\Users\Admin\OneDrive\Desktop\Computer\public\builds\
   ```

2. Supported formats: `.jpg`, `.jpeg`, `.png`, `.webp`

3. In `builds.json` or `site.json`, set the image path like this:

   ```
   "/builds/my-photo.jpg"
   ```

   Examples:
   - Build card: `"image": "/builds/gaming-rig-2024.jpg"`
   - Hero image in `site.json`: `"heroImage": "/builds/hero.jpg"`

4. The path always starts with `/builds/` (matches the folder name)

**Tips for photos:**
- Use landscape photos (wider than tall) for best results
- Resize large photos to ~1200px wide before uploading (keeps site fast)
- Use simple file names: `gaming-pc.jpg` not `IMG_4839 (1).jpg`

### Option B — Online image URL

Use a direct link to an image on the web:

```json
"image": "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=800&q=80"
```

The URL must start with `https://` and point directly to an image file.

### Which image goes where

| Location | File to edit | Field name |
|----------|--------------|------------|
| Homepage hero (big top photo) | `content/site.json` | `heroImage` |
| Past build card photos | `content/builds.json` | `image` (inside each build) |

---

## Preview your changes locally

Before publishing, check everything on your PC:

1. Open **PowerShell**
2. Run:

   ```powershell
   cd C:\Users\Admin\OneDrive\Desktop\Computer
   npm run dev
   ```

3. Open **http://localhost:3000** in your browser
4. Refresh the page to see changes (Ctrl+R or F5)
5. When done, press **Ctrl+C** in PowerShell to stop the server

**Check:**
- Homepage text and hero image
- Past builds section — titles, photos, specs, prices
- Footer email

---

## After you edit — publish changes

If the site is **only on your PC**, saving + refresh is enough.

If the site is **live on your Vultr server**, you need to upload changes and restart.

### If you use GitHub

**On your PC:**

```powershell
cd C:\Users\Admin\OneDrive\Desktop\Computer
git add .
git commit -m "Update site content"
git push
```

**On your Vultr VM (SSH in first):**

```bash
cd /var/www/Computer && git pull && npm run build && pm2 restart nobs-computers
```

### If you use WinSCP (no GitHub)

1. Copy changed files to the VM:
   - `content/site.json`
   - `content/builds.json`
   - Any new photos in `public/builds/`
2. SSH into the VM and run:

   ```bash
   cd /var/www/Computer && npm run build && pm2 restart nobs-computers
   ```

Wait ~30 seconds, then refresh your live website.

---

## What you can edit vs what to leave alone

### Safe to edit (no coding)

| What | Where |
|------|--------|
| Site name, tagline, bio, email | `content/site.json` |
| Hero homepage image | `content/site.json` → `heroImage` |
| Past builds (all fields) | `content/builds.json` |
| Build photos | `public/builds/` folder |

### Do not edit unless you know coding

| What | Where |
|------|--------|
| Login, dashboards, chat logic | `src/` folder |
| Database / user accounts | Supabase dashboard (supabase.com) |
| Server password, domain DNS | Vultr + domain registrar |
| Secret keys | `.env.local` (local) and same file on VM |

### Buyer survey questions

The survey questions (use case, budget, parts, preferences) are built into the app. Changing them requires editing code in `src/components/BuyerSurvey.tsx`. Ask for help if you want those changed.

---

## Common mistakes

| Problem | Fix |
|---------|-----|
| Site won't load after editing JSON | Check for missing commas or extra commas in `site.json` / `builds.json` |
| Image not showing | Path must be `/builds/filename.jpg` or a full `https://` URL |
| Changes not on live site | Run the deploy commands on Vultr after editing |
| Photo looks stretched | Use a wider (landscape) photo |

---

## Other guides

| Guide | When to use it |
|-------|----------------|
| **SETUP.md** | First-time setup (Node, Supabase, run locally) |
| **DEPLOY-VULTR.md** | Publish to Vultr + connect your domain |
| **supabase/fix-rls-recursion.sql** | If buyer submit shows "infinite recursion" error |
| **supabase/fix-permissions.sql** | If buyer submit shows "permission denied" error |
| **supabase/fix-builder-role.sql** | Make your account a builder in the database |

---

## Deploying (first time)

See **DEPLOY-VULTR.md** for the full step-by-step publish guide.

Quick update command after site is live:

```bash
cd /var/www/Computer && git pull && npm run build && pm2 restart nobs-computers
```
