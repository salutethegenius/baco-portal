# How to Find Your Supabase Connection String

Based on the interface you're seeing, here's exactly where to find your database connection string:

## Step-by-Step Instructions

### Method 1: From Settings → Database (Easiest)

1. **Look at the left sidebar** - You should see a **gear icon** (⚙️) near the bottom
2. **Click on "Settings"** in the sidebar (under Configuration section)
3. **Click on "Database"** in the Settings menu
4. **Scroll down** to find the **"Connection string"** section
5. Look for **"URI"** format (it will show something like `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`)
6. **Click the "Copy" button** next to it, OR
7. Click on the connection string field itself and it will show your password - then click "Copy" or manually copy it

### Method 2: From Settings → API

1. Click **"Settings"** in the left sidebar (gear icon)
2. Click **"API"** (instead of Database)
3. Look for **"Connection string"** section
4. Find the **Database URL** or **Connection string**
5. Click to copy it

### Method 3: From Project Settings

1. Click on your **project name** at the top (might say "Baco Portal Database" or similar)
2. Go to **Settings**
3. Click **"Database"**
4. Find **"Connection string"** section

## What the Connection String Looks Like

It will look something like this:
```
postgresql://postgres.xxxxxxxxxxxxx:your_password@aws-0-us-west-1.pooler.supabase.com:6543/postgres
```

OR it might be in this format:
```
postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
```

## Important Notes

- **You'll need to replace `[YOUR-PASSWORD]`** with your actual database password if it shows that placeholder
- The password is the one you set when creating the Supabase project
- If you forgot your password, you can reset it in Settings → Database → Database password

## After You Get It

1. Copy the entire connection string
2. Open your `.env` file in the project
3. Replace the `DATABASE_URL` line with:
   ```
   DATABASE_URL=postgresql://postgres.xxxxx:your_password@aws-0-us-west-1.pooler.supabase.com:6543/postgres
   ```
   (Use your actual connection string, not this example)

4. Save the file
5. Run `npm run db:push`

## Quick Navigation Tips

- Use the **gear icon (⚙️)** in the sidebar to get to Settings
- Look for **"Database"** or **"API"** in the Settings menu
- The connection string might be hidden - click on it or look for an "eye" icon to reveal it
- Make sure you're copying the **URI** format, not the individual components

