import React, { useState } from 'react';
import { INTIMACY_CARDS } from '../data/intimacyContent';
import { IntimacyCard, HeatLevel } from '../types';
import { Sparkles, Flame, Heart, Send, RotateCw, HelpCircle, Shield, Lightbulb } from 'lucide-react';
import { soundFx } from '../utils/soundEffects';

interface IntimacyCardsProps {
  onSendToChat: (text: string, heatLevel?: HeatLevel) => void;
}

export const IntimacyCards: React.FC<IntimacyCardsProps> = ({ onSendToChat }) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'truth' | 'dare' | 'fantasy'>('all');
  const [activeHeat, setActiveHeat] = useState<string>('all');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);

  const filteredCards = INTIMACY_CARDS.filter(c => {
    const catMatch = activeCategory === 'all' || c.category === activeCategory;
    const heatMatch = activeHeat === 'all' || c.heatLevel === activeHeat;
    return catMatch && heatMatch;
  });

  const currentCard: IntimacyCard | undefined = filteredCards[currentIndex % (filteredCards.length || 1)];

  const handleNextCard = () => {
    soundFx.playDiceRoll();
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex(prev => (prev + 1) % filteredCards.length);
    }, 150);
  };

  const handleSendToChat = () => {
    if (!currentCard) return;
    const prefix = currentCard.category === 'truth' ? '❓ سؤال صراحة وفضفضة:' : currentCard.category === 'dare' ? '🎯 تحدي ومرح بين الأصدقاء:' : '✨ سيناريو وخيال:';
    const text = `${prefix} ${currentCard.title}\n"${currentCard.content}"`;
    soundFx.playWhisperChime();
    onSendToChat(text, currentCard.heatLevel);
  };

  const getCategoryTitle = (cat: string) => {
    switch (cat) {
      case 'truth': return 'صراحة وفضفضة';
      case 'dare': return 'تحدي ومرح خاص';
      case 'fantasy': return 'سيناريو وتخيل ممتع';
      default: return 'سؤال المشاعر';
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-3 sm:p-4 space-y-4">
      {/* Header */}
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/70 border border-rose-800/40 text-rose-300 text-xs font-semibold mb-1">
          <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
          <span>لعبة الصراحة والمرح بين الأصدقاء</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-rose-100">
          بطاقات الصراحة والفضفضة
        </h2>
        <p className="text-xs text-rose-300/70 max-w-md mx-auto leading-relaxed">
          اسحب بطاقة بالتناوب مع صاحبتك، أجب بصراحة تامة أو شارك برأيك لتكتشفا مواقف مضحكة وممتعة تعزز الصداقة والجدعنة.
        </p>
      </div>

      {/* Category selector */}
      <div className="flex justify-center gap-1.5 bg-[#170514] p-1.5 rounded-2xl border border-rose-950 max-w-md mx-auto overflow-x-auto">
        {[
          { id: 'all', label: 'الكل' },
          { id: 'truth', label: '❓ صراحة' },
          { id: 'dare', label: '🔥 تحدي' },
          { id: 'fantasy', label: '✨ سيناريو' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveCategory(tab.id as any);
              setCurrentIndex(0);
            }}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeCategory === tab.id
                ? 'bg-rose-600 text-white shadow-md shadow-rose-950'
                : 'text-rose-300/70 hover:text-white hover:bg-rose-950/40'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Heat selector */}
      <div className="flex justify-center items-center gap-1.5 text-xs text-rose-300/80">
        <span>مستوى الجرأة:</span>
        {[
          { id: 'all', label: 'الكل' },
          { id: 'romantic', label: 'رومانسي' },
          { id: 'hot', label: 'ساخن' },
          { id: 'daring', label: 'جريء جداً' },
        ].map(h => (
          <button
            key={h.id}
            onClick={() => {
              setActiveHeat(h.id);
              setCurrentIndex(0);
            }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
              activeHeat === h.id
                ? 'bg-rose-950 border border-rose-500 text-rose-100'
                : 'bg-rose-950/30 text-rose-400/60 hover:text-rose-200'
            }`}
          >
            {h.label}
          </button>
        ))}
      </div>

      {/* The Active Card Presentation */}
      {currentCard ? (
        <div className="perspective-1000 my-4">
          <div
            className={`w-full min-h-[300px] sm:min-h-[340px] rounded-3xl p-6 sm:p-8 flex flex-col justify-between border-2 transition-all duration-300 relative shadow-2xl ${
              currentCard.heatLevel === 'daring'
                ? 'bg-gradient-to-b from-[#26051c] to-[#14020f] border-red-700/60 shadow-red-950/50'
                : currentCard.heatLevel === 'hot'
                ? 'bg-gradient-to-b from-[#2a0720] to-[#14030f] border-amber-600/50 shadow-amber-950/40'
                : 'bg-gradient-to-b from-[#200718] to-[#12030f] border-rose-700/50 shadow-rose-950/40'
            }`}
          >
            {/* Card Top */}
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-950/80 text-rose-200 text-xs font-bold border border-rose-800/40">
                {currentCard.category === 'truth' ? <HelpCircle className="w-3.5 h-3.5 text-cyan-400" /> : <Flame className="w-3.5 h-3.5 text-amber-400" />}
                <span>{getCategoryTitle(currentCard.category)}</span>
              </span>

              <span className="text-xs text-rose-400/70 font-mono">
                بطاقة #{currentIndex + 1} من {filteredCards.length}
              </span>
            </div>

            {/* Card Middle / Content */}
            <div className="my-6 text-center space-y-3">
              <h3 className="text-base sm:text-lg font-black text-rose-200 tracking-wide">
                {currentCard.title}
              </h3>
              <p className="text-lg sm:text-2xl font-bold text-white leading-relaxed font-sans px-2">
                "{currentCard.content}"
              </p>

              {currentCard.tip && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/40 text-rose-300 text-xs max-w-md mx-auto border border-rose-900/30 mt-2">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  <span>همسة: {currentCard.tip}</span>
                </div>
              )}
            </div>

            {/* Card Footer Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-4 border-t border-rose-950/80">
              <button
                onClick={handleNextCard}
                className="w-full sm:flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-rose-950/60 active:scale-95 transition"
              >
                <RotateCw className="w-4 h-4" />
                <span>سحب بطاقة أخرى</span>
              </button>

              <button
                onClick={handleSendToChat}
                className="w-full sm:w-auto py-3 px-5 rounded-2xl bg-rose-950/70 hover:bg-rose-900/80 text-rose-200 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border border-rose-700/50 active:scale-95 transition"
                title="إرسال هذا السؤال/التحدي مباشرة إلى صديقتك في الشات"
              >
                <Send className="w-4 h-4 rotate-180" />
                <span>إرسال للشات</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-rose-400/60 text-xs">
          لا توجد بطاقات في هذا التصنيف.
        </div>
      )}

      {/* Rules / Friends Advice */}
      <div className="bg-[#180514]/60 border border-rose-950 rounded-2xl p-3.5 text-xs text-rose-300/70 flex items-start gap-2.5">
        <Shield className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          قواعد اللعبة: الرفض ممنوع إلا لطلب بديل، والهدف إشاعة المرح والضحك والفضفضة الصادقة لتعزيز الصداقة والجدعنة والألفة بين الأصحاب.
        </p>
      </div>
    </div>
  );
};
