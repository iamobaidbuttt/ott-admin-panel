# OTT Admin Panel

A beautiful admin panel to manage OTT cookies remotely. Hosted on Vercel for free.

## Features

- 🔐 Password protected admin panel
- 🍪 Update cookies for ChatGPT, Canva, Perplexity, Netflix, JioHotstar
- 📋 Paste Netscape format cookies directly
- 🔄 Extension fetches cookies automatically
- ☁️ Persistent storage with Vercel KV

## Deployment Steps

### Step 1: Create GitHub Repository

1. Create a new GitHub repository
2. Upload all files from this folder to the repository

### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up with GitHub
2. Click "Add New Project"
3. Import your GitHub repository
4. Click "Deploy"

### Step 3: Set Up Vercel KV (Database)

1. In your Vercel project dashboard, go to **Storage** tab
2. Click **Create Database** → Select **KV**
3. Name it: `ott-cookies-db`
4. Click **Create**
5. It will automatically add environment variables

### Step 4: Set Admin Password

1. Go to project **Settings** → **Environment Variables**
2. Add:
   - Name: `ADMIN_PASSWORD`
   - Value: `your_secret_password`
3. Click **Save**
4. Redeploy the project (Deployments → Redeploy)

### Step 5: Update Extension

In your extension's `background.js`, change the URL:

```javascript
const COOKIES_URL = "https://your-project-name.vercel.app/api/cookies";
```

## Usage

1. Go to your Vercel URL (e.g., `https://ott-admin.vercel.app`)
2. Login with your password
3. Select a service (ChatGPT, Canva, etc.)
4. Paste cookies in Netscape format
5. Click Save

Your extension will automatically fetch the new cookies!

## API Endpoints

- `GET /api/cookies` - Get all cookies (used by extension)
- `POST /api/cookies` - Update cookies (requires auth)

## Developed by

Sam Khan | Telegram: @IAMSAMKHANOFFICIAL

