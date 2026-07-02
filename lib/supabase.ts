
import { createClient } from '@supabase/supabase-js';

/**
 * @security-protocol LOCKED_MODE
 * @zero-alteration-policy ACTIVE
 */

const getEnv = (key: string) => {
  try {
    const viteEnv = (import.meta as any).env;
    if (viteEnv && viteEnv[key]) return viteEnv[key];
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key];
    }
    return '';
  } catch {
    return '';
  }
};

let supabaseUrl = getEnv('VITE_SUPABASE_URL');
let supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

// Fallback to fetch credentials synchronously from server if not set in client bundle
if (typeof window !== 'undefined') {
  console.log("Initial Supabase URL (client bundle):", supabaseUrl ? "Present" : "Missing");
  console.log("Initial Supabase Anon Key (client bundle):", supabaseAnonKey ? "Present" : "Missing");
  
  if (!supabaseUrl || !supabaseAnonKey) {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', '/api/supabase-config', false); // synchronous call
      xhr.send();
      if (xhr.status === 200) {
        const config = JSON.parse(xhr.responseText);
        console.log("Server Supabase Url:", config.supabaseUrl ? "Present" : "Missing");
        console.log("Server Supabase Anon Key:", config.supabaseAnonKey ? "Present" : "Missing");
        if (config.supabaseUrl && config.supabaseAnonKey) {
          supabaseUrl = config.supabaseUrl;
          supabaseAnonKey = config.supabaseAnonKey;
          console.log("Supabase config dynamically fetched and loaded from server successfully!");
        }
      } else {
        console.warn("Failed to fetch Supabase config. Server returned status:", xhr.status);
      }
    } catch (e) {
      console.warn("Failed to fetch Supabase config synchronously:", e);
    }
  }
}

const isValidUrl = (url: string) => {
  try {
    return url && typeof url === 'string' && url.startsWith('http');
  } catch {
    return false;
  }
};

// Check if actual credentials exist
export const isSupabaseConfigured = isValidUrl(supabaseUrl) && !!supabaseAnonKey;
console.log("Is Supabase fully configured and active:", isSupabaseConfigured);

const createMockClient = () => {
  const mockAuth = {
    onAuthStateChange: (callback: any) => {
      // Return a dummy subscription object that matches Supabase's structure
      return { data: { subscription: { unsubscribe: () => {} } } };
    },
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: { message: 'Mock mode active' } }),
    signOut: () => Promise.resolve({ error: null }),
  };

  const chainable = () => new Proxy({}, handler);
  const handler: ProxyHandler<any> = {
    get(target, prop) {
      // Provide the mock auth object when requested
      if (prop === 'auth') {
        return mockAuth;
      }
      
      if (prop === 'then') {
        return (onfulfilled: any) => 
          Promise.resolve({ 
            data: null, 
            error: { 
              message: 'সুপাবেজ (Supabase) কনফিগারেশন পাওয়া যায়নি। দয়া করে VITE_SUPABASE_URL এবং VITE_SUPABASE_ANON_KEY সেট করুন।',
              code: 'CONFIG_MISSING'
            } 
          }).then(onfulfilled);
      }
      
      const chainableMethods = [
        'from', 'select', 'eq', 'neq', 'gt', 'lt', 'gte', 'lte', 'like', 'ilike', 
        'is', 'in', 'contains', 'containedBy', 'range', 'textSearch', 'match', 
        'not', 'or', 'filter', 'order', 'limit', 'single', 'maybeSingle', 
        'insert', 'update', 'upsert', 'delete', 'rpc', 'channel', 'on'
      ];
      
      if (chainableMethods.includes(prop as string)) {
        return chainable;
      }

      if (prop === 'subscribe') {
        return () => ({ unsubscribe: () => {} });
      }
      
      return target[prop];
    }
  };
  return new Proxy({}, handler);
};

export const signInWithGoogle = async () => {
  if (!isSupabaseConfigured) {
    alert('সুপাবেজ (Supabase) কনফিগারেশন পাওয়া যায়নি। দয়া করে VITE_SUPABASE_URL এবং VITE_SUPABASE_ANON_KEY সেট করুন।');
    return;
  }
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
    },
  });

  if (error) {
    console.error('গুগল লগইন ত্রুটি:', error.message);
    alert('গুগল লগইন ব্যর্থ হয়েছে: ' + error.message);
  }
  
  return { data, error };
};

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : createMockClient() as any;