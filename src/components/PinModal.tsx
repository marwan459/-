import React, { useState } from 'react';
import { Lock, KeyRound, X, Check, ShieldAlert } from 'lucide-react';

interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedPin: string;
  isSettingNew: boolean;
  onSuccess: (pin: string) => void;
}

export const PinModal: React.FC<PinModalProps> = ({
  isOpen,
  onClose,
  savedPin,
  isSettingNew,
  onSuccess
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError('');
      if (nextPin.length === 4) {
        validatePin(nextPin);
      }
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
    setError('');
  };

  const validatePin = (inputPin: string) => {
    if (isSettingNew) {
      onSuccess(inputPin);
      setPin('');
      onClose();
    } else {
      if (inputPin === savedPin) {
        onSuccess(inputPin);
        setPin('');
      } else {
        setError('رمز الأمان غير صحيح، يرجى المحاولة ثانية');
        setTimeout(() => setPin(''), 600);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-xs bg-[#1f0a1b] border border-rose-900/60 rounded-3xl p-6 shadow-2xl text-center text-rose-50 relative animate-in fade-in zoom-in-95 duration-200">
        {!savedPin && !isSettingNew ? null : (
          <button
            onClick={onClose}
            className="absolute top-4 left-4 text-rose-400 hover:text-white p-1 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="w-14 h-14 bg-gradient-to-tr from-rose-950 to-pink-900/60 border border-rose-500/30 rounded-2xl mx-auto flex items-center justify-center mb-3 shadow-inner">
          {isSettingNew ? (
            <KeyRound className="w-7 h-7 text-rose-400" />
          ) : (
            <Lock className="w-7 h-7 text-rose-400 animate-pulse" />
          )}
        </div>

        <h3 className="text-lg font-bold text-rose-100 mb-1">
          {isSettingNew ? 'تعيين رمز قفل الخصوصية' : 'مساحة الأصدقاء الخاصة'}
        </h3>
        <p className="text-xs text-rose-300/70 mb-5">
          {isSettingNew
            ? 'أدخل 4 أرقام لحماية محادثاتكما وخصوصيتكما'
            : 'أدخل رمز الأمان المكون من 4 أرقام للمتابعة'}
        </p>

        {/* 4 dots display */}
        <div className="flex justify-center gap-3 mb-6">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                pin.length > idx
                  ? 'bg-rose-500 border-rose-400 scale-110 shadow-sm shadow-rose-500/50'
                  : 'border-rose-900/80 bg-rose-950/40'
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="flex items-center justify-center gap-1.5 text-xs text-red-400 mb-3 animate-shake">
            <ShieldAlert className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Numeric keypad */}
        <div className="grid grid-cols-3 gap-2.5 mb-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              onClick={() => handleDigit(num)}
              className="h-12 rounded-2xl bg-rose-950/40 hover:bg-rose-900/60 active:scale-95 border border-rose-800/30 text-lg font-bold text-rose-100 transition shadow-xs"
            >
              {num}
            </button>
          ))}
          <button
            onClick={() => setPin('')}
            className="h-12 rounded-2xl bg-rose-950/20 hover:bg-rose-950/50 text-xs text-rose-400 font-medium transition"
          >
            مسح
          </button>
          <button
            onClick={() => handleDigit('0')}
            className="h-12 rounded-2xl bg-rose-950/40 hover:bg-rose-900/60 active:scale-95 border border-rose-800/30 text-lg font-bold text-rose-100 transition shadow-xs"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="h-12 rounded-2xl bg-rose-950/20 hover:bg-rose-950/50 text-xs text-rose-400 font-medium transition"
          >
            حذف
          </button>
        </div>

        {isSettingNew && (
          <p className="text-[11px] text-rose-400/60">
            يمكنك دائماً تغيير الرمز لاحقاً من شريط الإعدادات
          </p>
        )}
      </div>
    </div>
  );
};
