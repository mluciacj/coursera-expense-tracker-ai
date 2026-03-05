# How to Reset Your Password

> **Note:** The password-reset feature is not yet available. This guide describes how it will work once released.

**Technical details:** [../dev/password-reset-implementation.md](../dev/password-reset-implementation.md)

---

## What This Feature Does

If you've forgotten your password, the password-reset flow lets you create a new one without contacting support. You'll receive a secure, one-time link by email that expires after 15 minutes.

---

## Who It's For

Anyone with a registered Expense Tracker account who can no longer sign in because they've forgotten their password.

---

## Before You Start

- You must have a registered account (email + password).
- You need access to the email address associated with your account.
- The reset link expires **15 minutes** after it is sent — complete the process in one go.
- Check your spam / junk folder if the email doesn't arrive within a few minutes.

---

## Step-by-Step Instructions

### Step 1 — Open the login page

Go to the Expense Tracker app and click **Sign in**. On the login form, click the **"Forgot password?"** link beneath the password field.

<!-- TODO screenshot: login page with "Forgot password?" link highlighted -->

---

### Step 2 — Enter your email address

On the **Forgot Password** page, type the email address you used when you registered, then click **Send reset link**.

<!-- TODO screenshot: forgot-password form with email field and "Send reset link" button -->

> You will always see a confirmation message ("If an account exists for that email, a reset link has been sent.") regardless of whether the email is registered. This is intentional — it prevents others from finding out which emails are signed up.

---

### Step 3 — Check your email

Open the email from **noreply@yourapp.com** with the subject **"Reset your Expense Tracker password"**. Click the **Reset password** button inside the email.

<!-- TODO screenshot: example reset email with the "Reset password" button visible -->

If the button doesn't work, copy and paste the full URL from the email into your browser.

---

### Step 4 — Set your new password

The link opens the **Reset Password** page. Enter your new password twice and click **Update password**.

Password requirements:
- At least 8 characters
- At least one letter and one number

---

### Step 5 — Sign in with your new password

After a successful reset you'll be redirected to the login page. Sign in with your new password as usual.

---

## Troubleshooting / FAQ

**I didn't receive the email.**
- Wait 2–3 minutes and check your spam/junk folder.
- Make sure you typed the correct email address. If unsure, try again on the Forgot Password page.
- If the email still doesn't arrive, the address may not be registered.

**The link says it has expired.**
- Reset links are valid for 15 minutes. Return to the Forgot Password page and request a new link.

**The link says it has already been used.**
- Each link can only be used once. If you didn't use it, someone else with access to your email may have. Consider requesting a new link and reviewing your email account security.

**I reset my password but I still can't sign in.**
- Make sure Caps Lock is off.
- Try copy-pasting the password if you saved it in a manager.
- Clear your browser cache and try again.

**I don't know which email I registered with.**
- Contact support — there is no automated way to look this up.

---

## Related

- Technical details: [../dev/password-reset-implementation.md](../dev/password-reset-implementation.md)
