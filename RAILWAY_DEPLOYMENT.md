# Railway Deployment Guide

## 🚀 Quick Deploy to Railway

### Step 1: Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Authorize Railway to access your repositories

### Step 2: Create New Project
1. Click **"New Project"** in Railway dashboard
2. Select **"Deploy from GitHub repo"**
3. Choose your `baco-portal` repository
4. Railway will auto-detect it's a Node.js application

### Step 3: Add PostgreSQL Database
1. In your Railway project, click **"New"**
2. Select **"Database"** → **"Add PostgreSQL"**
3. Railway will automatically create a PostgreSQL database
4. The `DATABASE_URL` environment variable will be automatically set

### Step 4: Set Environment Variables
Go to your service → **Variables** tab and add:

```env
# Database (automatically provided by Railway PostgreSQL service)
# DATABASE_URL is auto-set, but you can verify it's there

# Session Secret (REQUIRED - generate a random string)
SESSION_SECRET=your_random_32_character_secret_here

# Supabase Storage
SUPABASE_STORAGE_ENDPOINT=https://ppfgonxjzuesetskxxei.storage.supabase.co/storage/v1/s3
SUPABASE_STORAGE_REGION=us-west-2
SUPABASE_STORAGE_ACCESS_KEY=your_access_key
SUPABASE_STORAGE_SECRET_KEY=your_secret_key
SUPABASE_STORAGE_BUCKET=documents

# AWS SES Email
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_SES_REGION=us-east-1
AWS_SES_FROM_EMAIL=noreply@baco-portal.com

# Stripe Payment Processing
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# Application
APP_URL=https://your-app-name.railway.app
NODE_ENV=production
PORT=3000
```

**Note**: Railway automatically sets `PORT`, but you can override it if needed.

### Step 5: Generate Session Secret
Run this command to generate a secure session secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and use it as your `SESSION_SECRET`.

### Step 6: Deploy
1. Railway will automatically build and deploy when you push to your main branch
2. Or click **"Deploy"** in the Railway dashboard
3. Wait for the build to complete (usually 2-5 minutes)

### Step 7: Get Your URL
1. Once deployed, Railway will provide a URL like `your-app-name.railway.app`
2. Click on your service → **Settings** → **Generate Domain** to get a custom domain
3. Update `APP_URL` environment variable with your Railway URL

## 📝 Build Process

Railway will automatically:
1. Run `npm install` to install dependencies
2. Run `npm run build` (builds client + server)
3. Run `npm start` (starts the Express server)

## 🔧 Troubleshooting

### Build Fails
- Check Railway logs: Service → **Deployments** → Click on failed deployment
- Ensure all dependencies are in `package.json`
- Verify Node.js version (Railway uses Node 20 by default)

### Database Connection Issues
- Verify `DATABASE_URL` is set (should be automatic)
- Check that PostgreSQL service is running
- Ensure database allows connections

### App Returns 404
- Check that build completed successfully
- Verify `PORT` environment variable is set
- Check Railway logs for errors

### Static Files Not Loading
- Verify `npm run build` completed successfully
- Check that `dist/public` directory exists
- Review Railway build logs

## 🔄 Updating Your App

Railway automatically deploys when you push to GitHub:
1. Make changes to your code
2. Commit and push to GitHub
3. Railway detects the push
4. Automatically rebuilds and redeploys

You can also manually trigger deployments from the Railway dashboard.

## 💰 Pricing

- **Free Tier**: $5 credit/month
- **Hobby Plan**: $5/month (after free tier)
- **Pro Plan**: $20/month

The free tier is usually sufficient for small to medium applications.

## 📚 Additional Resources

- [Railway Documentation](https://docs.railway.app)
- [Railway Discord](https://discord.gg/railway)

## ✅ Post-Deployment Checklist

- [ ] Database migrations run successfully
- [ ] Environment variables are set
- [ ] App is accessible at Railway URL
- [ ] Static files are loading
- [ ] API endpoints are working
- [ ] Authentication is working
- [ ] Email sending is configured
- [ ] Stripe payments working (use test card: 4242 4242 4242 4242)
- [ ] Custom domain is set (optional)
