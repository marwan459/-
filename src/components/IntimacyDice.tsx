import React, { useState } from 'react';
import { DICE_CONFIG } from '../data/intimacyContent';
import { Dices, Sparkles, Send, Flame, Clock } from 'lucide-react';
import { soundFx } from '../utils/soundEffects';

interface IntimacyDiceProps {
  onSendToChat: (text: string) => void;
}

export const IntimacyDice: React.FC<IntimacyDiceProps> = ({ onSendToChat }) => {
  const [action, setAction] = useState<string>('قبلة عميقة على');
  const [part, setPart] = useState<string>('العنق والرقبة');
  const [style, setStyle] = useState<string>('بشغف وجرأة لا تهدأ');
  const [isRolling, setIsRolling] = useState<boolean>(false);

  const rollDice = () => {
    if (isRolling) return;
    setIsRolling(true);
    soundFx.playDiceRoll();

    let counter = 0;
    const interval = setInterval(() => {
      setAction(DICE_CONFIG.actions[Math.floor(Math.random() * DICE_CONFIG.actions.length)]);
      setPart(DICE_CONFIG.parts[Math.floor(Math.random() * DICE_CONFIG.parts.length)]);
      setStyle(DICE_CONFIG.styles[Math.floor(Math.random() * DICE_CONFIG.styles.length)]);
      counter++;
      if (counter > 8) {
        clearInterval(interval);
        setIsRolling(false);
        soundFx.playWhisperChime();
      }
    }, 90);
  };

  const handleSendToChat = () => {
    const text = `🎲 نتيجة نرد التحديات والمرح الليلة:\n[ ${action} ] على [ ${part} ] - [ ${style} ] ✨`;
    onSendToChat(text);
  };

  return (
    <div className="max-w-xl mx-auto p-3 sm:p-4 space-y-4">
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/70 border border-rose-800/40 text-rose-300 text-xs font-semibold mb-1">
          <Dices className="w-3.5 h-3.5 text-rose-400" />
          <span>نرد المرح والتحديات</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-rose-100">
          دحرج النرد واكتشف تحدي الليلة
        </h2>
        <p className="text-xs text-rose-300/70 max-w-sm mx-auto leading-relaxed">
          دع النرد يحدد لكما نشاط ومرح الليلة بالأسلوب والتحدي بين الأصدقاء.
        </p>
      </div>

      {/* 3 Dice Blocks Container */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-5">
        {/* Die 1: Action */}
        <div
          className={`bg-gradient-to-b from-[#2a0921] to-[#150412] border-2 rounded-2xl p-4 text-center shadow-lg transition-all duration-300 flex flex-col justify-between min-h-[130px] ${
            isRolling ? 'scale-95 border-rose-400 animate-pulse' : 'border-rose-800/50 hover:border-rose-500/70'
          }`}
        >
          <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider">
            الحركة / المداعبة
          </span>
          <div className="text-base sm:text-lg font-black text-rose-100 my-auto py-2">
            {action}
          </div>
          <span className="text-[10px] text-rose-400/60 flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3 text-yellow-400" /> خطوة البداية
          </span>
        </div>

        {/* Die 2: Target Part */}
        <div
          className={`bg-gradient-to-b from-[#2a0921] to-[#150412] border-2 rounded-2xl p-4 text-center shadow-lg transition-all duration-300 flex flex-col justify-between min-h-[130px] ${
            isRolling ? 'scale-95 border-pink-400 animate-pulse' : 'border-pink-800/50 hover:border-pink-500/70'
          }`}
        >
          <span className="text-[10px] uppercase font-bold text-pink-400 tracking-wider">
            المكان والجسد
          </span>
          <div className="text-base sm:text-lg font-black text-pink-100 my-auto py-2">
            {part}
          </div>
          <span className="text-[10px] text-pink-400/60 flex items-center justify-center gap-1">
            <Flame className="w-3 h-3 text-red-400" /> نقطة الإثارة
          </span>
        </div>

        {/* Die 3: Style & Manner */}
        <div
          className={`bg-gradient-to-b from-[#2a0921] to-[#150412] border-2 rounded-2xl p-4 text-center shadow-lg transition-all duration-300 flex flex-col justify-between min-h-[130px] ${
            isRolling ? 'scale-95 border-amber-400 animate-pulse' : 'border-amber-800/50 hover:border-amber-500/70'
          }`}
        >
          <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
            الأسلوب والطريقة
          </span>
          <div className="text-base sm:text-lg font-black text-amber-100 my-auto py-2">
            {style}
          </div>
          <span className="text-[10px] text-amber-400/60 flex items-center justify-center gap-1">
            <Clock className="w-3 h-3 text-amber-300" /> الإحساس والمدة
          </span>
        </div>
      </div>

      {/* Combined Result Box */}
      <div className="bg-gradient-to-r from-rose-950/70 via-pink-950/50 to-purple-950/70 border border-rose-800/60 rounded-2xl p-4 text-center space-y-2 shadow-xl">
        <div className="text-xs text-rose-300 font-semibold">المهمة الناتجة للتنفيذ الآن:</div>
        <p className="text-base sm:text-lg font-bold text-white px-2">
          "{action} {part} {style}"
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
        <button
          onClick={rollDice}
          disabled={isRolling}
          className="flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700 hover:from-rose-500 hover:to-pink-500 text-white font-black text-sm shadow-xl shadow-rose-950/60 flex items-center justify-center gap-2 active:scale-95 transition disabled:opacity-50"
        >
          <Dices className={`w-5 h-5 ${isRolling ? 'animate-spin' : ''}`} />
          <span>{isRolling ? 'جاري دحرجة النرد...' : 'رمي النرد الآن 🎲'}</span>
        </button>

        <button
          onClick={handleSendToChat}
          className="py-3.5 px-5 rounded-2xl bg-rose-950/60 hover:bg-rose-900 text-rose-200 font-bold text-sm border border-rose-700/50 flex items-center justify-center gap-2 active:scale-95 transition"
          title="إرسال المهمة للدردشة"
        >
          <Send className="w-4 h-4 rotate-180" />
          <span>إرسال للشات</span>
        </button>
      </div>
    </div>
  );
};
