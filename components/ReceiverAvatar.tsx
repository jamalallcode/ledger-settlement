import React from 'react';
import { motion } from 'framer-motion';
import { User } from 'lucide-react';
import { useReceivers } from '../src/contexts/ReceiverContext';

interface ReceiverAvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showName?: boolean;
  className?: string;
}

const ReceiverAvatar: React.FC<ReceiverAvatarProps> = ({ name, size = 'md', showName = false, className = '' }) => {
  const { profiles } = useReceivers();
  const profile = profiles[name.trim()];

  const sizeCls = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-12 h-12'
  }[size];

  const iconSize = {
    sm: 12,
    md: 14,
    lg: 18,
    xl: 22
  }[size];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <motion.div 
        whileHover={{ scale: 1.05 }}
        className={`${sizeCls} rounded-lg overflow-hidden border border-slate-200 shadow-sm shrink-0 relative group`}
      >
        {profile?.image ? (
          <img 
            src={profile.image} 
            alt={name} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
            <User size={iconSize} />
          </div>
        )}
        <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-lg pointer-events-none" />
      </motion.div>
      {showName && (
        <div className="flex flex-col min-w-0">
          <span className="text-[12px] font-bold text-slate-900 leading-tight truncate">
            {name}
          </span>
          {profile?.designation && (
            <span className="text-[9px] text-slate-500 font-medium truncate">
              {profile.designation}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default ReceiverAvatar;
