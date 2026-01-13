# Vercel Deployment Guide

## 🚀 Quick Deploy

1. **Connect Repository to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import `salutethegenius/baco-portal`
   - Vercel will auto-detect the configuration

2. **Set Environment Variables**

   In Vercel Dashboard → Project Settings → Environment Variables, add:

   ```env
   # Database
   DATABASE_URL=postgresql://user:password@host:5432/database

   # Session
   SESSION_SECRET=your_random_32_char_secret_here

   # Supabase Storage
   SUPABASE_STORAGE_ENDPOINT=https://ppfgonxjzuesetskxxei.storage.supabase.co/storage/v1/s3
   SUPABASE_STORAGE_REGION=us-west-2
   SUPABASE_STORAGE_ACCESS_KEY=your_access_key
   SUPABASE_STORAGE_SECRET_KEY=your_secret_key
   SUPABASE_STORAGE_BUCKET=documents

   # SendGrid Email
   SENDGRID_API_KEY=SG.your_api_key_here
   SENDGRID_FROM_EMAIL=noreply@baco-bahamas.com

   # Application
   APP_URL=https://your-app.vercel.app
   NODE_ENV=production
   PORT=3000
   ```

3. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your app will be live!

## 📝 Notes

- **Database**: Make sure your Supabase database is accessible from Vercel's IP ranges
- **Storage**: Ensure the Supabase Storage bucket exists and is configured
- **SendGrid**: Verify your sender email domain in SendGrid
- **Build**: The build process runs `npm run build` automatically

## 🔧 Troubleshooting

### Build Fails
- Check that all dependencies are in `package.json`
- Verify Node.js version (Vercel uses Node 18+ by default)

### Database Connection Issues
- Ensure `DATABASE_URL` is set correctly
- Check Supabase connection pooling settings
- Verify database allows external connections

### Storage Upload Fails
- Verify Supabase Storage credentials
- Check bucket name matches `SUPABASE_STORAGE_BUCKET`
- Ensure bucket has proper CORS configuration

### Email Not Sending
- Verify `SENDGRID_API_KEY` starts with `SG.`
- Check sender email is verified in SendGrid
- Review SendGrid activity logs

## 🔄 Updating

After pushing to GitHub, Vercel will automatically:
1. Detect the new commit
2. Build the project
3. Deploy to production (if on main branch)

You can also manually trigger deployments from the Vercel dashboard.
