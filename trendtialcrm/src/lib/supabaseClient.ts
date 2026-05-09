// Re-export the singleton Supabase client.
// DO NOT call createClient() here — a second instance creates a competing
// auth state machine that fights over the same localStorage token and floods
// the console with duplicate grant_type=refresh_token requests.
export { supabase } from '../api/supabaseClient';