import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please connect to Supabase using the "Connect to Supabase" button.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // Enable session persistence
    storageKey: 'chatlinks-auth', // Custom storage key
    storage: localStorage, // Use localStorage for persistence
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'x-application-name': 'chatlinks',
    },
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Test the connection and handle errors gracefully
const testSupabaseConnection = async () => {
  try {
    const { error } = await supabase.from('chats').select('count', { count: 'exact', head: true });
    if (error) {
      console.error('Supabase connection error:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Failed to connect to Supabase:', error);
    return false;
  }
};

// Initialize connection test
testSupabaseConnection();