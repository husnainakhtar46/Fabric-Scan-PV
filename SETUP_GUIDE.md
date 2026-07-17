# Google Service Account Setup Guide

This guide walks you through connecting the app to your Google Sheet so it can read garment data.

---

## Step 1 — Create a Google Cloud Project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Click **"Select a project"** → **"New Project"**
3. Name it `fabric-library` and click **Create**

---

## Step 2 — Enable the Google Sheets API

1. In your new project, go to **APIs & Services → Library**
2. Search for **"Google Sheets API"**
3. Click it → click **"Enable"**

---

## Step 3 — Create a Service Account

1. Go to **APIs & Services → Credentials**
2. Click **"+ CREATE CREDENTIALS"** → **"Service Account"**
3. Fill in a name like `fabric-library-reader`
4. Skip the optional role settings → Click **Done**

---

## Step 4 — Download the JSON Key

1. On the Credentials page, find your new service account and click on it
2. Go to the **"Keys"** tab
3. Click **"Add Key"** → **"Create new key"** → choose **JSON** → **Create**
4. A `.json` file will download — keep this **private and safe**

The file looks like this:
```json
{
  "client_email": "fabric-library-reader@your-project.iam.gserviceaccount.com",
  "private_key": "-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----\n"
}
```

---

## Step 5 — Share Your Google Sheet

1. Open your Google Sheet
2. Click **Share** (top-right)
3. In the "Add people" box, paste the `client_email` from your JSON file
4. Set permission to **Viewer** → click **Send**

> ⚠️ Make sure your sheet's tab is named **`Database`** (check bottom tab bar)
> The first row must be headers — data starts from row 2.

---

## Step 6 — Get the Spreadsheet ID

From your Google Sheet URL:
```
https://docs.google.com/spreadsheets/d/  1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms  /edit
```
The long string in the middle is your **Spreadsheet ID**.

---

## Step 7 — Fill in `.env.local`

Open `C:\Users\husna\Desktop\fabric-qr-app\.env.local` and fill in:

```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=fabric-library-reader@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nYOUR_KEY\n-----END RSA PRIVATE KEY-----\n"
SPREADSHEET_ID=your_spreadsheet_id_here
SHEET_RANGE=Database!A2:R
TEAM_PIN=your_chosen_secret_pin
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

> **Important:** For `GOOGLE_PRIVATE_KEY`, copy the entire `private_key` value from the JSON file, including the `-----BEGIN` and `-----END` lines. Keep the surrounding quotes in `.env.local`.

---

## Step 8 — Test Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and search for a style ref like `REF-000ALY`.

---

## Step 9 — Deploy to Vercel (Free)

1. Push the project to GitHub (exclude `.env.local` — it's in `.gitignore`)
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import from GitHub
3. In the **Environment Variables** section, add all 6 variables from your `.env.local`
4. Click **Deploy** — done!

Your live URL will be something like `https://fabric-library.vercel.app`

---

## Updating the Data

Whenever you add or edit garments in Google Sheets, the app automatically picks up changes within **60 seconds** (Next.js cache refresh). No redeploy needed.

---

## Security Notes

- `Fabric Price`, `Notes`, and `Event` fields are **never sent** to the browser without the correct `TEAM_PIN`
- Your service account credentials are stored as environment variables — never in the code
- The `.env.local` file is in `.gitignore` and will not be pushed to GitHub
