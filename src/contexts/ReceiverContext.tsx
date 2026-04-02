import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

export interface ReceiverProfile {
  id?: string;
  name: string;
  designation?: string;
  image?: string;
  para_type?: string;
  source?: 'database' | 'local' | 'correspondence' | 'unassigned';
}

interface ReceiverContextType {
  profiles: Record<string, ReceiverProfile>;
  loading: boolean;
  refresh: () => void;
}

const ReceiverContext = createContext<ReceiverContextType | undefined>(undefined);

export const ReceiverProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profiles, setProfiles] = useState<Record<string, ReceiverProfile>>({});
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  const fetchAll = async () => {
    setLoading(true);
    const profileMap: Record<string, ReceiverProfile> = {};

    // 1. Fetch from Supabase if configured
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('receivers')
          .select('*');
        
        if (!error && data) {
          data.forEach(r => {
            const norm = r.name.trim();
            profileMap[norm] = { ...r, source: 'database' };
          });
        }
      } catch (err) {
        console.error('Error fetching profiles from Supabase:', err);
      }
    }

    // 2. Fetch from LocalStorage (both SFI and Non-SFI)
    const keys = ['ledger_correspondence_receivers_sfi', 'ledger_correspondence_receivers_nonsfi'];
    keys.forEach(key => {
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          const items = JSON.parse(saved);
          items.forEach((li: any) => {
            const name = typeof li === 'string' ? li : li.name;
            if (name) {
              const norm = name.trim();
              if (!profileMap[norm]) {
                profileMap[norm] = {
                  name: norm,
                  designation: li.designation || 'অডিটর',
                  image: li.image || null,
                  source: 'local'
                };
              } else if (li.image && !profileMap[norm].image) {
                profileMap[norm].image = li.image;
              }
            }
          });
        } catch (e) {
          console.error('Error parsing local profiles:', e);
        }
      }
    });

    setProfiles(profileMap);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();

    const handleStorage = () => setTick(t => t + 1);
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [tick]);

  const value = useMemo(() => ({
    profiles,
    loading,
    refresh: () => setTick(t => t + 1)
  }), [profiles, loading]);

  return (
    <ReceiverContext.Provider value={value}>
      {children}
    </ReceiverContext.Provider>
  );
};

export const useReceivers = () => {
  const context = useContext(ReceiverContext);
  if (context === undefined) {
    throw new Error('useReceivers must be used within a ReceiverProvider');
  }
  return context;
};
