import React from 'react';
import { toBengaliDigits } from '../utils/numberUtils';

interface QRProps {
  activeCycle: any;
  IDBadge: React.FC<{ id: string }>;
}

const QR_1: React.FC<QRProps> = ({ activeCycle, IDBadge }) => {
  return (
    <div id="qr-1-container" className="max-w-7xl mx-auto p-6 bg-white rounded-3xl border border-slate-200 shadow-2xl relative animate-in fade-in duration-500">
      <IDBadge id="qr-1-container" />
      <div className="text-center mb-8">
        <h2 className="text-2xl font-black text-slate-800">মহাপরিচালকের কার্যালয়</h2>
        <h3 className="text-xl font-bold text-slate-700">বাণিজ্যিক অডিট অধিদপ্তর</h3>
        <div className="mt-4 inline-block px-6 py-2 bg-blue-600 text-white rounded-full font-black text-sm">
          ত্রৈমাসিক রিটার্ন - ১ | {toBengaliDigits(activeCycle.label)}
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-slate-300">
          <thead>
            <tr className="bg-slate-100">
              <th className="border border-slate-300 p-3 font-black text-slate-700">ক্রমিক</th>
              <th className="border border-slate-300 p-3 font-black text-slate-700">বিবরণ</th>
              <th className="border border-slate-300 p-3 font-black text-slate-700">তথ্য</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-slate-300 p-3 text-center">১</td>
              <td className="border border-slate-300 p-3">নমুনা তথ্য</td>
              <td className="border border-slate-300 p-3 text-center">০</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default QR_1;
