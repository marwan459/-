export type SenderRole = 'husband' | 'wife' | 'ai_partner';

export type HeatLevel = 'romantic' | 'hot' | 'daring';

export interface ChatMessage {
  id: string;
  sender: SenderRole;
  senderName: string;
  text: string;
  timestamp: string;
  type?: 'text' | 'whisper' | 'game' | 'dice';
  heatLevel?: HeatLevel;
  reaction?: string;
  audioUrl?: string;
}

export interface IntimacyCard {
  id: string;
  category: 'truth' | 'dare' | 'fantasy' | 'appreciation';
  heatLevel: HeatLevel;
  title: string;
  content: string;
  tip?: string;
}

export interface WhisperTemplate {
  id: string;
  category: 'craving' | 'flirt' | 'bold' | 'touch' | 'compliment' | 'invitation';
  categoryLabel: string;
  title: string;
  text: string;
  heatLevel: HeatLevel;
}

export interface DiceOption {
  actions: string[];
  parts: string[];
  styles: string[];
}

export interface CoupleSettings {
  husbandName: string;
  wifeName: string;
  partnerMode: 'couple_pass' | 'ai_spousal'; // couple passing device / live or AI romantic spouse
  pinCode: string;
  isPinEnabled: boolean;
  activeRole: SenderRole;
  ambientSound: 'off' | 'heartbeat' | 'fire' | 'soft_melodic';
}
