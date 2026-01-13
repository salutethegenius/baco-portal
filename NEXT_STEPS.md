# Next Steps for Production Deployment

## 1. ✅ Database Schema Migration

Push the schema changes to add password reset fields:

```bash
npm run db:push
```

This will add the `password_reset_token` and `password_reset_expires` columns to the `users` table.

## 2. 🔧 Configure Environment Variables

### Required for Development/Production

Create or update your `.env` file with these variables:

```env
# Database (required)
DATABASE_URL=postgresql://user:password@host:5432/database

# Session (required)
SESSION_SECRET=your_secure_random_32_char_string

# Supabase Storage (required for file uploads)
SUPABASE_STORAGE_ENDPOINT=https://ppfgonxjzuesetskxxei.storage.supabase.co/storage/v1/s3
SUPABASE_STORAGE_REGION=us-west-2
SUPABASE_STORAGE_ACCESS_KEY=your_access_key
SUPABASE_STORAGE_SECRET_KEY=your_secret_key
SUPABASE_STORAGE_BUCKET=documents

# SendGrid Email (required for emails, optional for development)
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@baco-bahamas.com

# Application (required)
APP_URL=http://localhost:5000  # or your production URL
NODE_ENV=development  # or production
PORT=5000
```

### Getting Supabase Storage Credentials

1. Go to your Supabase project dashboard
2. Navigate to Settings → Storage
3. Create a bucket named "documents" (or use the name you configured)
4. Go to Settings → API → Storage Keys
5. Copy the Access Key and Secret Key

### Getting SendGrid API Key

1. Sign up at [SendGrid](https://sendgrid.com)
2. Go to Settings → API Keys
3. Create a new API key with "Mail Send" permissions
4. Copy the API key (you'll only see it once!)

### Generating Session Secret

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 3. 🧪 Test the New Features

### Test Password Reset Flow

1. Start the dev server: `npm run dev`
2. Go to `/forgot-password`
3. Enter an email address
4. Check your email (or logs if SendGrid isn't configured)
5. Click the reset link
6. Set a new password

### Test Document Upload

1. Log in as a user
2. Go to Documents page
3. Upload a document
4. Verify it creates a record in the database
5. (As admin) Approve/reject the document
6. Verify email notifications are sent

### Test Event Registration Emails

1. Register for an event (authenticated or public)
2. Verify confirmation email is sent

## 4. 🚀 Production Deployment Checklist

### Before Deploying

- [ ] All environment variables configured in production
- [ ] Database schema pushed to production database
- [ ] SendGrid domain verified (for production emails)
- [ ] Supabase storage bucket created and configured
- [ ] Session secret is strong and unique
- [ ] `NODE_ENV=production` set
- [ ] `APP_URL` points to production domain
- [ ] Secure cookies enabled (automatic with `NODE_ENV=production`)
- [ ] Rate limiting configured appropriately
- [ ] Error logging set up (consider adding Sentry or similar)

### Security Checklist

- [x] Secure cookies enabled in production
- [x] Debug endpoints removed (`/api/make-me-admin`)
- [x] Rate limiting enabled
- [x] Helmet.js security headers enabled
- [x] Error messages don't leak sensitive info
- [ ] HTTPS enabled (usually handled by hosting provider)
- [ ] CORS configured if needed
- [ ] Database connection uses SSL in production

### Testing Checklist

- [ ] Password reset flow works
- [ ] Password change in profile works
- [ ] Document upload works
- [ ] Email notifications are sent
- [ ] Event registration emails work
- [ ] Admin document approval emails work
- [ ] All existing features still work

## 5. 📝 Optional Enhancements

### Short-term (before launch)

- Set up error monitoring (Sentry, LogRocket, etc.)
- Configure production logging
- Set up database backups
- Create admin user management interface improvements
- Add email templates customization

### Medium-term

- Implement membership renewal reminder cron job
- Add certificate generation for events
- Enhance profile editing (profile image upload)
- Add more comprehensive testing
- Performance optimization

### Long-term

- Stripe payment integration completion
- Mobile app considerations
- Advanced analytics
- Multi-language support

## 6. 🔍 Troubleshooting

### Email Not Sending

- Check SendGrid API key is correct
- Verify SendGrid account is activated
- Check email is not in spam
- Review server logs for errors
- Ensure `APP_URL` is correct for reset links

### File Upload Not Working

- Verify Supabase Storage credentials
- Check bucket exists and is accessible
- Verify bucket name matches configuration
- Check file size limits
- Review server logs for errors

### Database Migration Fails

- Ensure database connection is working
- Check you have proper permissions
- Verify schema changes are compatible
- Review Drizzle migration logs

## 7. 📚 Documentation Updates Needed

- Update README with new features
- Document email configuration
- Document file upload setup
- Update deployment guide
- Add troubleshooting guide for new features

