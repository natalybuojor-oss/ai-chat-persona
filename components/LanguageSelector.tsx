import React from 'react';
import { LANGUAGES } from '../constants';

interface LanguageSelectorProps {
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ selectedLanguage, onLanguageChange }) => {
  return (
    <div>
      <label htmlFor="language-select" className="sr-only">Select Language</label>
      <select
        id="language-select"
        value={selectedLanguage}
        onChange={(e) => onLanguageChange(e.target.value)}
        className="w-full bg-gray-700 text-white p-3 rounded-md border-2 border-gray-600 focus:outline-none focus:border-purple-500 transition-colors"
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSelector;