# Deploy to Vultr — Step by Step

Do the **SETUP.md** steps first (get the site working locally).

This guide deploys your site to your Vultr VM so anyone can visit it at your `.ca` domain.

---

## Part A: One-time VM setup

SSH into your Vultr VM (use the IP and password from your Vultr dashboard):

```
ssh root@YOUR_VM_IP
```

Then run these commands **one at a time**:

### 1. Update the server

```bash
apt update && apt upgrade -y
```

### 2. Install Node.js 22 (required by Supabase)

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs
```

Verify: `node --version` should show v22.x.x

### 3. Install PM2 (keeps your site running)

```bash
npm install -g pm2
```

### 4. Install Nginx (web server)

```bash
apt install -y nginx
```

### 5. Install Certbot (free HTTPS/SSL)

```bash
apt install -y certbot python3-certbot-nginx
```

### 6. Install Git

```bash
apt install -y git
```

### 7. Upload your project to the VM

**Option A — GitHub (recommended):**

On your Windows PC, push the project to GitHub first. Then on the VM:

```bash
cd /var/www
git clone https://github.com/YOUR_USERNAME/Computer.git
cd Computer
```

**Option B — Copy files manually:**

Use FileZilla or WinSCP to copy the entire `Computer` folder to `/var/www/Computer` on the VM.

### 8. Create environment file on the VM (BEFORE building)

```bash
nano /var/www/Computer/.env.local
```

Paste your Supabase keys (same as your local `.env.local`):

```
NEXT_PUBLIC_SUPABASE_URL=https://your-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=https://nobscomputers.ca
```

Press `Ctrl+X`, then `Y`, then `Enter` to save.

**Important:** The build will fail without this file. Create it before `npm run build`.

### 8b. Configure Supabase for production

In your Supabase dashboard:

1. **Authentication** → **URL Configuration**
2. Set **Site URL** to `https://nobscomputers.ca`
3. Add redirect URLs: `https://nobscomputers.ca/**` and `https://nobscomputers.ca/auth/callback`
4. Run `supabase/fix-all-security.sql` in the SQL Editor (if not done already)

See `supabase/FIX-ALL.md` for email rate limits and full checklist.

### 9. Install dependencies and build

```bash
cd /var/www/Computer
npm install
npm run build
```

### 10. Start the app with PM2

```bash
cd /var/www/Computer
pm2 start npm --name "nobs-computers" -- start
pm2 save
pm2 startup
```

Run the command that `pm2 startup` prints (it starts with `sudo env PATH=...`).

### 11. Configure Nginx

```bash
nano /etc/nginx/sites-available/nobs-computers
```

Paste this (replace `yourname.ca` with your actual domain):

```nginx
server {
    listen 80;
    server_name yourname.ca www.yourname.ca;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Save and enable:

```bash
ln -s /etc/nginx/sites-available/nobs-computers /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### 12. Point your `.ca` domain to the VM

At your domain registrar (where you bought `yourname.ca`):

| Type | Name | Value |
|---|---|---|
| A | @ | Your Vultr VM IP address |
| A | www | Your Vultr VM IP address |

Wait 5-60 minutes for DNS to propagate.

### 13. Enable HTTPS (free SSL)

```bash
certbot --nginx -d yourname.ca -d www.yourname.ca
```

Follow the prompts. Certbot auto-renews.

### 14. Open firewall ports

```bash
ufw allow 22
ufw allow 80
ufw allow 443
ufw enable
```

**Done!** Visit `https://yourname.ca` — your site is live.

---

## Part B: Updating the site (every time you make changes)

### On your Windows PC:

1. Edit files (e.g. `content/builds.json`, `content/site.json`)
2. Test locally: `npm run dev`
3. Push to GitHub (if using Git):

```
git add .
git commit -m "Update builds"
git push
```

### On your Vultr VM:

SSH in and run this one-liner:

```bash
cd /var/www/Computer && git pull && npm install && npm run build && pm2 restart nobs-computers
```

That's it. Your live site updates in ~30 seconds.

---

## Quick reference card

Save this somewhere handy:

```
# SSH into VM
ssh root@YOUR_VM_IP

# Deploy updates
cd /var/www/Computer && git pull && npm install && npm run build && pm2 restart nobs-computers

# Check if site is running
pm2 status

# View error logs
pm2 logs nobs-computers

# Restart site
pm2 restart nobs-computers
```

---

## Troubleshooting

**Site shows "502 Bad Gateway"**
→ App isn't running. Run `pm2 status` and `pm2 restart nobs-computers`.

**HTTPS not working**
→ DNS may not have propagated yet. Wait and retry certbot.

**Changes not showing**
→ Did you run `npm run build` and `pm2 restart nobs-computers` after pulling?

**"Cannot find module" errors**
→ Run `npm install` in `/var/www/Computer`.
