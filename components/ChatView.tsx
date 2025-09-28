import React, { useState, useEffect, useRef } from 'react';
import { Persona, ChatMessage } from '../types';
import { startChat, sendMessage } from '../services/geminiService';
import { TRIGGER_KEYWORDS, URLS } from '../constants';
import { translations } from '../localization/translations';
import type { Chat } from '@google/genai';


interface ChatViewProps {
  persona: Persona;
  onBack: () => void;
  language: string;
}

const ChatView: React.FC<ChatViewProps> = ({ persona, onBack, language }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const chatRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const t = translations[language as keyof typeof translations];
  const personaName = t[persona.nameKey] as string;

  const typeOutMessage = (fullText: string, messageId: string) => {
    let i = 0;
    const intervalId = setInterval(() => {
        i++;
        setMessages(prev => 
            prev.map(msg => 
                msg.id === messageId ? { ...msg, text: fullText.slice(0, i) } : msg
            )
        );
        
        if (i >= fullText.length) {
            clearInterval(intervalId);
            setIsLoading(false); 
        }
    }, 30); 

    return () => clearInterval(intervalId);
  };

  useEffect(() => {
    const generateInitialMessage = async () => {
      setMessages([]);
      setIsLoading(true);
      chatRef.current = startChat(persona, language);

      const initialPrompt = t.initialPrompt as string;
      const responseText = await sendMessage(persona, language, initialPrompt);
      
      const messageId = Date.now().toString();
      const initialMessage: ChatMessage = {
        id: messageId,
        text: '', 
        sender: 'ai',
      };
      setMessages([initialMessage]);
      typeOutMessage(responseText, messageId);
    };

    generateInitialMessage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persona, language]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, messages[messages.length - 1]?.text]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
    };
    setMessages((prev) => [...prev, userMessage]);
    const currentInputValue = inputValue;
    setInputValue('');
    setIsLoading(true);

    const hasTriggerKeyword = TRIGGER_KEYWORDS.some(keyword =>
      currentInputValue.toLowerCase().includes(keyword)
    );

    if (hasTriggerKeyword) {
      let triggerMessage: ChatMessage;

      if (persona.id === 'gay') {
        triggerMessage = {
          id: (Date.now() + 1).toString(),
          text: t.triggerMessageMale as string,
          sender: 'ai',
          isTriggerMessage: true,
          buttons: [
            { textKey: 'goToBtn', url: URLS.aiModel },
          ],
        };
      } else {
        triggerMessage = {
          id: (Date.now() + 1).toString(),
          text: (persona.gender === 'female' ? t.triggerMessageFemale : t.triggerMessageMale) as string,
          sender: 'ai',
          isTriggerMessage: true,
          buttons: [
            { textKey: 'aiModelBtn', url: URLS.aiModel },
            { textKey: 'playWithMeBtn', url: URLS.play },
            { textKey: persona.button3Key, url: URLS.realDate },
          ],
        };
      }
      
      setMessages((prev) => [...prev, triggerMessage]);
      setIsLoading(false);
      return;
    }

    // The chatRef check is no longer needed as the service is now stateless from the client's perspective.
    const responseText = await sendMessage(persona, language, currentInputValue);
    const aiMessageId = (Date.now() + 1).toString();
    const aiMessage: ChatMessage = {
      id: aiMessageId,
      text: '',
      sender: 'ai',
    };
    setMessages((prev) => [...prev, aiMessage]);
    typeOutMessage(responseText, aiMessageId);
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-xl flex flex-col h-[80vh] max-h-[700px]">
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <button onClick={onBack} className="text-purple-400 hover:text-purple-300">&larr; {t.back}</button>
        <h2 className="text-xl font-bold">{t.chatWith} {personaName}</h2>
        <div className="w-16"></div>
      </div>
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-2xl ${msg.sender === 'user' ? 'bg-purple-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none'}`}>
              <p className="whitespace-pre-wrap">{msg.text}</p>
               {msg.isTriggerMessage && msg.buttons && (
                <div className="mt-4 flex flex-col space-y-2">
                  {msg.buttons.map((btn, index) => (
                    <a
                      key={index}
                      href={btn.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-purple-500 text-white text-center px-4 py-2 rounded-lg hover:bg-purple-400 transition-colors"
                    >
                      {t[btn.textKey]}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (messages.length === 0 || messages[messages.length - 1]?.sender === 'user') && (
           <div className="flex justify-start">
             <div className="bg-gray-700 text-gray-200 p-3 rounded-2xl rounded-bl-none">
                <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse delay-200"></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse delay-400"></div>
                </div>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center bg-gray-700 rounded-full">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={t.typeMessage as string}
            className="flex-1 bg-transparent p-3 pl-5 focus:outline-none text-white"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputValue.trim()}
            className="bg-purple-600 text-white rounded-full p-3 m-1 hover:bg-purple-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatView;