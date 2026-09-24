import React, { useState, useRef, useEffect } from 'react';
import {
  ChatMessage,
  SenderRole,
  HeatLevel
} from '../types';
import {
  Send,
  Sparkles,
  Flame,
  Heart,
  Bot,
  Mic,
  Smile,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Headphones,
  Wand2,
  Sliders,
  Trash2
} from 'lucide-react';
import { soundFx } from '../utils/soundEffects';
import { egyptianVoice, EGYPTIAN_HUMAN_VOICES } from '../utils/egyptianVoice';
import {
  WHISPER_TEMPLATES,
  getSmartEgyptianReply
} from '../data/intimacyContent';

interface ChatRoomProps {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  activeRole: SenderRole;
  setActiveRole: (role: SenderRole) => void;
  husbandName: string;
  wifeName: string;
  onClearChat: () => void;
  onDeleteMessage: (msgId: string) => void;
}

export const ChatRoom: React.FC<ChatRoomProps> = ({
  messages,
  setMessages,
  activeRole,
  setActiveRole,
  husbandName,
  wifeName,
  onClearChat,
  onDeleteMessage
}) => {
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showQuickWhispers, setShowQuickWhispers] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [showVoiceNotesTray, setShowVoiceNotesTray] = useState(false);
  const [activeVoiceNoteId, setActiveVoiceNoteId] = useState<string | null>(null);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [currentlySpeakingMsgId, setCurrentlySpeakingMsgId] = useState<string | null>(null);
  const [autoVoice, setAutoVoice] = useState<boolean>(true);
  const [chatMode, setChatMode] = useState<'ai' | 'couple'>('ai');

  const voiceNotesCatalog = [
    {
      id: 'greeting',
      title: 'ترحيب واطمئنان',
      text: 'ازيك يا غالي؟ عامل إيه النهاردة؟ وحشتني والله، نورت يومي بجد!',
      audioUrl: '/voices/greeting.wav',
      icon: '👋',
      tag: 'شوق وترحيب'
    },
    {
      id: 'how_are_you',
      title: 'سؤال واهتمام جدع',
      text: 'طمني عنك وعن يومك.. أنا سامعاك ومستنياك تحكيلي كل حاجة، أنت على راسي من فوق يا صاحبي.',
      audioUrl: '/voices/how_are_you.wav',
      icon: '❤️',
      tag: 'اهتمام'
    },
    {
      id: 'cheer_up',
      title: 'روقان وفرفشة',
      text: 'يا سيدي سيبك من أي حاجة مضايقاك، الدنيا ما تستاهلش زعلك ده إحنا معمولين عشان نضحك ونروق، احكيلي وفضفضلي.',
      audioUrl: '/voices/cheer_up.wav',
      icon: '✨',
      tag: 'فرفشة'
    },
    {
      id: 'laugh',
      title: 'ضحك وهزار مصري',
      text: 'ههههههه ضحكتك دي بالدنيا والله! يا عم ده إنت سكر، ما تحكيلي كمان موقف كده يروقنا!',
      audioUrl: '/voices/laugh.wav',
      icon: '😂',
      tag: 'ضحك وهزار'
    },
    {
      id: 'tea_break',
      title: 'شاي بالنعناع ورواق',
      text: 'قاعدة بشرب كوباية شاي بالنعناع ومروقة دماغي خالص، تعالى اشرب معايا ونقعد ندردش براحتنا.',
      audioUrl: '/voices/tea_break.wav',
      icon: '☕',
      tag: 'روقان'
    },
    {
      id: 'good_morning',
      title: 'صباح الفل والياسمين',
      text: 'يا صباح الفل والياسمين والجمال كله على أحلى صاحب! يومك قمر وسعيد زيك يا رب.',
      audioUrl: '/voices/good_morning.wav',
      icon: '☀️',
      tag: 'صباحيات'
    },
    {
      id: 'good_night',
      title: 'تصبح على خير وسعادة',
      text: 'تصبح على ألف خير وسعادة يا غالي، نوم الهنا وأحلام حلوة ومريحة، وطمني عليك أول ما تصحى!',
      audioUrl: '/voices/good_night.wav',
      icon: '🌙',
      tag: 'مسائيات'
    },
    {
      id: 'caring',
      title: 'جدعنة ومعزة غالية',
      text: 'تسلملي يا رب ويديم الجدعنة والمحبة، والله معزتك في قلبي كبيرة أوي وأجدع صاحب عرفته في حياتي.',
      audioUrl: '/voices/caring.wav',
      icon: '💎',
      tag: 'جدعنة'
    }
  ];

  const handlePlayVoiceNote = (note: typeof voiceNotesCatalog[0]) => {
    if (activeVoiceNoteId === note.id) {
      egyptianVoice.stop();
      setActiveVoiceNoteId(null);
    } else {
      setActiveVoiceNoteId(note.id);
      soundFx.playWhisperChime();
      egyptianVoice.playAudioUrl(note.audioUrl, () => {
        setActiveVoiceNoteId(null);
      }, note.id);
    }
  };

  const handleSendVoiceNoteToChat = (note: typeof voiceNotesCatalog[0]) => {
    soundFx.playMessageSent();
    const newMsg: ChatMessage = {
      id: 'voice_' + Date.now(),
      sender: 'wife',
      senderName: `${wifeName} (فويس نوت 🎙️)`,
      text: note.text,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      heatLevel: 'romantic',
      type: 'whisper',
      audioUrl: note.audioUrl
    };
    setMessages(prev => [...prev, newMsg]);
    setShowVoiceNotesTray(false);

    setTimeout(() => {
      handleSpeakText(newMsg.id, note.text, note.audioUrl);
    }, 200);
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lastAddedPartnerMessageRef = useRef<ChatMessage | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    const unsub = egyptianVoice.subscribe((speaking) => {
      if (!speaking) {
        setCurrentlySpeakingMsgId(null);
      }
    });
    return () => {
      unsub();
    };
  }, []);

  // Voice playback with direct text and optional direct audioUrl parameter
  const handleSpeakText = (msgId: string, textToSpeak: string, audioUrl?: string) => {
    if (currentlySpeakingMsgId === msgId) {
      egyptianVoice.stop();
      setCurrentlySpeakingMsgId(null);
    } else {
      setCurrentlySpeakingMsgId(msgId);
      soundFx.playWhisperChime();
      // Pass the message text and direct audioUrl to egyptianVoice
      egyptianVoice.speak(textToSpeak, () => {
        setCurrentlySpeakingMsgId(null);
      }, msgId, audioUrl);
    }
  };

  // Trigger voice only after React UI state update is confirmed complete,
  // verifying with Ref that the latest added message in UI state exactly matches the text to speak
  useEffect(() => {
    if (!lastAddedPartnerMessageRef.current || messages.length === 0) return;

    const latestMsg = messages[messages.length - 1];

    // Verify using Ref that the latest message in state is strictly identical
    if (
      latestMsg &&
      latestMsg.sender === 'wife' &&
      latestMsg.id === lastAddedPartnerMessageRef.current.id &&
      latestMsg.text === lastAddedPartnerMessageRef.current.text
    ) {
      const textToSpeak = latestMsg.text;
      const msgId = latestMsg.id;
      const audioUrl = latestMsg.audioUrl;

      // Clear Ref immediately to prevent duplicate runs
      lastAddedPartnerMessageRef.current = null;

      if (autoVoice && textToSpeak) {
        // Send the message text as a direct parameter to the speech function along with its audioUrl
        handleSpeakText(msgId, textToSpeak, audioUrl);
      }
    }
  }, [messages, autoVoice]);

  const handleSendMessage = (textToSend?: string, heatLevel?: HeatLevel) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    soundFx.playMessageSent();

    const senderName =
      activeRole === 'husband'
        ? husbandName
        : activeRole === 'wife'
        ? wifeName
        : (husbandName || 'أنا');

    const newMsg: ChatMessage = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
      sender: activeRole,
      senderName,
      text,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      heatLevel: heatLevel || (text.includes('🔥') || text.includes('سهرة') ? 'hot' : 'romantic')
    };

    setMessages(prev => [...prev, newMsg]);
    if (!textToSend) {
      setInputText('');
    }
    setShowQuickWhispers(false);
    setShowEmojiPicker(false);

    // If chatMode is 'ai' and user is husband (or active), trigger Egyptian partner response
    if (chatMode === 'ai') {
      triggerEgyptianPartnerResponse(text);
    }
  };

  const triggerEgyptianPartnerResponse = async (userText: string) => {
    setIsTyping(true);

    try {
      const history = messages.slice(-10).map(m => ({
        text: m.text,
        sender: m.sender
      }));

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 9000);

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          message: userText,
          partnerName: wifeName,
          history
        })
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && data.reply) {
          addPartnerMessage(data.reply, data.audioUrl);
          return;
        }
      }
    } catch {
      // Fallback seamlessly
    }

    // Guaranteed fallback with 100% matched authentic audio and text
    const lower = userText.toLowerCase();
    const matched = EGYPTIAN_HUMAN_VOICES.find(v => v.keywords.some(k => lower.includes(k))) || EGYPTIAN_HUMAN_VOICES[0];
    addPartnerMessage(matched.exactText, matched.audioUrl);
  };

  const addPartnerMessage = (replyText: string, audioUrl?: string) => {
    setIsTyping(false);
    soundFx.playWhisperChime();

    const newId = 'msg_partner_' + Date.now();
    const partnerMsg: ChatMessage = {
      id: newId,
      sender: 'wife',
      senderName: `${wifeName}`,
      text: replyText,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      heatLevel: 'romantic',
      audioUrl: audioUrl || undefined
    };

    // Store in Ref so useEffect triggers speech only after UI state update is fully committed
    lastAddedPartnerMessageRef.current = partnerMsg;
    setMessages(prev => [...prev, partnerMsg]);
  };

  const handleSendPresetVoiceWhisper = () => {
    const chosenNote = voiceNotesCatalog[Math.floor(Math.random() * voiceNotesCatalog.length)];
    handleSendVoiceNoteToChat(chosenNote);
  };

  const handleReaction = (msgId: string, emoji: string) => {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, reaction: emoji } : m));
    soundFx.playMessageSent();
  };

  const emojis = ['❤️', '🔥', '💋', '🌹', '🫦', '🤤', '🤫', '✨', '😍', '👀'];

  return (
    <div className="flex flex-col h-[calc(100vh-130px)] sm:h-[calc(100vh-140px)] max-w-4xl mx-auto">
      {/* Top Controls Bar */}
      <div className="bg-[#180515] border-b border-rose-950/80 px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Left: Role and Mode */}
        <div className="flex items-center gap-2">
          <div className="flex bg-[#23081e] p-0.5 rounded-xl border border-rose-900/40">
            <button
              onClick={() => setActiveRole('husband')}
              className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1 transition ${
                activeRole === 'husband'
                  ? 'bg-rose-700 text-white shadow-xs'
                  : 'text-rose-300/70 hover:text-white'
              }`}
            >
              <span>🙋‍♂️ {husbandName}</span>
            </button>
            <button
              onClick={() => setActiveRole('wife')}
              className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1 transition ${
                activeRole === 'wife'
                  ? 'bg-pink-600 text-white shadow-xs'
                  : 'text-rose-300/70 hover:text-white'
              }`}
            >
              <span>🙋‍♀️ {wifeName}</span>
            </button>
          </div>

          <div className="flex items-center gap-1 bg-[#23081e] px-2 py-1 rounded-xl border border-rose-900/40 text-[11px] text-pink-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold">{wifeName} متصلة الآن</span>
          </div>
        </div>

        {/* Right: Voice Controls & Settings */}
        <div className="flex items-center gap-1.5">
          {/* Real Egyptian Voice Notes Quick Drawer Button */}
          <button
            onClick={() => setShowVoiceNotesTray(!showVoiceNotesTray)}
            className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 transition ${
              showVoiceNotesTray
                ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white border-pink-400 shadow-md shadow-rose-950'
                : 'bg-rose-950/60 hover:bg-rose-900/70 text-rose-200 border-rose-800/60'
            }`}
            title="فتح فويس نوت بصوت سلمى المصرية الحقيقي"
          >
            <Mic className="w-3.5 h-3.5 text-pink-300 animate-pulse" />
            <span>فويس نوت سلمى 🎙️</span>
            <span className="text-[9px] bg-pink-500/40 text-pink-100 px-1 py-0.2 rounded-md font-mono">صوت بشري</span>
          </button>

          {/* Toggle Auto Voice */}
          <button
            onClick={() => setAutoVoice(!autoVoice)}
            className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1 transition ${
              autoVoice
                ? 'bg-rose-900/60 text-pink-200 border-rose-600 shadow-sm'
                : 'bg-rose-950/40 text-rose-400 border-rose-900/40'
            }`}
            title="تشغيل الصوت المصري التلقائي للرسائل المستلمة"
          >
            {autoVoice ? <Volume2 className="w-3.5 h-3.5 text-pink-300 animate-pulse" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>صوت مصري: {autoVoice ? 'مُفعّل' : 'صامت'}</span>
          </button>

          {/* Voice Tuning Button */}
          <button
            onClick={() => setShowVoiceSettings(!showVoiceSettings)}
            className="p-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-900/40 transition cursor-pointer"
            title="معلومات وضبط الصوت الأنثوي المصري"
          >
            <Sliders className="w-4 h-4 text-pink-400" />
          </button>

          {/* Clear Chat / Trash Can Button */}
          <button
            onClick={onClearChat}
            id="btn-clear-chat-topbar"
            className="px-2.5 py-1.5 rounded-xl bg-red-950/50 hover:bg-red-900/70 text-red-300 hover:text-red-100 border border-red-800/50 transition flex items-center gap-1.5 text-[11px] font-bold cursor-pointer active:scale-95 shadow-sm"
            title="سلة المهملات: حذف كل كلام المحادثة بالكامل"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
            <span>سلة المهملات 🗑️</span>
          </button>
        </div>
      </div>

      {/* Real Egyptian Voice Notes Drawer */}
      {showVoiceNotesTray && (
        <div className="bg-[#21071c] border-b border-rose-900/60 p-3 shadow-2xl transition">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-base">🎙️</span>
              <span className="font-bold text-xs text-rose-100">فويس نوت بصوت سلمى المصرية (صوت بشري طبيعي 100%)</span>
            </div>
            <button
              onClick={() => setShowVoiceNotesTray(false)}
              className="text-[10px] text-rose-400 hover:text-white px-2 py-0.5 rounded-lg bg-rose-950/50 cursor-pointer"
            >
              إغلاق ✕
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {voiceNotesCatalog.map((note) => {
              const isPlayingThis = activeVoiceNoteId === note.id;
              return (
                <div
                  key={note.id}
                  className={`p-2.5 rounded-2xl border transition flex flex-col justify-between gap-2 ${
                    isPlayingThis
                      ? 'bg-rose-950/90 border-pink-500 shadow-lg shadow-pink-950/40'
                      : 'bg-[#180514]/70 hover:bg-[#1f071a] border-rose-900/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{note.icon}</span>
                      <span className="font-bold text-xs text-pink-200">{note.title}</span>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-rose-900/40 text-rose-300 font-medium">
                      {note.tag}
                    </span>
                  </div>

                  <p className="text-[11px] text-rose-200/90 line-clamp-2 leading-relaxed">
                    "{note.text}"
                  </p>

                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-rose-950">
                    <button
                      onClick={() => handlePlayVoiceNote(note)}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer ${
                        isPlayingThis
                          ? 'bg-pink-600 text-white animate-pulse'
                          : 'bg-rose-900/60 hover:bg-rose-800 text-rose-200'
                      }`}
                    >
                      {isPlayingThis ? (
                        <>
                          <Pause className="w-3 h-3" />
                          <span>إيقاف</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 fill-rose-200" />
                          <span>تشغيل الصوت</span>
                        </>
                      )}
                    </button>

                    {isPlayingThis && (
                      <div className="flex items-center gap-0.5 h-3">
                        {[40, 90, 60, 100, 50, 80].map((h, i) => (
                          <span
                            key={i}
                            style={{ height: `${h}%` }}
                            className="w-0.5 bg-pink-400 rounded-full animate-bounce"
                          />
                        ))}
                      </div>
                    )}

                    <button
                      onClick={() => handleSendVoiceNoteToChat(note)}
                      className="text-[10px] text-rose-300/80 hover:text-white flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-rose-950/60 transition cursor-pointer"
                      title="إرسال للشات كرسالة صوتية"
                    >
                      <Send className="w-3 h-3 rotate-180" />
                      <span>إرسال بالشات</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Voice Info Modal/Bar */}
      {showVoiceSettings && (
        <div className="bg-[#22071d] border-b border-rose-900/60 p-3 text-xs text-rose-100 flex flex-wrap items-center justify-between gap-3 shadow-xl">
          <div className="flex items-center gap-2">
            <Headphones className="w-4 h-4 text-pink-400" />
            <span className="font-bold text-rose-200">الصوت المصري الطبيعي (Aoede Neural Audio):</span>
            <span className="text-[11px] text-rose-300">مُولّد بنبرة أنثوية مصرية حقيقية 100% بدون أي روبوتية.</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Test Voice Button */}
            <button
              onClick={() => {
                handleSpeakText(
                  'preview_salma',
                  'وعليكم السلام ورحمة الله وبركاته يا غالي! يا مية أهلاً وسهلاً.. نورت يومي كله، طمني عنك وعن أحوالك عامل إيه النهاردة؟',
                  '/voices/cache/c7da3940f074c551ef171f2f2173b722.wav'
                );
              }}
              className="px-3 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-[11px] font-bold shadow-xs flex items-center gap-1 cursor-pointer"
            >
              <Play className="w-3 h-3 fill-white" />
              <span>تجربة صوت سلمى المصرية 🎙️</span>
            </button>
          </div>
        </div>
      )}

      {/* Messages List Area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 bg-gradient-to-b from-[#13030f] via-[#160413] to-[#11020d]">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-rose-300/70 space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-rose-950 to-pink-900/60 border border-rose-800/50 flex items-center justify-center shadow-xl">
              <Trash2 className="w-8 h-8 text-rose-400" />
            </div>
            <h3 className="text-base font-bold text-rose-100">
              المحادثة خالية تماماً (تم تفريغ السلة بنجاح)
            </h3>
            <p className="text-xs max-w-sm leading-relaxed text-rose-300/80">
              تم مسح كافة الرسائل السابقة بالكامل لحماية خصوصيتك. اكتب أي رسالة في شريط المحادثة بالأسفل أو اضغط للبدء من جديد.
            </p>
            <button
              onClick={() => handleSendMessage('ازيك يا سلمى عاملة إيه؟ طمنيني عنك يا غالية ❤️', 'romantic')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-bold transition flex items-center gap-1.5 mt-2 shadow-lg shadow-rose-950/60 cursor-pointer active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>بدء رسالة جديدة مع سلمى</span>
            </button>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender === activeRole;
            const isHusband = msg.sender === 'husband';
            const isSpeakingThis = currentlySpeakingMsgId === msg.id;

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group`}
              >
                {/* Sender label */}
                <div className="flex items-center gap-1.5 px-2 mb-1 text-[11px] text-rose-400/70">
                  <span className="font-bold text-rose-300">
                    {msg.senderName}
                  </span>
                  <span>•</span>
                  <span>{msg.timestamp}</span>
                </div>

                {/* Bubble Container */}
                <div
                  className={`relative max-w-[88%] sm:max-w-[78%] rounded-3xl p-3.5 sm:p-4 text-xs sm:text-sm leading-relaxed shadow-lg transition-all duration-200 ${
                    isMe
                      ? isHusband
                        ? 'bg-gradient-to-tr from-rose-800 to-rose-700 text-white rounded-tr-xs border border-rose-600/40 shadow-rose-950/60'
                        : 'bg-gradient-to-tr from-pink-800 to-pink-700 text-white rounded-tr-xs border border-pink-500/40 shadow-pink-950/60'
                      : 'bg-[#25081f] text-rose-100 rounded-tl-xs border border-rose-900/60 shadow-black/40'
                  }`}
                >
                  {/* Heat badge if daring or hot */}
                  {msg.heatLevel === 'daring' && (
                    <div className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-red-950/80 text-red-200 border border-red-600/40 mb-1 font-bold">
                      <Flame className="w-3 h-3 text-red-400 fill-red-400" /> همسة جريئة
                    </div>
                  )}

                  {/* Message Text */}
                  <p className="whitespace-pre-line break-words font-medium text-rose-50 leading-relaxed">
                    {msg.text}
                  </p>

                  {/* Egyptian Voice Audio Playback bar on Partner messages */}
                  {!isMe && (
                    <div className="mt-2.5 pt-2 border-t border-rose-900/50 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleSpeakText(msg.id, msg.text, msg.audioUrl)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                          isSpeakingThis
                            ? 'bg-pink-600 text-white shadow-md shadow-pink-900 animate-pulse'
                            : 'bg-rose-950/70 hover:bg-rose-900 text-pink-300 border border-rose-800/40'
                        }`}
                      >
                        {isSpeakingThis ? (
                          <>
                            <Pause className="w-3.5 h-3.5" />
                            <span>إيقاف الصوت</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>اسمع بصوت سلمى المصرية 🎙️</span>
                          </>
                        )}
                      </button>

                      {/* Visual Waveform Effect when speaking */}
                      {isSpeakingThis && (
                        <div className="flex items-center gap-0.5 h-4">
                          {[30, 80, 50, 100, 60, 90, 40, 75, 50, 95].map((h, idx) => (
                            <span
                              key={idx}
                              style={{ height: `${h}%` }}
                              className="w-1 bg-pink-400 rounded-full animate-bounce"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Reaction badge */}
                  {msg.reaction && (
                    <div className="absolute -bottom-2 -left-2 bg-[#2a0822] border border-rose-700/60 rounded-full px-2 py-0.5 text-xs shadow-md">
                      {msg.reaction}
                    </div>
                  )}
                </div>

                {/* Quick Emoji Reaction Tray on Hover & Delete */}
                <div className="flex items-center gap-1.5 mt-1 opacity-0 group-hover:opacity-100 transition duration-150 px-2">
                  {['❤️', '🔥', '💋', '🫦', '😍'].map((emo) => (
                    <button
                      key={emo}
                      onClick={() => handleReaction(msg.id, emo)}
                      className="text-xs hover:scale-125 transition p-0.5 cursor-pointer"
                    >
                      {emo}
                    </button>
                  ))}
                  <div className="w-[1px] h-3 bg-rose-800/40 mx-0.5" />
                  <button
                    onClick={() => onDeleteMessage(msg.id)}
                    className="text-[10px] text-rose-400 hover:text-red-300 p-1 rounded-md hover:bg-red-950/60 transition flex items-center gap-0.5 cursor-pointer"
                    title="حذف هذه الرسالة نهائياً"
                  >
                    <Trash2 className="w-3 h-3 text-red-400/80 hover:text-red-400" />
                    <span className="hidden sm:inline">حذف</span>
                  </button>
                </div>
              </div>
            );
          })
        )}

        {/* AI Typing Indicator */}
        {isTyping && (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-[#23081e] border border-rose-900/60 max-w-[220px] text-xs text-rose-300">
            <span className="w-2 h-2 rounded-full bg-pink-500 animate-bounce" />
            <span className="w-2 h-2 rounded-full bg-pink-500 animate-bounce [animation-delay:0.2s]" />
            <span className="w-2 h-2 rounded-full bg-pink-500 animate-bounce [animation-delay:0.4s]" />
            <span className="text-[11px] font-medium mr-1">{wifeName} بتكتب لك...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Egyptian Friend Topics (Expandable) */}
      {showQuickWhispers && (
        <div className="bg-[#1f071a] border-t border-rose-950 p-2.5 max-h-48 overflow-y-auto space-y-1.5 shadow-2xl">
          <div className="flex items-center justify-between text-[11px] text-rose-300 font-bold px-1 mb-1">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              مواضيع دردشة وفضفضة مصرية سريعة:
            </span>
            <button
              onClick={() => setShowQuickWhispers(false)}
              className="text-rose-400/60 hover:text-white"
            >
              إغلاق
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {[
              { title: 'سؤال واطمئنان', text: 'ازيك يا سلمى عامله ايه؟ طمنيني عنك يا غالية ❤️' },
              { title: 'فضفضة', text: 'زهقان شوية ومحتاج افضفضلك واحكي معاكي..' },
              { title: 'إيه الأخبار', text: 'قاعده بتعملي ايه دلوقتي؟ فينك مش باينة 😉' },
              { title: 'ضحك وهزار', text: 'ضحكيني بنكتة حلوة أو احكيلي موقف مسخرة هههه' },
              { title: 'شاي بالنعناع', text: 'تعالي نشرب شاي بالنعناع ونروق دماغنا ونحكي' },
              { title: 'جدعنة ومحبة', text: 'وحشتني خفة دمك وجدعنتك يا أجدع صاحبة في الدنيا ✨' },
            ].map((w, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(w.text, 'romantic')}
                className="text-right p-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-xs text-rose-200 border border-rose-900/40 hover:border-rose-700/60 transition truncate block"
              >
                <span className="font-bold text-pink-300 block text-[10px] mb-0.5">{w.title}:</span>
                "{w.text}"
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Emoji Picker Popover */}
      {showEmojiPicker && (
        <div className="bg-[#1f071a] border-t border-rose-950 p-2 flex items-center justify-around overflow-x-auto shadow-2xl">
          {emojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                setInputText(prev => prev + emoji);
                inputRef.current?.focus();
              }}
              className="text-xl p-1.5 hover:scale-125 transition"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Input Form Bar */}
      <div className="p-2 sm:p-3 bg-[#190616] border-t border-rose-950/80">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-end gap-1.5 sm:gap-2"
        >
          {/* Quick Whisper Drawer Toggle */}
          <button
            type="button"
            onClick={() => setShowQuickWhispers(!showQuickWhispers)}
            className={`p-2.5 rounded-2xl border transition shrink-0 ${
              showQuickWhispers
                ? 'bg-rose-700 text-white border-rose-500'
                : 'bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border-rose-900/50'
            }`}
            title="همسات جاهزة بالمصري"
          >
            <Flame className="w-5 h-5 text-amber-300" />
          </button>

          {/* Emoji Toggle */}
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2.5 rounded-2xl bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border border-rose-900/50 transition shrink-0"
            title="رموز رومانسية"
          >
            <Smile className="w-5 h-5 text-pink-400" />
          </button>

          {/* Voice whisper trigger button */}
          <button
            type="button"
            onClick={handleSendPresetVoiceWhisper}
            className="p-2.5 rounded-2xl bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border border-rose-900/50 transition shrink-0"
            title="طلب رسالة صوتية مصرية فورية"
          >
            <Mic className="w-5 h-5 text-pink-400" />
          </button>

          {/* Text Input Area */}
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              rows={1}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="اكتب لسلمى وهترد عليك بصوت مصري طبيعي وكلام حقيقي من القلب..."
              className="w-full bg-[#10030d] border border-rose-900/60 focus:border-rose-500 rounded-2xl py-3 px-3.5 text-xs sm:text-sm text-rose-100 placeholder-rose-400/40 focus:outline-none resize-none max-h-28 leading-relaxed"
            />
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-3 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold transition shadow-lg shadow-rose-950/60 disabled:opacity-40 disabled:cursor-not-allowed shrink-0 active:scale-95"
            title="إرسال"
          >
            <Send className="w-5 h-5 rotate-180" />
          </button>
        </form>
      </div>
    </div>
  );
};
