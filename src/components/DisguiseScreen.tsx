import React, { useState } from 'react';
import { ShoppingBag, CheckSquare, Plus, ArrowLeft, Lock } from 'lucide-react';

interface DisguiseScreenProps {
  onUnlock: () => void;
}

export const DisguiseScreen: React.FC<DisguiseScreenProps> = ({ onUnlock }) => {
  const [items, setItems] = useState([
    { id: 1, text: 'شراء خضار وفاكهة الأسبوع', done: true },
    { id: 2, text: 'سداد فاتورة الكهرباء والإنترنت', done: false },
    { id: 3, text: 'حجز موعد صيانة السيارة', done: false },
    { id: 4, text: 'شراء حليب وخبز وجبن', done: true },
    { id: 5, text: 'الاتصال بالصيدلية لطلب الفيتامينات', done: false }
  ]);
  const [inputVal, setInputVal] = useState('');

  const toggleItem = (id: number) => {
    setItems(items.map(it => it.id === id ? { ...it, done: !it.done } : it));
  };

  const addItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    setItems([...items, { id: Date.now(), text: inputVal.trim(), done: false }]);
    setInputVal('');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 max-w-lg mx-auto font-sans select-none">
      {/* Discreet header with hidden unlock button */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-800">قائمة المهام والتسوق</h1>
            <p className="text-xs text-slate-500">الملاحظات الشخصية اليومية</p>
          </div>
        </div>

        {/* Discreet button disguised as settings/info */}
        <button
          onClick={onUnlock}
          id="btn-disguise-unlock"
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 px-2.5 py-1.5 rounded-md transition-colors border border-slate-200"
          title="العودة"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>إلغاء التمويه</span>
        </button>
      </div>

      <form onSubmit={addItem} className="flex gap-2 mb-4">
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="إضافة بند جديد..."
          className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 text-slate-800 placeholder-slate-400"
        />
        <button
          type="submit"
          className="bg-emerald-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة</span>
        </button>
      </form>

      <div className="space-y-2">
        {items.map(item => (
          <div
            key={item.id}
            onClick={() => toggleItem(item.id)}
            className={`flex items-center gap-3 p-3 rounded-lg border transition cursor-pointer ${
              item.done ? 'bg-slate-100 border-slate-200 text-slate-400' : 'bg-white border-slate-200 text-slate-700 shadow-xs'
            }`}
          >
            <input
              type="checkbox"
              checked={item.done}
              onChange={() => {}}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
            <span className={`text-sm ${item.done ? 'line-through' : ''}`}>
              {item.text}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-8 pt-4 border-t border-slate-200 text-center">
        <button
          onClick={onUnlock}
          className="text-xs text-slate-400 hover:text-slate-600 underline flex items-center justify-center gap-1 mx-auto"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>الرجوع للمساحة الخاصة</span>
        </button>
      </div>
    </div>
  );
};
