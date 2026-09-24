import React, { useState } from 'react';
import {
  Heart,
  EyeOff,
  Lock,
  Volume2,
  VolumeX,
  Trash2,
  Sparkles,
  MessageCircleHeart,
  Flame,
  Dices,
  KeyRound
} from 'lucide-react';
import { soundFx } from '../utils/soundEffects';

interface NavbarProps {
  activeTab: 'chat' | 'whispers' | 'cards' | 'dice';
  setActiveTab: (tab: 'chat' | 'whispers' | 'cards' | 'dice') => void;
  onDisguise: () => void;
  onLock: () => void;
  onClearChat: () => void;
  isPinSet: boolean;
  onOpenPinSetup: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onDisguise,
  onLock,
  onClearChat,
  isPinSet,
  onOpenPinSetup
}) => {
  const [ambientSound, setAmbientSound] = useState<'off' | 'heartbeat' | 'soft_melodic'>('off');
  const [showSoundMenu, setShowSoundMenu] = useState(false);

  const handleSoundChange = (mode: 'off' | 'heartbeat' | 'soft_melodic') => {
    setAmbientSound(mode);
    soundFx.setAmbientMode(mode);
    setShowSoundMenu(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#190615]/90 backdrop-blur-md border-b border-rose-950/80 px-3 py-2.5">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
        {/* Brand / Title */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-700 to-pink-600 flex items-center justify-center shadow-lg shadow-rose-950/80 border border-rose-400/30">
            <Heart className="w-5 h-5 text-white fill-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-black text-rose-100 tracking-tight">همس القلوب</h1>
              <span className="bg-gradient-to-r from-rose-900 to-pink-900 border border-rose-700/40 text-[10px] text-pink-200 px-1.5 py-0.5 rounded-full font-bold">
                مساحة الأصحاب
              </span>
            </div>
            <p className="text-[11px] text-rose-300/70 hidden sm:block">
              أحاديث وفضفضة خاصة • بين أعز الأصدقاء
            </p>
          </div>
        </div>

        {/* Quick Safety & Ambiance Controls */}
        <div className="flex items-center gap-1.5">
          {/* Ambient Sound Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSoundMenu(!showSoundMenu)}
              className={`p-2 rounded-xl transition border text-xs flex items-center gap-1 ${
                ambientSound !== 'off'
                  ? 'bg-rose-900/60 text-pink-200 border-rose-600/60 shadow-sm shadow-rose-900/40'
                  : 'bg-rose-950/40 hover:bg-rose-950 text-rose-300 border-rose-900/40'
              }`}
              title="المؤثرات والأجواء الصوتية الرومانسية"
            >
              {ambientSound !== 'off' ? (
                <Volume2 className="w-4 h-4 text-pink-400 animate-bounce" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
              <span className="hidden md:inline text-[11px]">
                {ambientSound === 'heartbeat' ? 'نبضات حب' : ambientSound === 'soft_melodic' ? 'ألحان دافئة' : 'الأجواء'}
              </span>
            </button>

            {showSoundMenu && (
              <div className="absolute left-0 mt-2 w-44 bg-[#23091e] border border-rose-800/60 rounded-2xl p-1.5 shadow-2xl z-50 text-xs text-rose-100">
                <div className="text-[10px] text-rose-400/80 px-2 py-1 font-semibold border-b border-rose-950 mb-1">
                  أجواء صوتية مهدئة
                </div>
                <button
                  onClick={() => handleSoundChange('off')}
                  className={`w-full text-right px-2.5 py-1.5 rounded-lg flex items-center justify-between ${
                    ambientSound === 'off' ? 'bg-rose-900/50 text-white' : 'hover:bg-rose-950/40'
                  }`}
                >
                  <span>كتم الصوت</span>
                  <VolumeX className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleSoundChange('heartbeat')}
                  className={`w-full text-right px-2.5 py-1.5 rounded-lg flex items-center justify-between ${
                    ambientSound === 'heartbeat' ? 'bg-rose-900/50 text-white' : 'hover:bg-rose-950/40'
                  }`}
                >
                  <span>نبضات القلب الهادئة ❤️</span>
                  <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                </button>
                <button
                  onClick={() => handleSoundChange('soft_melodic')}
                  className={`w-full text-right px-2.5 py-1.5 rounded-lg flex items-center justify-between ${
                    ambientSound === 'soft_melodic' ? 'bg-rose-900/50 text-white' : 'hover:bg-rose-950/40'
                  }`}
                >
                  <span>عزف رومانسي دافئ ✨</span>
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                </button>
              </div>
            )}
          </div>

          {/* Instant Disguise / Camouflage button */}
          <button
            onClick={onDisguise}
            id="btn-quick-disguise"
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700/50 transition flex items-center gap-1"
            title="تمويه فوري للشاشة (حالة الطوارئ)"
          >
            <EyeOff className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline text-xs font-semibold">تمويه سريع</span>
          </button>

          {/* Privacy PIN lock */}
          <button
            onClick={isPinSet ? onLock : onOpenPinSetup}
            id="btn-pin-lock"
            className={`p-2 rounded-xl transition border text-xs flex items-center gap-1 ${
              isPinSet
                ? 'bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border-rose-800/40'
                : 'bg-rose-950/20 text-rose-400/60 border-rose-900/30'
            }`}
            title={isPinSet ? 'قفل المحادثة برمز السري' : 'تفعيل قفل الخصوصية'}
          >
            {isPinSet ? <Lock className="w-4 h-4 text-rose-400" /> : <KeyRound className="w-4 h-4" />}
          </button>

          {/* Clear Chat */}
          <button
            onClick={onClearChat}
            className="p-2 rounded-xl bg-rose-950/30 hover:bg-red-950/60 text-rose-400 hover:text-red-300 border border-rose-900/30 transition"
            title="مسح سجل المحادثة للخصوصية"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-4xl mx-auto mt-2.5">
        <nav className="flex items-center gap-1.5 p-1 bg-[#12040f] rounded-2xl border border-rose-950/70 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('chat')}
            id="tab-chat"
            className={`flex-1 min-w-[90px] py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'chat'
                ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-md shadow-rose-900/50 scale-[1.02]'
                : 'text-rose-300/70 hover:text-rose-100 hover:bg-rose-950/40'
            }`}
          >
            <MessageCircleHeart className="w-4 h-4" />
            <span>دردشة الأصحاب</span>
          </button>

          <button
            onClick={() => setActiveTab('whispers')}
            id="tab-whispers"
            className={`flex-1 min-w-[90px] py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'whispers'
                ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-md shadow-rose-900/50 scale-[1.02]'
                : 'text-rose-300/70 hover:text-rose-100 hover:bg-rose-950/40'
            }`}
          >
            <Flame className="w-4 h-4 text-amber-300" />
            <span>بنك الهمسات والمشاعر</span>
          </button>

          <button
            onClick={() => setActiveTab('cards')}
            id="tab-cards"
            className={`flex-1 min-w-[90px] py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'cards'
                ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-md shadow-rose-900/50 scale-[1.02]'
                : 'text-rose-300/70 hover:text-rose-100 hover:bg-rose-950/40'
            }`}
          >
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <span>صراحة أم جرأة حميمة</span>
          </button>

          <button
            onClick={() => setActiveTab('dice')}
            id="tab-dice"
            className={`flex-1 min-w-[90px] py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'dice'
                ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-md shadow-rose-900/50 scale-[1.02]'
                : 'text-rose-300/70 hover:text-rose-100 hover:bg-rose-950/40'
            }`}
          >
            <Dices className="w-4 h-4 text-rose-300" />
            <span>نرد الإثارة</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
