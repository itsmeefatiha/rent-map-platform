import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { parseVoiceText } from '../utils/voiceFilterParser';

export const VoiceFilter = ({ onFiltersExtracted, onError }) => {
  const { t, i18n } = useTranslation();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef(null);
  const timeoutRef = useRef(null);
  const finalTranscriptRef = useRef('');

  // Callback stable pour extraire les filtres
  const handleFiltersExtracted = useCallback((text) => {
    console.log('[VoiceFilter] handleFiltersExtracted appelé avec:', text);
    console.log('[VoiceFilter] Langue actuelle:', i18n.language);
    
    const filters = parseVoiceText(text, i18n.language);
    console.log('[VoiceFilter] Filtres retournés par parseVoiceText:', filters);
    
    if (Object.keys(filters).length > 0) {
      console.log('[VoiceFilter] ✓ Filtres trouvés, appel de onFiltersExtracted');
      if (onFiltersExtracted) {
        onFiltersExtracted(filters);
      } else {
        console.log('[VoiceFilter] ⚠ onFiltersExtracted n\'est pas défini!');
      }
    } else {
      console.log('[VoiceFilter] ✗ Aucun filtre extrait du texte:', text);
    }
  }, [onFiltersExtracted, i18n.language]);

  useEffect(() => {
    // Vérifier si l'API de reconnaissance vocale est supportée
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      const recognition = new SpeechRecognition();
      
      // Configuration de la reconnaissance vocale
      recognition.continuous = false; // Arrêter après une pause
      recognition.interimResults = true; // Afficher les résultats intermédiaires
      recognition.lang = i18n.language === 'ar' ? 'ar-MA' : i18n.language === 'fr' ? 'fr-FR' : 'en-US';
      recognition.maxAlternatives = 1;
      
      recognition.onstart = () => {
        setIsListening(true);
        setTranscript('');
        finalTranscriptRef.current = '';
      };
      
      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }
        
        if (finalTranscript) {
          finalTranscriptRef.current += finalTranscript;
        }
        
        const currentTranscript = finalTranscriptRef.current || interimTranscript;
        setTranscript(currentTranscript);
        
        // Si on a un résultat final, parser et appliquer les filtres
        if (finalTranscript) {
          const fullText = finalTranscriptRef.current.trim();
          console.log('[VoiceFilter] Texte final reconnu:', fullText);
          handleFiltersExtracted(fullText);
          // Arrêter l'écoute après avoir extrait les filtres
          recognition.stop();
        }
      };
      
      recognition.onerror = (event) => {
        console.error('Erreur de reconnaissance vocale:', event.error);
        setIsListening(false);
        
        let errorMessage = t('voiceFilter.errorGeneric');
        switch (event.error) {
          case 'no-speech':
            errorMessage = t('voiceFilter.errorNoSpeech');
            break;
          case 'audio-capture':
            errorMessage = t('voiceFilter.errorAudioCapture');
            break;
          case 'not-allowed':
            errorMessage = t('voiceFilter.errorNotAllowed');
            break;
          case 'network':
            errorMessage = t('voiceFilter.errorNetwork');
            break;
          default:
            errorMessage = t('voiceFilter.errorGeneric');
        }
        
        if (onError) {
          onError(errorMessage);
        }
      };
      
      recognition.onend = () => {
        setIsListening(false);
        
        // Si on a un transcript mais pas de filtres extraits, essayer quand même
        if (finalTranscriptRef.current && !finalTranscriptRef.current.includes('...')) {
          handleFiltersExtracted(finalTranscriptRef.current.trim());
        }
      };
      
      recognitionRef.current = recognition;
    } else {
      setIsSupported(false);
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [i18n.language, handleFiltersExtracted, onError, t]);

  const startListening = () => {
    if (!isSupported) {
      if (onError) {
        onError(t('voiceFilter.notSupported'));
      }
      return;
    }
    
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
        
        // Arrêter automatiquement après 10 secondes
        timeoutRef.current = setTimeout(() => {
          if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
          }
        }, 10000);
      } catch (error) {
        console.error('Erreur lors du démarrage de la reconnaissance:', error);
        if (onError) {
          onError(t('voiceFilter.errorStart'));
        }
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  if (!isSupported) {
    return (
      <div className="text-xs text-yellow-400 dark:text-yellow-300">
        {t('voiceFilter.notSupported')}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={isListening ? stopListening : startListening}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
          isListening
            ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
            : 'bg-white/20 hover:bg-white/30 text-white border border-white/30'
        }`}
        title={isListening ? t('voiceFilter.stopListening') : t('voiceFilter.startListening')}
      >
        {isListening ? (
          <>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h12v12H6z" />
            </svg>
            <span className="hidden sm:inline">{t('voiceFilter.stop')}</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
            <span className="hidden sm:inline">{t('voiceFilter.voiceSearch')}</span>
          </>
        )}
      </button>
      
      {isListening && (
        <div className="flex items-center gap-2 text-white text-sm">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          <span className="text-xs">{t('voiceFilter.listening')}</span>
        </div>
      )}
      
      {transcript && !isListening && (
        <div className="text-xs text-white/80 italic max-w-xs truncate" title={transcript}>
          "{transcript}"
        </div>
      )}
    </div>
  );
};

