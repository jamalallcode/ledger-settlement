
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

const rawSupabaseUrl = getEnv('VITE_SUPABASE_URL') || 'https://kewnchhbpppbcymfswjn.supabase.co';
const rawSupabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtld25jaGhicHBwYmN5bWZzd2puIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMDUzMTUsImV4cCI6MjA4NTc4MTMxNX0.QGRCXrNXfksBuEYaONGt_r-67jIlveLvPeeeqHY68rA';

// Sanitize URL by removing /rest/v1 or trailing slashes
const sanitizeUrl = (url: string) => {
  if (!url) return '';
  return url.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
};

const supabaseUrl = sanitizeUrl(rawSupabaseUrl);
const supabaseAnonKey = rawSupabaseAnonKey.trim();

const isValidUrl = (url: string) => {
  try {
    return url && typeof url === 'string' && url.startsWith('http');
  } catch {
    return false;
  }
};

// Check if actual credentials exist
export const isSupabaseConfigured = isValidUrl(supabaseUrl) && !!supabaseAnonKey;

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
  
  try {
    // Current host URL where the user is browsing
    const redirectUrl = window.location.origin + window.location.pathname;
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      },
    });

    if (error) {
      console.error('গুগল লগইন ত্রুটি:', error.message);
      if (error.message.includes('provider is not enabled') || error.message.includes('Unsupported provider')) {
        alert('সুপাবেজ (Supabase) ড্যাশবোর্ডে Google Provider টি Enable করা নেই। দয়া করে Supabase Dashboard > Authentication > Providers > Google টি Enable করুন।');
      } else {
        alert('গুগল লগইন ব্যর্থ হয়েছে: ' + error.message);
      }
    }
    
    return { data, error };
  } catch (err: any) {
    console.error('Google Sign-in exception:', err);
    alert('গুগল সাইন-ইন সম্পন্ন করা সম্ভব হয়নি। সুপাবেজ ড্যাশবোর্ডে Google Provider টি Enable করা আছে কিনা তা চেক করুন।');
  }
};

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : createMockClient() as any;