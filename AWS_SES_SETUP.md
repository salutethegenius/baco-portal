# AWS SES Setup Guide

## ✅ What's Been Configured

The application has been migrated from SendGrid to AWS SES. All email functionality now uses AWS Simple Email Service.

### Configuration Details

- **Region**: `us-east-1` (US East N. Virginia)
- **From Email**: `noreply@baco-portal.com`
- **Domain**: `baco-portal.com` (verified in AWS SES)

## 🔑 Required AWS Credentials

You need to provide the following environment variables:

```env
AWS_ACCESS_KEY_ID=your_aws_access_key_id_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key_here
AWS_SES_REGION=us-east-1
AWS_SES_FROM_EMAIL=noreply@baco-portal.com
```

### How to Get AWS Credentials

1. **Sign in to AWS Console**: [console.aws.amazon.com](https://console.aws.amazon.com)

2. **Create/Select IAM User**:
   - Go to **IAM → Users**
   - Click "Create user" or select an existing user
   - Name the user (e.g., `baco-ses-sender`)

3. **Attach SES Permissions**:
   - Click "Add permissions"
   - Attach the `AmazonSESFullAccess` policy
   - Or create a custom policy with minimum required permissions:
     ```json
     {
       "Version": "2012-10-17",
       "Statement": [
         {
           "Effect": "Allow",
           "Action": [
             "ses:SendEmail",
             "ses:SendRawEmail"
           ],
           "Resource": "*"
         }
       ]
     }
     ```

4. **Create Access Key**:
   - Go to **Security credentials** tab
   - Scroll to "Access keys" section
   - Click "Create access key"
   - Choose "Application running outside AWS"
   - Copy the **Access Key ID** and **Secret Access Key**
   - ⚠️ **Important**: You'll only see the secret key once! Save it securely.

5. **Verify Email/Domain** (if not already done):
   - Go to **SES Console → Verified Identities**
   - Verify `noreply@baco-portal.com` or the domain `baco-portal.com`
   - Check your email for verification link (if verifying individual email)

## 📝 Environment Variables

Add these to your `.env` file:

```env
# AWS SES Email Configuration
AWS_ACCESS_KEY_ID=your_access_key_id_here
AWS_SECRET_ACCESS_KEY=your_secret_access_key_here
AWS_SES_REGION=us-east-1
AWS_SES_FROM_EMAIL=noreply@baco-portal.com
```

## ✅ Verification Checklist

- [ ] AWS SES credentials created in IAM
- [ ] Email `noreply@baco-portal.com` verified in SES (or domain verified)
- [ ] Environment variables added to `.env` file
- [ ] SES is out of sandbox mode (if sending to unverified emails)
- [ ] Test email sent successfully

## 🧪 Testing

1. Start the application: `npm run dev`
2. Try the password reset flow: `/forgot-password`
3. Check your email for the reset link
4. Review server logs for any errors

## 🚨 Important Notes

### SES Sandbox Mode

If your AWS SES account is in **sandbox mode**:
- You can only send emails to verified email addresses
- To send to any email address, request production access:
  1. Go to SES Console → Account dashboard
  2. Click "Request production access"
  3. Fill out the request form
  4. Wait for AWS approval (usually 24 hours)

### Sending Limits

- **Sandbox**: 200 emails/day, 1 email/second
- **Production**: Higher limits (adjustable based on your needs)

### Bounce/Complaint Rates

- Keep bounce rate below 5%
- Keep complaint rate below 0.1%
- Monitor these in SES Console → Reputation metrics

## 📚 Related Files

- Email service: `server/email.ts`
- Environment config: `.env`
- Documentation: `LOCAL_SETUP.md`, `VERCEL_DEPLOYMENT.md`
