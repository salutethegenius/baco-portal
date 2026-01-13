# Alternative Ways to Get Your Supabase Connection String

If you don't see "Connection string" in Database Settings, try these:

## Method 1: Look for Tabs or Sections

On the Database Settings page you're viewing, look for:
- **Tabs at the top** - Click through them (might be "General", "Connection info", "Connection pooling", etc.)
- **Scroll down** - The connection string might be further down the page
- Look for sections like:
  - "Connection info"
  - "Connection parameters"
  - "Database URL"
  - "Connection pooling" (click to expand)

## Method 2: Use Project Settings

1. Click on your **project name** at the very top of the page (near "PRODUCTION" badge)
2. Look for **"Project Settings"** or just **"Settings"**
3. Then look for **"Database"** → **"Connection string"**

## Method 3: Construct It Manually

If you can't find it, we can construct it. I need:
- Your project reference (looks like: `ppfgonxjzuesetskxxei` - I can see this from your API URL)
- Your database password (the one you set when creating the project)

The format would be:
```
postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

## Method 4: Check Connection Pooling Section

1. In Database Settings, look for **"Connection pooling"** section
2. Click on it to expand
3. Look for **"Connection string"** or **"Session mode"** connection string
4. It might be under "Transaction mode" or "Session mode"

## What to Look For

Any of these formats:
- Starts with `postgresql://`
- Contains `pooler.supabase.com` or `db.xxx.supabase.co`
- Has a port number like `:6543` or `:5432`
- Contains your project reference (like `ppfgonxjzuesetskxxei`)

