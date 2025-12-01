# Stripe Payment Integration Setup Guide

This guide will help you set up Stripe payments for the $4.99/month subscription with usage limits.

## 🎯 What You Get

### Free Tier (10 Actions Per Day)
- ✅ 10 games per day
- ✅ 10 stories per day
- ✅ 10 battles per day
- ✅ All features with daily limits

### Premium Tier ($4.99/month)
- ✅ **Unlimited** games
- ✅ **Unlimited** story creation
- ✅ **Unlimited** battles
- ✅ Premium badge
- ✅ Cancel anytime

## 📋 Prerequisites

1. A Stripe account (create one at https://stripe.com)
2. Your Supabase project is already set up
3. Node.js and npm installed

## 🚀 Step 1: Create Stripe Account & Get Keys

1. Go to https://stripe.com and create an account
2. Navigate to **Developers** → **API Keys**
3. Copy your:
   - **Publishable key** (starts with `pk_test_` or `pk_live_`)
   - **Secret key** (starts with `sk_test_` or `sk_live_`)

## 💰 Step 2: Create Product & Price in Stripe

1. Go to **Products** in your Stripe Dashboard
2. Click **+ Add Product**
3. Fill in:
   - **Name**: Premium Subscription
   - **Description**: Unlimited access to games, stories, and battles
   - **Pricing**: Recurring
   - **Price**: $4.99
   - **Billing period**: Monthly
4. Click **Save product**
5. Copy the **Price ID** (starts with `price_`)

## 🔧 Step 3: Configure Environment Variables

Add these to your `.env` file:

```bash
# Stripe Keys
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
VITE_STRIPE_PRICE_ID=price_your_price_id_here

# These are already set in Supabase Edge Functions automatically:
# STRIPE_SECRET_KEY=sk_test_your_secret_key_here
# STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

## 🪝 Step 4: Set Up Stripe Webhook

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **+ Add endpoint**
3. Set the endpoint URL to:
   ```
   https://your-project-ref.supabase.co/functions/v1/stripe-webhook
   ```
4. Select these events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Click **Add endpoint**
6. Copy the **Signing secret** (starts with `whsec_`)

## 🔐 Step 5: Configure Supabase Secrets

You need to set the Stripe secrets in Supabase:

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **Edge Functions** → **Secrets**
3. Add these secrets:
   - `STRIPE_SECRET_KEY`: Your Stripe secret key
   - `STRIPE_WEBHOOK_SECRET`: Your webhook signing secret

Or use the Supabase CLI:

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_your_key_here
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

## ✅ Step 6: Test the Integration

### Test Mode (Recommended First)

1. Use Stripe test keys (start with `pk_test_` and `sk_test_`)
2. Test card numbers:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - Use any future expiry date and any CVC

### Testing Flow

1. Sign up or sign in to your app
2. Try to use a feature more than 10 times (e.g., play 11 games)
3. You should see the upgrade modal
4. Click "Continue to Checkout"
5. Use test card `4242 4242 4242 4242`
6. Complete the checkout
7. You should be redirected back with unlimited access

### Verify Subscription

Check in Supabase:
```sql
SELECT * FROM subscriptions WHERE user_id = 'your-user-id';
```

## 🔴 Going Live

When ready for production:

1. Switch to **Live mode** in Stripe Dashboard
2. Get your live API keys (start with `pk_live_` and `sk_live_`)
3. Create a new product/price in live mode
4. Update your `.env` with live keys
5. Update webhook endpoint to use live keys
6. Update Supabase secrets with live keys

## 🛠️ How It Works

### Usage Tracking

- Each user gets 10 free actions per day for each category (games, stories, battles)
- Usage resets daily at midnight UTC
- Premium users have unlimited access

### Database Tables

1. **user_usage_tracking**: Tracks daily usage per user
2. **subscriptions**: Stores Stripe subscription data

### Key Functions

- `check_usage_limit()`: Checks if user can perform action
- `increment_usage()`: Increments usage counter after action
- `has_premium_access()`: Checks if user has active subscription

### Edge Functions

1. **create-checkout-session**: Creates Stripe checkout session
2. **stripe-webhook**: Handles Stripe webhook events

## 🐛 Troubleshooting

### "Stripe is not configured" Error

- Make sure `VITE_STRIPE_PUBLISHABLE_KEY` is set in `.env`
- Restart your dev server after adding env variables

### Webhook Not Working

- Verify webhook URL is correct
- Check that webhook secret is set in Supabase
- Test webhook in Stripe Dashboard → Webhooks → Send test webhook

### Usage Limits Not Working

- Ensure user is signed in
- Check database functions are created (run migration)
- Verify RLS policies are enabled

## 📊 Monitoring

### Check Payments
- Stripe Dashboard → Payments

### Check Subscriptions
- Stripe Dashboard → Customers → Subscriptions

### Check Database
```sql
-- View all subscriptions
SELECT * FROM subscriptions;

-- View today's usage
SELECT * FROM user_usage_tracking WHERE date = CURRENT_DATE;

-- Check premium users
SELECT u.email, s.status, s.current_period_end
FROM auth.users u
JOIN subscriptions s ON u.id = s.user_id
WHERE s.status IN ('active', 'trialing');
```

## 💡 Tips

1. **Start with test mode** - Always test thoroughly before going live
2. **Test all webhook events** - Verify subscription updates and cancellations work
3. **Monitor usage** - Keep an eye on daily usage patterns
4. **Customer support** - Have a plan for handling subscription issues
5. **Legal** - Add terms of service and privacy policy for subscriptions

## 🔗 Useful Links

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Testing](https://stripe.com/docs/testing)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)

## 🎉 You're All Set!

Your freemium model is ready! Users can try the app with limits, get hooked on the features, and upgrade to premium for unlimited access.

---

**Need Help?** Check the troubleshooting section or review the Stripe and Supabase documentation.
