import React from 'react';
import { Persona } from '../types';
import LanguageSelector from './LanguageSelector';
import { translations } from '../localization/translations';

interface PersonaSelectionProps {
  personas: Persona[];
  onSelectPersona: (persona: Persona) => void;
  language: string;
  setLanguage: (language: string) => void;
}

const PersonaCard: React.FC<{ persona: Persona; onClick: () => void; language: string }> = ({ persona, onClick, language }) => {
  const t = translations[language as keyof typeof translations];
  // FIX: Cast name and description to string. The general translation type allows for string arrays,
  // but for persona names and descriptions, they are always single strings. This fixes the type error
  // where a 'string | string[]' was being passed to the `alt` prop which expects a 'string'.
  const name = t[persona.nameKey] as string;
  const description = t[persona.descriptionKey] as string;

  return (
    <div
      className="bg-gray-800 rounded-lg overflow-hidden cursor-pointer transform hover:scale-105 transition-transform duration-300 group"
      onClick={onClick}
    >
      <div className="relative">
        <img src={persona.image} alt={name} className="w-full h-80 object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-4">
          <h3 className="text-2xl font-bold text-white">{name}</h3>
          <p className="text-purple-300">{description}</p>
        </div>
      </div>
    </div>
  );
};


const PersonaSelection: React.FC<PersonaSelectionProps> = ({ personas, onSelectPersona, language, setLanguage }) => {
  return (
    <div className="flex flex-col items-center">
      <div className="w-full max-w-xs mb-8">
        <LanguageSelector selectedLanguage={language} onLanguageChange={setLanguage} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
        {personas.map((persona) => (
          <PersonaCard
            key={persona.id}
            persona={persona}
            onClick={() => onSelectPersona(persona)}
            language={language}
          />
        ))}
      </div>
    </div>
  );
};

export default PersonaSelection;