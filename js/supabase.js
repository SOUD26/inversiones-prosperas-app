import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

// `window.supabase` lo carga el <script> de index.html
export const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { flowType: 'pkce' }
});
