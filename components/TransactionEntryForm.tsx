import React, { useState } from 'react';
import { Save, XCircle } from 'lucide-react';

interface TransactionEntryFormProps {
  onSubmit?: (data: any) => void;
  onCancel?: () => void;
}

const TransactionEntryForm: React.FC<TransactionEntryFormProps> = ({ onSubmit, onCancel }) => {
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [debit, setDebit] = useState('');
  const [credit, setCredit] = useState('');
  const [category, setCategory] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const categories = [
    'আয় (Income)',
    'ব্যয় (Expense)',
    'সম্পদ (Asset)',
    'দায় (Liability)',
    'ইকুইটি (Equity)'
  ];

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!date) newErrors.date = 'তারিখ আবশ্যক';
    if (!description.trim()) newErrors.description = 'বিবরণ আবশ্যক';
    if (!debit && !credit) newErrors.amount = 'ডেবিট বা ক্রেডিট পরিমাণ আবশ্যক';
    if (!category) newErrors.category = 'ক্যাটাগরি আবশ্যক';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      const formData = {
        date,
        description,
        debit: debit ? parseFloat(debit) : 0,
        credit: credit ? parseFloat(credit) : 0,
        category
      };
      if (onSubmit) {
        onSubmit(formData);
      }
      // Reset form if needed
      setDate('');
      setDescription('');
      setDebit('');
      setCredit('');
      setCategory('');
      setErrors({});
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h2 className="text-xl font-semibold text-gray-800">নতুন লেনদেন এন্ট্রি</h2>
        {onCancel && (
          <button onClick={onCancel} className="text-gray-500 hover:text-red-500 transition-colors">
            <XCircle className="w-6 h-6" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">তারিখ <span className="text-red-500">*</span></label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={`w-full p-2.5 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${(!date || errors.date) ? 'border-red-500' : 'border-emerald-500'}`}
            />
            {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ক্যাটাগরি <span className="text-red-500">*</span></label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={`w-full p-2.5 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white ${(!category || errors.category) ? 'border-red-500' : 'border-emerald-500'}`}
            >
              <option value="">ক্যাটাগরি নির্বাচন করুন</option>
              {categories.map((cat, idx) => (
                <option key={idx} value={cat}>{cat}</option>
              ))}
            </select>
            {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">বিবরণ <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="লেনদেনের বিবরণ লিখুন"
            className={`w-full p-2.5 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${(!description.trim() || errors.description) ? 'border-red-500' : 'border-emerald-500'}`}
          />
          {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Debit Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ডেবিট পরিমাণ (৳)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={debit}
              onChange={(e) => setDebit(e.target.value)}
              placeholder="0.00"
              className={`w-full p-2.5 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${(!debit && !credit) ? 'border-red-500' : 'border-emerald-500'}`}
            />
          </div>

          {/* Credit Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ক্রেডিট পরিমাণ (৳)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={credit}
              onChange={(e) => setCredit(e.target.value)}
              placeholder="0.00"
              className={`w-full p-2.5 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${(!debit && !credit) ? 'border-red-500' : 'border-emerald-500'}`}
            />
          </div>
        </div>
        {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}

        <div className="flex justify-end pt-4 border-t mt-6">
          <button
            type="submit"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
          >
            <Save className="w-5 h-5" />
            সংরক্ষণ করুন
          </button>
        </div>
      </form>
    </div>
  );
};

export default TransactionEntryForm;
