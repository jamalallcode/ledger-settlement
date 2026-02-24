
import React from 'react';
import { OFFICE_HEADER } from '../constants.ts';

const Header: React.FC = () => {
  return (
    <div className="relative text-center py-10 mb-8 overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-transparent via-blue-600 to-transparent opacity-20"></div>
      
      <div className="space-y-1">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none uppercase">
          {OFFICE_HEADER.main}
        </h1>
        <div className="flex items-center justify-center gap-4 py-2">
          <div className="h-[1px] w-12 bg-slate-300"></div>
          <h2 className="text-2xl font-bold text-blue-700">
            {OFFICE_HEADER.sub}
          </h2>
          <div className="h-[1px] w-12 bg-slate-300"></div>
        </div>
        <p className="text-lg text-slate-500 font-semibold italic">
          {OFFICE_HEADER.address}
        </p>
      </div>

      <div className="mt-6 flex flex-col items-center gap-3">
        <div className="h-[2px] w-32 bg-green-600 rounded-full"></div>
        <div className="px-6 py-2 bg-slate-900 text-white rounded-lg font-black text-sm uppercase tracking-[0.2em] shadow-lg border border-slate-700">
          মীমাংসা রেজিস্টার • Settlement Register
        </div>
      </div>
      
      {/* Print-only border decoration */}
      <div className="hidden print:block absolute bottom-0 left-0 w-full h-0.5 bg-slate-200 mt-4"></div>
    </div>
  );
};

export default Header;