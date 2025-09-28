

export type LanguageCode = 'en' | 'es' | 'fr' | 'de' | 'ru' | 'zh' | 'ja' | 'pt';

export interface Persona {
  id: string;
  nameKey: string;
  image: string;
  descriptionKey: string;
  systemPromptKey: string;
  gender: 'female' | 'male';
  button3Key: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  isTriggerMessage?: boolean;
  buttons?: { textKey: string; url: string; }[];
}

export interface Language {
    code: LanguageCode;
    name: string;
}