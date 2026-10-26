# RecipeHelper Setup Guide

Complete step-by-step guide to get RecipeHelper running with Supabase.

## Prerequisites

- Node.js 18+
- npm or yarn
- Git
- Supabase account (free tier works!)

---

## Step 1: Create Supabase Project

### 1.1 Sign up / Sign in
- Go to [supabase.com](https://supabase.com)
- Click "Sign up" or sign in with GitHub
- Create new organization (or use existing)

### 1.2 Create project
1. Click "New Project"
2. **Name**: `recipehelper` (or your preferred name)
3. **Database Password**: Create a strong password (save it!)
4. **Region**: Choose closest to your location
5. Click "Create new project"

**Wait 2-3 minutes** for project to initialize.

### 1.3 Get project credentials
Once project is ready:
1. Go to **Settings** (bottom left)
2. Click **API**
3. Copy:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public key** (under "Project API keys")

Save these - you'll need them for `.env` files.

---

## Step 2: Create Database Tables

### 2.1 Run migrations locally

```bash
# Navigate to project root
cd C:\github\RecipeHelper

# Install Supabase CLI globally
npm install -g supabase

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Paste your database password when prompted
```

**To find YOUR_PROJECT_REF**:
- In Supabase dashboard, go to Settings > General
- Find "Reference ID" (first part of your project URL)
- Example: If URL is `https://abcdef123.supabase.co`, ref is `abcdef123`

### 2.2 Push schema to Supabase

```bash
# Create tables from migration file
supabase db push

# You should see:
# ✓ Loaded env from .env.local
# ✓ Connecting to your database
# ✓ Running migration 001_recipe_schema.sql
# ✓ Migration completed
```

### 2.3 Verify tables were created

In Supabase dashboard:
1. Go to **Table Editor** (left sidebar)
2. You should see:
   - `recipes`
   - `recipe_ingredients`
   - `recipe_instructions`
   - `recipe_tags`
   - `user_dietary_profiles`
   - `ocr_imports`

If you don't see them, check the SQL Editor for errors.

---

## Step 3: Deploy Edge Functions

Edge Functions handle OCR processing and search.

### 3.1 Deploy functions

```bash
# Navigate to RecipeHelper root
cd C:\github\RecipeHelper

# Deploy OCR processing function
supabase functions deploy ocr-process

# Deploy recipe save function
supabase functions deploy recipe-save-from-ocr

# Deploy image upload function
supabase functions deploy recipe-image-upload

# Deploy search function
supabase functions deploy recipe-search

# Expected output: Function deployed successfully
```

### 3.2 Verify functions

In Supabase dashboard:
1. Go to **Edge Functions** (left sidebar)
2. You should see 4 functions listed:
   - `ocr-process`
   - `recipe-save-from-ocr`
   - `recipe-image-upload`
   - `recipe-search`

---

## Step 4: Set Environment Variables

### 4.1 Web app

Create/update `apps/web/.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

Replace with actual values from Step 1.3

### 4.2 Mobile app

Create/update `apps/mobile/.env`:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

**Important**: 
- These files should NOT be committed to git
- `.env` and `.env.local` are in `.gitignore`
- Each developer creates their own locally

---

## Step 5: Test Connection

### 5.1 Test web app

```bash
# Install dependencies
npm install

# Start dev server
npm run dev --workspace=apps/web

# Open http://localhost:3000

# Try to:
# 1. Go to /auth/login
# 2. Click "Sign Up"
# 3. Create account with test@example.com
# 4. Check Supabase dashboard > Auth > Users
#    (You should see your new user)
```

### 5.2 Test mobile app

```bash
# Install dependencies
npm install

# Start Expo dev server
npm run start --workspace=apps/mobile

# Scan QR code with Expo Go app
# Or press 'w' for web preview

# Try to:
# 1. Sign up
# 2. Create recipe
# 3. Check Supabase > recipes table
#    (You should see your recipe)
```

---

## Step 6: Enable Authentication Email (Optional)

To send real emails for signup confirmation:

### 6.1 Configure email provider

In Supabase dashboard:
1. Go to **Authentication** > **Providers**
2. Scroll to "Email"
3. Look for "Email Templates" tab
4. Default is "Auth0 email" (limited, but works for testing)

For production, set up SendGrid or other provider:
1. Go to **Authentication** > **Providers**
2. Find your email provider section
3. Add credentials

---

## Step 7: Test Full Flow

### On Web:

```
1. Visit http://localhost:3000
2. Click "Go to Recipes"
3. Redirected to /auth/login (because not signed in)
4. Click "Sign up"
5. Create account
6. Check email for confirmation (check spam folder)
7. Confirm email (or skip if using default email provider)
8. Sign in
9. Create recipe
10. Recipe appears in list
11. Click recipe to view details
12. Edit/delete recipe
13. Sign out (goes back to login)
```

### On Mobile:

```
1. Start app
2. See LoginScreen (because not signed in)
3. Click "Sign up"
4. Create account
5. Confirm email
6. Sign in
7. RecipeListScreen appears
8. Click camera button to start OCR
9. Or click + button to manually create recipe
10. Recipe syncs to web
11. Profile > Sign Out
```

---

## Step 8: Verify Cloud Sync

### Test sync between devices

**Web**:
```
1. Sign in on web (http://localhost:3000)
2. Create recipe "Web Test"
3. Go to /recipes - should appear
```

**Mobile**:
```
1. Sign in on mobile
2. Pull down to refresh
3. "Web Test" recipe should appear
4. Create new recipe "Mobile Test"
```

**Back to Web**:
```
1. Refresh /recipes
2. Should see "Mobile Test" (synced from mobile!)
```

If both recipes appear on both platforms - **SYNC WORKS!** ✅

---

## Troubleshooting

### "Connection refused" error

**Problem**: Can't connect to Supabase

**Solution**:
1. Check environment variables are set correctly
2. Verify Project URL is correct (no typos)
3. Verify anon key is correct
4. Try restarting dev server: `npm run dev`

### "User not found" after signup

**Problem**: Created account but can't sign in

**Solution**:
1. Check Supabase > Authentication > Users
2. Verify email confirmation (check `email_confirmed_at`)
3. If using auth0 email, confirmation might be auto (check date)
4. Try creating new account with different email

### Tables not created

**Problem**: Ran `supabase db push` but no tables appear

**Solution**:
1. Check SQL Editor in Supabase dashboard
2. Run migration manually:
   ```sql
   -- Copy all SQL from supabase/migrations/001_recipe_schema.sql
   -- Paste into SQL Editor
   -- Run
   ```
3. Check for SQL errors in dashboard > Logs

### Edge Functions return 404

**Problem**: Calling OCR function but getting 404

**Solution**:
1. Check function was deployed: `supabase functions list`
2. Try redeploying: `supabase functions deploy ocr-process`
3. Check function logs: Supabase dashboard > Edge Functions > Select function > Logs

### Recipes not syncing

**Problem**: Created on mobile, doesn't appear on web

**Solution**:
1. Check user is same on both (sign in with same email)
2. Manually refresh web page (might need to wait 5 seconds)
3. Check Supabase > recipes table for new rows
4. Check RLS policies: Supabase > Authentication > Policies
   - Should see "Users can view own recipes"

### "Row Level Security (RLS) violation"

**Problem**: Getting RLS error when trying to save recipe

**Solution**:
1. Check RLS policies are enabled correctly
2. In Supabase > Table Editor > recipes
3. Click "RLS" button (top right)
4. Ensure policies exist (should see "Users can insert own recipes")
5. If missing, run the migration again

---

## Quick Reference

### Environment Variables

**Web** (`.env.local`):
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

**Mobile** (`.env`):
```
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

### Key Supabase Locations

- **Tables**: Dashboard > Table Editor
- **Users**: Dashboard > Authentication > Users
- **Logs**: Dashboard > Logs
- **Functions**: Dashboard > Edge Functions
- **API Keys**: Settings > API
- **RLS Policies**: Table Editor > RLS (per table)

### Common Commands

```bash
# Link project
supabase link --project-ref YOUR_REF

# Push migrations
supabase db push

# Deploy functions
supabase functions deploy FUNCTION_NAME

# List functions
supabase functions list

# View logs
supabase functions logs FUNCTION_NAME

# Stop everything
supabase stop
```

---

## Next Steps

Once everything is set up:

1. **Mobile app**: Build for iOS/Android using EAS
   ```bash
   eas build --platform ios  # or android
   ```

2. **Web app**: Deploy to Vercel
   ```bash
   # Push to GitHub
   git push origin main
   
   # Go to vercel.com/new
   # Import RecipeHelper repo
   # Set environment variables
   # Deploy!
   ```

3. **Share with others**: Get download link for mobile app or vercel.com URL for web

---

## Security Notes

- ✅ Never commit `.env` or `.env.local` files
- ✅ Anon key is public (only has read/write to user's data via RLS)
- ✅ RLS ensures users only see their own recipes
- ✅ Database password is never exposed to client
- ✅ Always use HTTPS in production

---

## Support

If you run into issues:

1. Check Supabase logs: Dashboard > Logs
2. Check browser console for errors (F12)
3. Check terminal output
4. Read error message carefully - usually points to the issue

Common error messages:
- **"relation 'public.recipes' does not exist"** → Tables not created, run migration
- **"Invalid API Key"** → Wrong anon key, check .env file
- **"new row violates row-level security policy"** → User not authenticated or RLS misconfigured
- **"Function not found"** → Edge function not deployed

---

**You're now ready to run RecipeHelper with a live Supabase backend!** 🚀
