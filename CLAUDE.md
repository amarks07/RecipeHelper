# Nibble Development Guide

## Project Context

Nibble is a mobile-first recipe management app with OCR-powered recipe import from screenshots. It follows the **Barrow monorepo scaffolding** (React Native + Expo mobile, Next.js web, Supabase backend).

### Why This Matters
- Users can quickly save recipes by photographing them
- Full-text search across ingredients for meal planning
- Multi-device sync via Supabase
- Offline-first design ensures app works without connectivity

## Architecture

### Tech Stack
- **Mobile**: React Native 0.86.2 + Expo 57 + NativeWind
- **Web**: Next.js 16 + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Auth**: Supabase Auth (email/password + PKCE)
- **Storage**: S3 presigned URLs for images

### Project Structure
```
Nibble/
├── apps/mobile/           # React Native app (main deliverable)
│   ├── src/
│   │   ├── screens/       # Main UI screens
│   │   ├── components/    # Reusable components
│   │   ├── lib/          # Client-side utilities
│   │   ├── state/        # AppStateProvider extensions
│   │   └── theme/        # Design tokens, styling
│   ├── app.json          # Expo configuration
│   └── package.json      # Dependencies
├── apps/web/             # Next.js landing + app host
│   ├── app/              # App Router pages
│   ├── public/app/       # Exported mobile app (expo export output)
│   └── package.json      # Dependencies
├── packages/core/        # Shared code
│   └── src/
│       ├── hooks/        # useRecipeActions, useRecipeSync, etc.
│       ├── codecs/       # Data serialization
│       └── lib/          # supabaseClient
└── supabase/             # Backend configuration
    ├── migrations/       # Database schema
    ├── functions/        # Edge Functions (TypeScript)
    └── config.toml       # Supabase config
```

## Implementation Phases

### ✅ Phase 1: Foundation (Complete)
- Database schema with RLS
- Supabase Edge Functions
- Core React hooks for CRUD and sync

**Files Created**:
- `supabase/migrations/001_recipe_schema.sql` — Database design
- `supabase/functions/ocr-process/` — OCR text extraction
- `supabase/functions/recipe-save-from-ocr/` — Recipe creation
- `supabase/functions/recipe-image-upload/` — S3 presigned URLs
- `supabase/functions/recipe-search/` — Full-text search
- `packages/core/src/hooks/*.js` — Core state and sync logic

### Phase 2: Mobile CRUD (Next)
**Goal**: Basic recipe management on mobile

**Critical Files to Create**:
- `apps/mobile/src/screens/recipes/RecipeListScreen.js` — Display recipes
- `apps/mobile/src/screens/recipes/RecipeDetailScreen.js` — View one recipe
- `apps/mobile/src/screens/recipes/RecipeEditScreen.js` — Manual entry
- `apps/mobile/src/screens/profile/DietaryPreferencesScreen.js` — User settings
- `apps/mobile/src/components/recipes/RecipeCard.js` — List item component
- `apps/mobile/src/components/recipes/IngredientsList.js` — Ingredient editor
- `apps/mobile/src/navigation/RecipeStack.js` — Recipe tab navigation
- `apps/mobile/App.js` — Root app component

**Dependencies**: Phase 1 complete

### Phase 3: OCR & Image Capture (After Phase 2)
**Goal**: Screenshot-to-recipe import flow

**Critical Files to Create**:
- `apps/mobile/src/screens/recipes/RecipeOCRScreen.js` — Camera view
- `apps/mobile/src/screens/recipes/OCRReviewScreen.js` — Correction UI
- `apps/mobile/src/components/recipes/OCRConfidenceBadge.js` — Confidence visuals
- `packages/core/src/recipe-ocr.js` — OCR parsing utilities

**Dependencies**: Phase 2 complete

### Phase 4: Web App & Sync (After Phase 3)
**Goal**: Next.js interface for web + cross-device sync

**Critical Files to Create**:
- `apps/web/app/recipes/page.js` — Recipe list
- `apps/web/app/recipes/[id]/page.js` — Recipe detail
- `apps/web/app/recipes/new/page.js` — Create recipe
- `packages/core/src/recipe-sync.js` — Sync utilities

### Phase 5: Testing & Deployment (After Phase 4)
**Goal**: Production-ready

**Activities**:
- Add unit tests for hooks
- Add E2E tests for OCR flow
- Performance optimization
- Deployment guides

## Key Patterns (from Barrow)

### 1. Offline-First State Management
```javascript
// Local AsyncStorage + periodic cloud sync
const [recipes, setRecipes] = usePersistedState(
  k("recipehelper:recipes"),
  [],
  RECIPES_CODEC
);
useRecipeSync(setRecipes, session);
```

### 2. Optimistic Updates
```javascript
// UI updates immediately, sync in background
createRecipe(recipe);  // Updates local state first
// Then syncs to Supabase via useRecipeActions
```

### 3. Debounced Sync
```javascript
// Sync debounced 1500ms to avoid excessive API calls
const { debouncedSync } = useRecipeSync(setRecipes, session);
debouncedSync();  // Called on data change
```

### 4. Real-Time Subscriptions
```javascript
// Auto-sync when other devices update
supabase
  .channel('recipes')
  .on('postgres_changes', {...})
  .subscribe();
```

### 5. RLS Data Isolation
```sql
-- Users can only see their own recipes
CREATE POLICY "Users can view own recipes"
  ON public.recipes FOR SELECT
  USING (auth.uid() = user_id);
```

## Development Workflows

### Adding a New Feature
1. **Identify dependencies** — which hooks/tables/functions needed?
2. **Update database** — create migration if needed
3. **Create Edge Function** — if server logic required
4. **Implement hook** — in `packages/core/src/hooks/`
5. **Create screen** — in `apps/mobile/src/screens/`
6. **Add component** — in `apps/mobile/src/components/`
7. **Test** — locally on mobile + web

### Debugging

**Mobile App**:
- Use Expo DevTools: Press `j` in terminal while running
- React Native Debugger for Redux/state inspection

**Supabase**:
- Check RLS policies: Auth → Policies in dashboard
- Test queries: SQL Editor in dashboard
- Monitor Edge Functions: Functions → Logs

**Database**:
- Use Supabase Studio (dashboard) to browse tables
- Check RLS by selecting a table and viewing rows

## Code Style

### File Structure
- One component/hook per file
- Descriptive names: `RecipeListScreen.js` not `list.js`
- Use directories for related files:
  ```
  recipes/
  ├── RecipeListScreen.js
  ├── RecipeDetailScreen.js
  └── components/
      ├── RecipeCard.js
      └── IngredientsList.js
  ```

### Naming Conventions
- **Screens**: `PascalCase` (e.g., `RecipeListScreen`)
- **Components**: `PascalCase` (e.g., `RecipeCard`)
- **Hooks**: `use` prefix in camelCase (e.g., `useRecipeActions`)
- **Functions**: camelCase (e.g., `createRecipe`)
- **Constants**: SCREAMING_SNAKE_CASE (e.g., `SYNC_DEBOUNCE_MS`)

### Comments
- Only comment **why**, not **what** (code should be clear)
- Avoid comments for obvious code
- Use JSDoc for public hooks:
  ```javascript
  /**
   * Fetch recipes from cloud
   * @param {function} setRecipes - State setter
   * @param {object} session - Supabase session
   */
  ```

## Testing Strategy

### Unit Tests
- Test hooks independently: `useRecipeActions`, `useRecipeSync`, etc.
- Mock Supabase responses
- Location: `packages/core/src/__tests__/`

### Integration Tests
- Test OCR flow end-to-end: capture → process → save
- Test sync conflicts
- Test offline functionality

### Manual Testing Checklist
- [ ] Recipe creation works
- [ ] Offline mode doesn't crash
- [ ] Sync syncs after reconnect
- [ ] OCR import works with test images
- [ ] Web and mobile stay in sync
- [ ] Delete recipe works on both devices

## Performance Considerations

### Bundle Size
- Tree-shake unused code in web build
- Lazy-load screens: `React.lazy(() => import('./Screen'))`

### Image Optimization
- Compress with `expo-image-manipulator` before upload
- Use S3 CDN for fast delivery
- Serve resized thumbnails for lists

### Database Queries
- Use pagination for recipe lists
- Index search columns: `gin_trgm_ops` for full-text
- Lazy-load ingredient/instruction details

### Sync Performance
- Debounce sync (1500ms) to avoid thrashing
- Only sync changed recipes
- Batch updates when possible

## Debugging Common Issues

### "Network request failed"
- Check Supabase URL/keys in `.env`
- Verify RLS policies allow the operation
- Check CORS settings in Supabase

### "Auth session undefined"
- Session may not be hydrated yet
- Wrap screens with `useAppState()` to wait for `profileHydrated`

### OCR returns empty results
- Check Google Vision API key is set
- Verify S3 URL is accessible
- Check Edge Function logs in Supabase

### Sync not working
- Check `useRecipeSync` is called in top-level component
- Verify session is not null
- Check `debouncedSync()` is called on data changes

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Expo Documentation](https://docs.expo.dev)
- [Next.js App Router](https://nextjs.org/docs/app)
- [React Navigation](https://reactnavigation.org)
- [NativeWind](https://www.nativewind.dev)

## Contact

See parent `Nibble` README for setup and feature overview.
