import { Persona, Language, LanguageCode } from './types';

export const LANGUAGES: Language[] = [
  { code: 'en', name: 'English' },
  { code: 'ru', name: 'Русский' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'zh', name: '中文' },
  { code: 'ja', name: '日本語' },
  { code: 'pt', name: 'Português' },
];

export const PERSONAS: Persona[] = [
  {
    id: 'brunette',
    nameKey: 'brunetteName',
    image: 'https://images.unsplash.com/photo-1604004555489-723a93d6ce74?w=500&h=700&fit=crop&q=80',
    descriptionKey: 'brunetteDescription',
    systemPromptKey: 'brunetteSystem',
    gender: 'female',
    button3Key: 'realGirl',
  },
  {
    id: 'blonde',
    nameKey: 'blondeName',
    image: 'https://images.unsplash.com/photo-1512310604669-443f26c35f52?w=500&h=700&fit=crop&q=80',
    descriptionKey: 'blondeDescription',
    systemPromptKey: 'blondeSystem',
    gender: 'female',
    button3Key: 'realGirl',
  },
  {
    id: 'alpha',
    nameKey: 'alphaName',
    image: 'https://images.unsplash.com/photo-1615109398623-88346a601842?w=500&h=700&fit=crop&q=80',
    descriptionKey: 'alphaDescription',
    systemPromptKey: 'alphaSystem',
    gender: 'male',
    button3Key: 'realMan',
  },
  {
    id: 'gay',
    nameKey: 'gayName',
    image: 'https://images.unsplash.com/photo-1590086782957-93c06ef21604?w=500&h=700&fit=crop&q=80',
    descriptionKey: 'gayDescription',
    systemPromptKey: 'gaySystem',
    gender: 'male',
    button3Key: 'realMan', // Adjusted for consistency
  },
];

export const URLS = {
  aiModel: 'https://cjjadjb.offrsonline.com/s/b15112f66b53f',
  play: 'https://cjjadjb.postclck.com/s/d43a883703574',
  realDate: 'https://cjjadjb.datesoffrs365.com/s/58fd6ae4b8fb1',
};

export const TRIGGER_KEYWORDS = [
  'sex', 'naked', 'fuck', 'porn', 'intimate', 'pussy', 'dick', 'boobs', 'ass',
  'секс', 'голая', 'голый', 'трах', 'порно', 'интим', 'письку', 'член', 'сиськи', 'жопа',
  'desnudo', 'desnuda', 'porно', 'íntimo', 'coño', 'polla', 'tetas', 'culo',
  'nu', 'nue', 'baise', 'intime', 'chatte', 'bite', 'seins', 'cul',
  'nackt', 'ficken', 'porno', 'intim', 'muschi', 'schwanz', 'titten', 'arsch',
  '裸', 'セックス', 'ポルノ', '性的', 'おっぱい',
  '裸体', '性交', '色情', '亲密', '阴部', '阴茎', '乳房', '屁股',
  'nu', 'nua', 'sexo', 'íntimo', 'buceta', 'pau', 'peitos', 'bunda',
];