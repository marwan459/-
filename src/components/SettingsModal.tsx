import React, { useState } from 'react';
import { X, Heart, Shield, Sparkles, KeyRound, Check } from 'lucide-react';
import { soundFx } from '../utils/soundEffects';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  husbandName: string;
  setHusbandName: (name: string) => void;
  wifeName: string;
  setWifeName: (name: string) => void;
  onOpenPinSetup: () => void;
  isPinSet: boolean;
  onRemovePin: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  husbandName,
  setHusbandName,
  wifeName,
  setWifeName,
  onOpenPinSetup,
  isPinSet,
  onRemovePin
}) => {
  const [hName, setHName] = useState(husbandName);
  const [wName, setWName] = useState(wifeName);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (hName.trim()) setHusbandName(hName.trim());
    if (wName.trim()) setWifeName(wName.trim());
    localStorage.setItem('couple_husband_name', hName.trim());
    localStorage.setItem('couple_wife_name', wName.trim());
    soundFx.playMessageSent();
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-[#1e071a] border border-rose-900/70 rounded-3xl p-6 shadow-2xl text-rose-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-rose-400 hover:text-white p-1 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-700 to-pink-600 flex items-center justify-center shadow-md">
            <Heart className="w-5 h-5 text-white fill-white" />
          </div>
          <div>
            <h3 className="text-base font-bold text-rose-100">إعدادات الأصدقاء والخصوصية</h3>
            <p className="text-[11px] text-rose-300/70">تخصيص الأسماء وأمان الجلسة</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-rose-300 mb-1">
              اسمك أو لقبك:
            </label>
            <input
              type="text"
              value={hName}
              onChange={(e) => setHName(e.target.value)}
              placeholder="اسمك أو لقبك..."
              className="w-full bg-[#130310] border border-rose-900/60 rounded-xl p-2.5 text-xs text-rose-100 focus:outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-rose-300 mb-1">
              اسم الصديقة المصرية:
            </label>
            <input
              type="text"
              value={wName}
              onChange={(e) => setWName(e.target.value)}
              placeholder="سلمى / صاحبتك..."
              className="w-full bg-[#130310] border border-rose-900/60 rounded-xl p-2.5 text-xs text-rose-100 focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Privacy PIN settings */}
          <div className="pt-2 border-t border-rose-950">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-rose-200 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-rose-400" />
                <span>قفل الخصوصية برمز 4 أرقام</span>
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${isPinSet ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-400'}`}>
                {isPinSet ? 'مُفعّل' : 'غير مُفعّل'}
              </span>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onOpenPinSetup}
                className="flex-1 py-2 px-3 rounded-xl bg-rose-950/60 hover:bg-rose-900/70 border border-rose-800/50 text-xs text-rose-200 font-medium transition"
              >
                {isPinSet ? 'تغيير الرمز السري' : 'تعيين رمز سري الآن'}
              </button>
              {isPinSet && (
                <button
                  type="button"
                  onClick={onRemovePin}
                  className="py-2 px-3 rounded-xl bg-red-950/40 hover:bg-red-900/50 border border-red-800/40 text-xs text-red-300 font-medium transition"
                >
                  إلغاء القفل
                </button>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs text-rose-300 hover:bg-rose-900/30"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-bold shadow-md flex items-center gap-1"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>تم الحفظ</span>
                </>
              ) : (
                <span>حفظ التعديلات</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
