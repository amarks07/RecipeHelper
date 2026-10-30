# Nibble

A mobile-first recipe management application with OCR-powered recipe import from screenshots. Built with React Native + Expo, Supabase, and Next.js deployment.

## Architecture Overview

Nibble follows the **Barrow monorepo pattern**:

```
Nibble/
├── apps/
│   ├── mobile/      # React Native + Expo app
│   └── web/         # Next.js deployment page
├── packages/
│   └── core/        # Shared hooks, utilities, Supabase client
└── supabase/
    ├── migrations/  # Database schema
    └── functions/   # Edge Functions for OCR, image upload, search
```

## Features

### Phase 1: Foundation ✅ (Complete)
- **Database Schema**: Recipes, ingredients, instructions, tags, OCR imports with RLS
- **Supabase Edge Functions**:
  - `ocr-process`: Legacy mobile OCR endpoint (not configured for cloud OCR)
  - `recipe-save-from-ocr`: Transform OCR output into structured recipes
  - `recipe-image-upload`: Generate presigned URLs for S3 uploads
  - `recipe-search`: Full-text search with PostgreSQL trigram index
- **Core Hooks**: `useRecipeActions`, `useRecipeSync`, `useRecipeSearch`
- **Configuration**: Expo app config, environment setup

### Phase 2: Mobile CRUD (In Progress)
- Recipe list, detail, and edit screens
- Manual recipe entry form
- Dietary preferences screen
- AppStateProvider integration

### Phase 3: OCR & Image Capture (Planned)
- Camera integration with Expo
- Image compression and upload
- OCR result review and correction
- Confidence scoring

### Phase 4: Web App (Planned)
- Next.js recipe management interface
- Recipe sharing and bulk import
- Deployment configuration

### Phase 5: Testing & Deployment (Planned)
- Unit and integration tests
- Performance optimization
- Mobile and web deployment

### Household sharing
- Recipes belong to a household and are visible to its members.
- Users can create or join households before adding recipes; owners can create multiple households and invite people by email.
- Invitees can accept or decline from Notifications. Household owners can rename or delete households, manage invitations, and remove members. Deleting a household permanently deletes its recipes, memberships, and invitations.
- Users in multiple households can filter recipes by household or view all household recipes.
- Invitations appear in the app for the matching signed-in email address.

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn (npm workspaces)
- Supabase account
- (Optional) AWS S3 bucket for images

### Setup

1. **Clone and install dependencies**:
   ```bash
   cd Nibble
   npm install
   ```

2. **Configure Supabase**:
   - Create a Supabase project at https://supabase.com
   - Copy your project URL and public anon key
   - Update `.env` files:
     ```bash
     # apps/mobile/.env
     EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
     EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
     
     # apps/web/.env.local
     NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
     ```

3. **Set up database**:
   ```bash
   npx supabase link --project-ref your-project-ref
   npx supabase db push
   ```

4. **Deploy Edge Functions**:
   ```bash
   npx supabase functions deploy ocr-process
   npx supabase functions deploy recipe-save-from-ocr
   npx supabase functions deploy recipe-image-upload
   npx supabase functions deploy recipe-search
   npx supabase functions deploy send-household-invite
   ```

5. **Configure household invitation emails**:
   - Verify a sending domain with Resend and create an API key.
   - Set `RESEND_API_KEY`, `HOUSEHOLD_INVITE_FROM_EMAIL` (for example, `Nibble <invites@your-domain.com>`), and `APP_URL` (the public web app URL) as Supabase function secrets.
     ```bash
     npx supabase secrets set RESEND_API_KEY="your-resend-api-key" HOUSEHOLD_INVITE_FROM_EMAIL="Nibble <invites@your-domain.com>" APP_URL="https://your-app.example.com"
     ```
   - Apply database migrations with `npx supabase db push` so the pending-invite retry behavior is available.

### Development

**Mobile app**:
```bash
npm run start --workspace=apps/mobile
# or
npm run web --workspace=apps/mobile  # web preview
```

**Web app**:
```bash
npm run dev --workspace=apps/web
```

**Build web deployment**:
```bash
npm run build:web  # Builds mobile app and exports to web
```

## Database Schema

### Core Tables

- **recipes**: Title, description, prep/cook times, servings, image URL
- **recipe_ingredients**: Ingredient details with quantity and unit
- **recipe_instructions**: Step-by-step cooking instructions
- **recipe_tags**: Recipe categorization (e.g., "vegan", "quick")
- **user_dietary_profiles**: User preferences, allergies, dietary restrictions
- **ocr_imports**: Audit trail for OCR processing with raw text and results

All tables use Row Level Security (RLS) — users can only access their own data.

## API Reference

### Edge Functions

**POST `/ocr-process`**
- Legacy mobile endpoint; returns `501` when cloud OCR is unavailable
- Auth: Required (JWT)

**POST `/recipe-save-from-ocr`**
- Input: OCR result, title, ingredients, instructions, tags
- Output: Saved recipe ID
- Auth: Required

**POST `/recipe-image-upload`**
- Input: `fileName`, `contentType`
- Output: Presigned S3 URL for direct upload
- Auth: Required

**POST `/recipe-search`**
- Input: `query`, `tags`, `limit`, `offset`
- Output: Matching recipes with full-text search
- Auth: Required

### React Hooks

**useRecipeActions**(recipes, setRecipes)
- `createRecipe(recipe)`: Create recipe with optimistic update
- `updateRecipe(recipeId, updates)`: Update recipe
- `deleteRecipe(recipeId)`: Delete recipe
- `getRecipeById(recipeId)`: Fetch recipe

**useRecipeSync**(setRecipes, session)
- `syncFromCloud()`: Fetch recipes from Supabase
- `debouncedSync()`: Debounced sync (1500ms)
- Automatic real-time subscription to recipe changes

**useRecipeSearch**(recipes)
- `searchLocal(query)`: Local filtering
- `searchCloud(query, tags, limit)`: Server-side full-text search
- `filterByTags(selectedTags)`: Filter by recipe tags

## State Management

Follows **Barrow's pattern**:
- **Local Storage**: AsyncStorage (mobile) or localStorage (web) for offline-first
- **Cloud Sync**: Debounced sync to Supabase every 1500ms
- **Optimistic Updates**: UI updates immediately, syncs in background
- **Conflict Resolution**: Last-write-wins with server timestamp

## Web Recipe Import

- Recipe links are read by the web app's same-origin importer, which extracts Schema.org Recipe data and falls back to visible page text.
- Screenshot OCR runs in the browser with the open-source Tesseract.js package; no paid OCR service or API key is used.
- Extracted details are editable before saving, and the original link or screenshot is retained with the recipe.
- Link fetching is limited to public HTTP(S) pages, with redirect, timeout, and response-size limits.

## Deployment

### Mobile App
- Distribute via Expo EAS or direct APK download
- Vercel web download page with GitHub releases integration

### Web App
1. Push to GitHub
2. Import at vercel.com/new
3. Set Root Directory to `apps/web`
4. Vercel detects npm workspace automatically

## Next Steps (TODO)

1. **Create mobile screens** (Phase 2):
   - RecipeListScreen with search/filter
   - RecipeDetailScreen with cooking view
   - RecipeEditScreen for manual entry

2. **Add OCR capture flow** (Phase 3):
   - RecipeOCRScreen with camera preview
   - OCRReviewScreen for corrections
   - Confidence badge components

3. **Build web app** (Phase 4):
   - Recipe management pages
   - Bulk import interface
   - Sharing functionality

4. **Testing & optimization** (Phase 5):
   - Unit tests for hooks
   - Integration tests for OCR flow
   - Performance profiling

## Architecture Decisions

### Why local web OCR?
- **No OCR service fees**: Tesseract.js runs in the user's browser.
- **Privacy**: Screenshot pixels are not sent to an OCR provider.
- **Reviewable results**: Imported fields remain editable before saving.

### Why Supabase?
- **Built-in Auth**: Email/password with JWT
- **RLS**: User data isolation at database level
- **Real-time**: Automatic subscriptions for multi-device sync
- **Edge Functions**: Server-side logic without separate backend

### Why Monorepo?
- **Code sharing**: Hooks and utilities between mobile/web
- **Consistent patterns**: Follow Barrow's established approach
- **Single deployment**: One push → mobile + web updates

## Contributing

See `/CLAUDE.md` for development guidelines and project context.

## License

MIT
