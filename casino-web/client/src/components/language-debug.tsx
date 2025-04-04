import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';

export function LanguageDebug() {
  const { i18n } = useTranslation();
  const [languageInfo, setLanguageInfo] = useState({
    current: i18n.language,
    stored: localStorage.getItem('i18nextLng') || 'none',
    forced: localStorage.getItem('forceLang') || 'none'
  });
  
  useEffect(() => {
    const interval = setInterval(() => {
      setLanguageInfo({
        current: i18n.language,
        stored: localStorage.getItem('i18nextLng') || 'none',
        forced: localStorage.getItem('forceLang') || 'none'
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [i18n.language]);
  
  return (
    <div className="fixed top-0 right-0 bg-black/50 text-white p-2 z-50 text-xs">
      <div><strong>i18n:</strong> {languageInfo.current}</div>
      <div><strong>Stored:</strong> {languageInfo.stored}</div>
      <div><strong>Forced:</strong> {languageInfo.forced}</div>
      <button 
        onClick={() => {
          localStorage.removeItem('i18nextLng');
          localStorage.removeItem('forceLang');
          window.location.reload();
        }}
        className="mt-1 bg-red-500 text-white px-2 py-1 text-xs rounded"
      >
        Reset Lang
      </button>
    </div>
  );
}