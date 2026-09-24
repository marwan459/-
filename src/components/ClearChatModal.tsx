import React from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';

interface ClearChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  messageCount: number;
}

export const ClearChatModal: React.FC<ClearChatModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  messageCount
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-[#1e071a] border border-red-900/60 rounded-3xl p-6 shadow-2xl text-center text-rose-50 relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 rounded-xl text-rose-400 hover:text-white hover:bg-rose-950/60 transition"
          title="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Trash Icon */}
        <div className="w-16 h-16 rounded-3xl bg-red-950/60 border border-red-600/50 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-950/60">
          <Trash2 className="w-8 h-8 text-red-400 animate-pulse" />
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-rose-100 mb-2">
          تفريغ سلة المهملات وحذف كل المحادثة؟
        </h3>

        {/* Description */}
        <p className="text-xs text-rose-300/80 leading-relaxed mb-5">
          سيتم مسح وحذف كافة الرسائل والفضفضة نهائياً ({messageCount} {messageCount === 1 ? 'رسالة' : 'رسائل'}) من ذاكرة هذا الجهاز لحماية خصوصيتك التامة.
          <span className="block text-red-400 font-semibold mt-1">
            لا يمكن التراجع عن هذا الإجراء بعد الحذف.
          </span>
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={onConfirm}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold text-xs sm:text-sm shadow-lg shadow-red-950/80 transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <Trash2 className="w-4 h-4" />
            <span>نعم، احذف كل الكلام نهائياً</span>
          </button>

          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-2xl bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 text-xs font-semibold border border-rose-900/50 transition cursor-pointer"
          >
            إلغاء والاحتفاظ بالرسائل
          </button>
        </div>
      </div>
    </div>
  );
};
