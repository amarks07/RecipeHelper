import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Same pattern as Barrow: optional Supabase client, allows app to work offline
export const supabase =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: {
          // Detect platform automatically (AsyncStorage for React Native, localStorage for web)
          storage: typeof window === 'undefined' ? null : undefined,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      })
    : null;
