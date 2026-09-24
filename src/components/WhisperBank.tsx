import React, { useState } from 'react';
import { WhisperTemplate, HeatLevel } from '../types';
import { WHISPER_TEMPLATES } from '../data/intimacyContent';
import { Send, Copy, Check, Flame, Heart, Sparkles, Plus, Search, Filter } from 'lucide-react';
import { soundFx } from '../utils/soundEffects';

interface WhisperBankProps {
  onSendToChat: (text: string, heatLevel?: HeatLevel) => void;
}

export const WhisperBank: React.FC<WhisperBankProps> = ({ onSendToChat }) => {
  const [whispers, setWhispers] = useState<WhisperTemplate[]>(() => {
    const saved = localStorage.getItem('custom_whispers');
    if (saved) {
      try {
        return [...WHISPER_TEMPLATES, ...JSON.parse(saved)];
      } catch {
        return WHISPER_TEMPLATES;
      }
    }
    return WHISPER_TEMPLATES;
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedHeat, setSelectedHeat] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New whisper modal/form
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newText, setNewText] = useState('');
  const [newCategory, setNewCategory] = useState<'craving' | 'flirt' | 'bold' | 'compliment' | 'invitation'>('bold');
  const [newHeat, setNewHeat] = useState<HeatLevel>('hot');

  const categories = [
    { id: 'all', label: 'الكل' },
    { id: 'craving', label: 'شوق ورغبة' },
    { id: 'bold', label: 'جرأة وشغف' },
    { id: 'flirt', label: 'دلع وغنج' },
    { id: 'compliment', label: 'غزل ومفاتن' },
    { id: 'invitation', label: 'دعوة لسهرة' },
  ];

  const filteredWhispers = whispers.filter(w => {
    const matchesCategory = selectedCategory === 'all' || w.category === selectedCategory;
    const matchesHeat = selectedHeat === 'all' || w.heatLevel === selectedHeat;
    const matchesSearch = w.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          w.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesHeat && matchesSearch;
  });

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    soundFx.playMessageSent();
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleSend = (text: string, heat: HeatLevel) => {
    soundFx.playWhisperChime();
    onSendToChat(text, heat);
  };

  const handleAddWhisper = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;
    const newW: WhisperTemplate = {
      id: 'custom_' + Date.now(),
      category: newCategory,
      categoryLabel: categories.find(c => c.id === newCategory)?.label || 'خاص',
      title: newTitle.trim() || 'همسة خاصة',
      text: newText.trim(),
      heatLevel: newHeat
    };

    const updated = [newW, ...whispers];
    setWhispers(updated);
    const customOnly = updated.filter(w => w.id.startsWith('custom_'));
    localStorage.setItem('custom_whispers', JSON.stringify(customOnly));

    setNewTitle('');
    setNewText('');
    setShowAddModal(false);
    soundFx.playMessageSent();
  };

  const heatBadge = (level: HeatLevel) => {
    if (level === 'daring') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-red-950/80 text-red-300 border border-red-700/60 font-semibold">
          <Flame className="w-3 h-3 text-red-400 fill-red-400" /> جريء جداً
        </span>
      );
    }
    if (level === 'hot') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-700/60 font-semibold">
          <Flame className="w-3 h-3 text-amber-400" /> ساخن ومثير
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-rose-950/80 text-rose-300 border border-rose-700/60 font-semibold">
        <Heart className="w-3 h-3 text-rose-400" /> رومانسي دافئ
      </span>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-4 space-y-4">
      {/* Intro Banner */}
      <div className="bg-gradient-to-r from-rose-950/90 via-pink-950/60 to-purple-950/80 border border-rose-800/40 rounded-3xl p-4 sm:p-5 relative overflow-hidden shadow-xl">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-amber-300" />
              <h2 className="text-lg font-bold text-rose-100">بنك الرسائل والمشاعر اللطيفة</h2>
            </div>
            <p className="text-xs text-rose-200/80 leading-relaxed max-w-xl">
              رسائل وعبارات جاهزة ومختارة بعناية للمودة والفضفضة والضحك بين الأصدقاء.. اضغط على أي عبارة لإرسالها مباشرة لصديقتك في الدردشة أو نسخها.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="self-stretch sm:self-auto px-4 py-2.5 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-bold shadow-lg shadow-rose-950/50 flex items-center justify-center gap-1.5 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>كتابة همسة خاصة</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-2.5 bg-[#170514]/70 border border-rose-950 rounded-2xl p-3">
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute right-3 top-3 text-rose-400/60" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث في الهمسات والكلمات المثيرة..."
              className="w-full bg-[#22071c] border border-rose-900/50 rounded-xl py-2 pr-9 pl-3 text-xs text-rose-100 placeholder-rose-400/40 focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Heat selector */}
          <div className="flex items-center gap-1 bg-[#22071c] p-1 rounded-xl border border-rose-900/50 overflow-x-auto">
            <span className="text-[11px] text-rose-400/80 px-2 flex items-center gap-1">
              <Filter className="w-3 h-3" /> درجة الحرارة:
            </span>
            {[
              { id: 'all', label: 'الكل' },
              { id: 'romantic', label: 'رومانسي' },
              { id: 'hot', label: 'ساخن' },
              { id: 'daring', label: 'جريء' },
            ].map(h => (
              <button
                key={h.id}
                onClick={() => setSelectedHeat(h.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                  selectedHeat === h.id
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-rose-300/70 hover:text-rose-100 hover:bg-rose-900/30'
                }`}
              >
                {h.label}
              </button>
            ))}
          </div>
        </div>

        {/* Categories Chips */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pt-1">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat.id
                  ? 'bg-rose-700/80 text-white border border-rose-500/50 shadow-sm'
                  : 'bg-rose-950/30 text-rose-300/70 hover:bg-rose-950/60 border border-rose-950'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Whispers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredWhispers.map((w) => (
          <div
            key={w.id}
            className="group bg-gradient-to-b from-[#1c0718] to-[#160413] border border-rose-900/40 hover:border-rose-600/50 rounded-2xl p-4 transition-all duration-200 hover:shadow-xl hover:shadow-rose-950/50 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-rose-200 group-hover:text-pink-300 transition">
                  {w.title}
                </span>
                {heatBadge(w.heatLevel)}
              </div>
              <p className="text-xs sm:text-sm text-rose-100/90 leading-relaxed my-2 font-medium">
                "{w.text}"
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 mt-2 border-t border-rose-950/60">
              <span className="text-[10px] text-rose-400/50">
                {w.categoryLabel}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleCopy(w.id, w.text)}
                  className="px-2.5 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 text-xs flex items-center gap-1 transition border border-rose-900/40"
                  title="نسخ العبارة"
                >
                  {copiedId === w.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-300 text-[11px]">تم النسخ</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span className="text-[11px]">نسخ</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleSend(w.text, w.heatLevel)}
                  className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-bold flex items-center gap-1 shadow-md shadow-rose-950/40 active:scale-95 transition"
                  title="إرسال مباشرة في المحادثة"
                >
                  <Send className="w-3.5 h-3.5 rotate-180" />
                  <span>إرسال للدردشة</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredWhispers.length === 0 && (
        <div className="text-center py-12 text-rose-400/60 text-xs">
          لا توجد همسات تطابق معايير البحث الحالية.
        </div>
      )}

      {/* Add Custom Whisper Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-[#22071c] border border-rose-800/60 rounded-3xl p-5 shadow-2xl text-rose-100">
            <h3 className="text-base font-bold mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>إضافة همسة رومانسية خاصة بكما</span>
            </h3>

            <form onSubmit={handleAddWhisper} className="space-y-3">
              <div>
                <label className="block text-xs text-rose-300 mb-1">عنوان الهمسة أو المناسبة</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="مثال: ليلة الخميس، فستانك الأحمر..."
                  className="w-full bg-[#160413] border border-rose-900/60 rounded-xl p-2.5 text-xs text-rose-100 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs text-rose-300 mb-1">نص الرسالة أو الفكرة</label>
                <textarea
                  rows={3}
                  required
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  placeholder="اكتب ما يدور في خاطرك وتريد مشاركته مع صاحبتك..."
                  className="w-full bg-[#160413] border border-rose-900/60 rounded-xl p-2.5 text-xs text-rose-100 focus:outline-none focus:border-rose-500 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-rose-300 mb-1">القسم</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full bg-[#160413] border border-rose-900/60 rounded-xl p-2 text-xs text-rose-100 focus:outline-none focus:border-rose-500"
                  >
                    <option value="craving">شوق ورغبة</option>
                    <option value="bold">جرأة وشغف</option>
                    <option value="flirt">دلع وغنج</option>
                    <option value="compliment">غزل ومفاتن</option>
                    <option value="invitation">دعوة لسهرة</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-rose-300 mb-1">مستوى الجرأة</label>
                  <select
                    value={newHeat}
                    onChange={(e) => setNewHeat(e.target.value as any)}
                    className="w-full bg-[#160413] border border-rose-900/60 rounded-xl p-2 text-xs text-rose-100 focus:outline-none focus:border-rose-500"
                  >
                    <option value="romantic">رومانسي دافئ</option>
                    <option value="hot">ساخن ومثير</option>
                    <option value="daring">جريء جداً</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-rose-300 hover:bg-rose-900/30"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 text-white text-xs font-bold hover:from-rose-500 hover:to-pink-500 shadow-md"
                >
                  حفظ في البنك
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
