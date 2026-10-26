# RecipeHelper

A mobile-first recipe management application with OCR-powered recipe import from screenshots. Built with React Native + Expo, Supabase, and Next.js deployment.

## Architecture Overview

RecipeHelper follows the **Barrow monorepo pattern**:

```
RecipeHelper/
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
  - `ocr-process`: Extract text from recipe images using Google Cloud Vision
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

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn (npm workspaces)
- Supabase account
- (Optional) Google Cloud Vision API key
- (Optional) AWS S3 bucket for images

### Setup

1. **Clone and install dependencies**:
   ```bash
   cd RecipeHelper
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
   ```

5. **Configure OCR** (Optional):
   - Set `GOOGLE_VISION_API_KEY` in Supabase secrets
   - Update `supabase/functions/ocr-process/index.ts` to call actual Vision API

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
- Input: `imageUrl` (S3 URL) or `base64Image`
- Output: Structured recipe with ingredients, instructions, confidence scores
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

## OCR Processing

**Pipeline**:
1. User captures recipe image or selects from gallery
2. Image compressed with `expo-image-manipulator`
3. Uploaded to S3 via presigned URL
4. Edge Function calls Google Cloud Vision API
5. Heuristic parser extracts ingredients, instructions, metadata
6. User reviews and corrects OCR results
7. `recipe-save-from-ocr` creates database records

**Confidence Scoring**:
- Each ingredient/field gets confidence score (0-1)
- Low-confidence fields highlighted for user review
- Corrections stored for model improvement

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

### Why Google Cloud Vision + Edge Functions?
- **Security**: API keys never reach client
- **Cost**: Server-side rate limiting
- **Accuracy**: Professional OCR vs. client-side alternatives
- **Flexibility**: Can add Claude API for recipe parsing enhancement

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
