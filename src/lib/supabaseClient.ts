import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Use a stable, app-specific storage key to avoid picking up stale sessions from other projects/environments
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'hirenest-landing-auth-v1',
  },
});

// Proactively handle any stale/invalid refresh tokens stored in the browser (common after switching projects or keys)
if (typeof window !== 'undefined') {
  void supabase.auth.getSession().then(({ error }) => {
    if (error && /Invalid Refresh Token/i.test(error.message)) {
      // Clear only local session to recover from broken refresh token without calling server sign-out
      void supabase.auth.signOut({ scope: 'local' }).catch(() => {});
    }
  });
}