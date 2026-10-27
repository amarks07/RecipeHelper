-- Nibble Database Schema
-- Phase 1: Core recipe and user management tables

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Enable RLS on all tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;

-- ============================================================================
-- USER DIETARY PROFILES (extends Supabase auth.users)
-- ============================================================================
CREATE TABLE public.user_dietary_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  dietary_restrictions TEXT[] DEFAULT '{}', -- e.g., ['vegan', 'gluten-free']
  allergies TEXT[] DEFAULT '{}', -- e.g., ['peanuts', 'shellfish']
  preferred_units TEXT DEFAULT 'metric', -- 'metric' or 'imperial'
  cuisine_preferences TEXT[] DEFAULT '{}', -- e.g., ['Italian', 'Asian']
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.user_dietary_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own dietary profile"
  ON public.user_dietary_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own dietary profile"
  ON public.user_dietary_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own dietary profile"
  ON public.user_dietary_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- RECIPES
-- ============================================================================
CREATE TABLE public.recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  prep_time_minutes INTEGER,
  cook_time_minutes INTEGER,
  servings TEXT,
  source_url TEXT,
  recipe_data JSONB DEFAULT '{}', -- flexible storage for nutrition, ratings, notes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_recipes_user_id ON public.recipes(user_id);
CREATE INDEX idx_recipes_created_at ON public.recipes(created_at);
CREATE INDEX idx_recipes_title_trgm ON public.recipes USING gin(title gin_trgm_ops);
CREATE INDEX idx_recipes_description_trgm ON public.recipes USING gin(description gin_trgm_ops);

CREATE POLICY "Users can view own recipes"
  ON public.recipes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recipes"
  ON public.recipes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recipes"
  ON public.recipes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own recipes"
  ON public.recipes FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- RECIPE INGREDIENTS
-- ============================================================================
CREATE TABLE public.recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  ingredient TEXT NOT NULL,
  quantity NUMERIC,
  unit TEXT, -- 'cups', 'grams', 'tbsp', etc.
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_recipe_ingredients_recipe_id ON public.recipe_ingredients(recipe_id);
CREATE INDEX idx_recipe_ingredients_ingredient_trgm ON public.recipe_ingredients USING gin(ingredient gin_trgm_ops);

CREATE POLICY "Users can view ingredients of own recipes"
  ON public.recipe_ingredients FOR SELECT
  USING (
    recipe_id IN (
      SELECT id FROM public.recipes WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage ingredients in own recipes"
  ON public.recipe_ingredients FOR INSERT
  WITH CHECK (
    recipe_id IN (
      SELECT id FROM public.recipes WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update ingredients in own recipes"
  ON public.recipe_ingredients FOR UPDATE
  USING (
    recipe_id IN (
      SELECT id FROM public.recipes WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete ingredients from own recipes"
  ON public.recipe_ingredients FOR DELETE
  USING (
    recipe_id IN (
      SELECT id FROM public.recipes WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- RECIPE INSTRUCTIONS
-- ============================================================================
CREATE TABLE public.recipe_instructions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  step TEXT NOT NULL,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.recipe_instructions ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_recipe_instructions_recipe_id ON public.recipe_instructions(recipe_id);

CREATE POLICY "Users can view instructions of own recipes"
  ON public.recipe_instructions FOR SELECT
  USING (
    recipe_id IN (
      SELECT id FROM public.recipes WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage instructions in own recipes"
  ON public.recipe_instructions FOR INSERT
  WITH CHECK (
    recipe_id IN (
      SELECT id FROM public.recipes WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update instructions in own recipes"
  ON public.recipe_instructions FOR UPDATE
  USING (
    recipe_id IN (
      SELECT id FROM public.recipes WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete instructions from own recipes"
  ON public.recipe_instructions FOR DELETE
  USING (
    recipe_id IN (
      SELECT id FROM public.recipes WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- RECIPE TAGS
-- ============================================================================
CREATE TABLE public.recipe_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  tag_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.recipe_tags ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_recipe_tags_recipe_id ON public.recipe_tags(recipe_id);
CREATE INDEX idx_recipe_tags_tag_name ON public.recipe_tags(tag_name);

CREATE POLICY "Users can view tags of own recipes"
  ON public.recipe_tags FOR SELECT
  USING (
    recipe_id IN (
      SELECT id FROM public.recipes WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage tags in own recipes"
  ON public.recipe_tags FOR INSERT
  WITH CHECK (
    recipe_id IN (
      SELECT id FROM public.recipes WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update tags in own recipes"
  ON public.recipe_tags FOR UPDATE
  USING (
    recipe_id IN (
      SELECT id FROM public.recipes WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete tags from own recipes"
  ON public.recipe_tags FOR DELETE
  USING (
    recipe_id IN (
      SELECT id FROM public.recipes WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- OCR IMPORTS (tracks OCR processing and results)
-- ============================================================================
CREATE TABLE public.ocr_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  raw_ocr_text TEXT,
  ocr_result JSONB, -- structured OCR output: title, ingredients, instructions, confidence
  processing_status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  error_message TEXT,
  recipe_id UUID REFERENCES public.recipes(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.ocr_imports ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_ocr_imports_user_id ON public.ocr_imports(user_id);
CREATE INDEX idx_ocr_imports_status ON public.ocr_imports(processing_status);
CREATE INDEX idx_ocr_imports_recipe_id ON public.ocr_imports(recipe_id);

CREATE POLICY "Users can view own OCR imports"
  ON public.ocr_imports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own OCR imports"
  ON public.ocr_imports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own OCR imports"
  ON public.ocr_imports FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to ensure user has a dietary profile on first auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_dietary_profiles (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create dietary profile on user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER recipes_updated_at
BEFORE UPDATE ON public.recipes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER user_dietary_profiles_updated_at
BEFORE UPDATE ON public.user_dietary_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
