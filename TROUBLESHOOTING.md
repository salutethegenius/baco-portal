# Troubleshooting Guide

## Admin Login

✅ **Admin account has been created/reset:**
- Email: `admin@baco.com`
- Password: `admin123`

## Registration Failed Issue

If you're getting "Registration failed" when trying to create a new account, here are the most common causes:

### 1. Check Server Console

Look at the terminal where you ran `npm run dev` - you should see detailed error messages that will tell us what's wrong.

Common errors you might see:

**"Email already exists"**
- Someone already registered with that email
- Try a different email address

**Database connection error**
- The DATABASE_URL might be incorrect
- Check your `.env` file

**SendGrid API key error**
- This won't block registration, but you'll see a warning
- Registration should still work even if emails don't send

### 2. Common Fixes

**Try registering with a different email** - maybe that email is already taken

**Check the browser console** (F12 → Console tab) - you might see more error details there

**Check the server terminal** - The error message will tell us exactly what's wrong

### 3. Test Registration

Try these steps:
1. Use a completely new email address (like `test123@example.com`)
2. Make sure all fields are filled: First Name, Last Name, Email, Password, Confirm Password
3. Check the server terminal for the actual error message

### 4. If Still Not Working

Share the error message from the server terminal (where you ran `npm run dev`) and I can help fix it!

## Need More Help?

Run this command to see if the server is running properly:
```bash
npm run dev
```

Then try registering again and share any error messages you see in the terminal.

