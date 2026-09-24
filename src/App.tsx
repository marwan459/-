import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ChatRoom } from './components/ChatRoom';
import { WhisperBank } from './components/WhisperBank';
import { IntimacyCards } from './components/IntimacyCards';
import { IntimacyDice } from './components/IntimacyDice';
import { DisguiseScreen } from './components/DisguiseScreen';
import { PinModal } from './components/PinModal';
import { SettingsModal } from './components/SettingsModal';
import { ClearChatModal } from './components/ClearChatModal';
import { ChatMessage, SenderRole, HeatLevel } from './types';
import { soundFx } from './utils/soundEffects';
import { egyptianVoice } from './utils/egyptianVoice';
import { Settings, Lock, Heart, ShieldCheck } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'whispers' | 'cards' | 'dice'>('chat');
  const [isDisguised, setIsDisguised] = useState<boolean>(false);
  const [isLocked, setIsLocked] = useState<boolean>(false);

  // Partner names
  const [husbandName, setHusbandName] = useState<string>(() => {
    return localStorage.getItem('couple_husband_name') || 'أنا (الصاحب الجدع)';
  });
  const [wifeName, setWifeName] = useState<string>(() => {
    return localStorage.getItem('couple_wife_name') || 'سلمى (صاحبتك المصرية)';
  });

  // Active sender role
  const [activeRole, setActiveRole] = useState<SenderRole>('husband');

  // PIN security
  const [savedPin, setSavedPin] = useState<string>(() => {
    return localStorage.getItem('couple_privacy_pin') || '';
  });
  const [showPinModal, setShowPinModal] = useState<boolean>(false);
  const [isSettingNewPin, setIsSettingNewPin] = useState<boolean>(false);

  // Settings modal
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // Clear chat modal
  const [showClearModal, setShowClearModal] = useState<boolean>(false);

  // Chat messages
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('couple_chat_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    // Default warm Egyptian friend starter messages
    return [
      {
        id: 'init_1',
        sender: 'wife',
        senderName: 'سلمى (صاحبتك المصرية)',
        text: 'يا أهلاً وسهلاً بأغلى وأجدع صاحب في الدنيا! منورني والله.. طمني عنك وعن صحتك، أنت عامل إيه واليوم ماشي معاك إزاي؟ أنا قاعدة أهو مروقة دماغي ومستنياك نحكي ونفضفض ونهزر سوا ونغير جو.. احكيلي سامعاك! ❤️',
        timestamp: '08:30 م',
        heatLevel: 'romantic',
        audioUrl: '/voices/cache/84145bd1a6b2ac56573fcc146414294a.wav'
      }
    ];
  });

  // Persist messages
  useEffect(() => {
    localStorage.setItem('couple_chat_history', JSON.stringify(messages));
  }, [messages]);

  // Handle PIN verification on lock
  useEffect(() => {
    if (savedPin && isLocked) {
      setShowPinModal(true);
    }
  }, [isLocked, savedPin]);

  const handleClearChat = () => {
    setShowClearModal(true);
  };

  const handleConfirmClearChat = () => {
    setMessages([]);
    localStorage.removeItem('couple_chat_history');
    egyptianVoice.stop();
    soundFx.playMessageSent();
    setShowClearModal(false);
  };

  const handleDeleteSingleMessage = (msgId: string) => {
    setMessages(prev => {
      const updated = prev.filter(m => m.id !== msgId);
      localStorage.setItem('couple_chat_history', JSON.stringify(updated));
      return updated;
    });
    soundFx.playMessageSent();
  };

  const handleSendToChat = (text: string, heatLevel?: HeatLevel) => {
    const senderName = activeRole === 'husband' ? husbandName : wifeName;
    const newMsg: ChatMessage = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
      sender: activeRole,
      senderName,
      text,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      heatLevel: heatLevel || 'hot'
    };

    setMessages(prev => [...prev, newMsg]);
    setActiveTab('chat');
  };

  const handlePinSuccess = (newPin: string) => {
    if (isSettingNewPin) {
      setSavedPin(newPin);
      localStorage.setItem('couple_privacy_pin', newPin);
      setIsSettingNewPin(false);
      setShowPinModal(false);
    } else {
      setIsLocked(false);
      setShowPinModal(false);
    }
  };

  const handleRemovePin = () => {
    setSavedPin('');
    localStorage.removeItem('couple_privacy_pin');
    setIsLocked(false);
    setShowPinModal(false);
  };

  // If in disguise mode, render the camouflage screen immediately
  if (isDisguised) {
    return (
      <DisguiseScreen
        onUnlock={() => {
          setIsDisguised(false);
          soundFx.playWhisperChime();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#10020c] text-rose-50 flex flex-col selection:bg-rose-600 selection:text-white relative font-['Tajawal',sans-serif]">
      {/* Background ambient glowing gradient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-rose-900/15 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-32 w-96 h-96 bg-pink-900/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-purple-900/15 rounded-full blur-3xl" />
      </div>

      {/* Main App Container */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Navigation Bar */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onDisguise={() => setIsDisguised(true)}
          onLock={() => {
            if (savedPin) {
              setIsLocked(true);
              setShowPinModal(true);
            } else {
              setIsSettingNewPin(true);
              setShowPinModal(true);
            }
          }}
          onClearChat={handleClearChat}
          isPinSet={Boolean(savedPin)}
          onOpenPinSetup={() => {
            setIsSettingNewPin(true);
            setShowPinModal(true);
          }}
        />

        {/* Tab View Container */}
        <main className="flex-1 pb-16 sm:pb-6">
          {activeTab === 'chat' && (
            <ChatRoom
              messages={messages}
              setMessages={setMessages}
              activeRole={activeRole}
              setActiveRole={setActiveRole}
              husbandName={husbandName}
              wifeName={wifeName}
              onClearChat={handleClearChat}
              onDeleteMessage={handleDeleteSingleMessage}
            />
          )}

          {activeTab === 'whispers' && (
            <WhisperBank onSendToChat={handleSendToChat} />
          )}

          {activeTab === 'cards' && (
            <IntimacyCards onSendToChat={handleSendToChat} />
          )}

          {activeTab === 'dice' && (
            <IntimacyDice onSendToChat={handleSendToChat} />
          )}
        </main>

        {/* Floating Settings button */}
        <div className="fixed bottom-4 left-4 z-30">
          <button
            onClick={() => setShowSettings(true)}
            className="p-3 rounded-2xl bg-rose-950/80 hover:bg-rose-900/90 text-rose-300 border border-rose-800/60 shadow-xl backdrop-blur-xs transition flex items-center gap-1.5 text-xs font-bold active:scale-95"
            title="إعدادات الأسماء والأصحاب"
          >
            <Settings className="w-4 h-4 text-pink-400" />
            <span className="hidden sm:inline">إعدادات الأصحاب</span>
          </button>
        </div>
      </div>

      {/* Clear Chat Confirmation Modal */}
      <ClearChatModal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={handleConfirmClearChat}
        messageCount={messages.length}
      />

      {/* PIN Lock Modal */}
      <PinModal
        isOpen={showPinModal}
        onClose={() => {
          if (!isLocked) {
            setShowPinModal(false);
          }
        }}
        savedPin={savedPin}
        isSettingNew={isSettingNewPin}
        onSuccess={handlePinSuccess}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        husbandName={husbandName}
        setHusbandName={setHusbandName}
        wifeName={wifeName}
        setWifeName={setWifeName}
        onOpenPinSetup={() => {
          setShowSettings(false);
          setIsSettingNewPin(true);
          setShowPinModal(true);
        }}
        isPinSet={Boolean(savedPin)}
        onRemovePin={handleRemovePin}
      />
    </div>
  );
}
