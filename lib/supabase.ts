
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

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

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
  const chainable = () => new Proxy({}, handler);
  const handler: ProxyHandler<any> = {
    get(target, prop) {
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
        'insert', 'update', 'upsert', 'delete', 'rpc'
      ];
      
      if (chainableMethods.includes(prop as string)) {
        return chainable;
      }
      return target[prop];
    }
  };
  return new Proxy({}, handler);
};

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : createMockClient() as any;
