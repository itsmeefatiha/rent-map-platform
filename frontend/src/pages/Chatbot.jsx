import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { chatbotApi } from '../api/chatbot';
import { messagesApi } from '../api/messages';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export const Chatbot = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { currentLanguage } = useLanguage();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const [chatbotUserId, setChatbotUserId] = useState(null);

  useEffect(() => {
    // Wait for authentication to finish loading
    if (authLoading) {
      return;
    }

    if (!user) {
      navigate('/login');
      return;
    }

    if (user.role !== 'TENANT') {
      navigate('/');
      return;
    }

    const initialize = async () => {
      const id = await loadChatbotUserId();
      if (id) {
        setChatbotUserId(id);
        await loadMessages(id);
      } else {
        setLoading(false);
      }
    };

    initialize();
  }, [user, authLoading]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChatbotUserId = async () => {
    try {
      const id = await chatbotApi.getChatbotUserId();
      setChatbotUserId(id);
      return id;
    } catch (error) {
      console.error('Failed to load chatbot user ID:', error);
      return null;
    }
  };

  const loadMessages = async (chatbotId) => {
    if (!chatbotId) {
      setLoading(false);
      return;
    }

    try {
      const data = await messagesApi.getConversation(chatbotId);
      if (data && Array.isArray(data)) {
        const sortedMessages = [...data].sort((a, b) => {
          const timeA = new Date(a.createdAt).getTime();
          const timeB = new Date(b.createdAt).getTime();
          return timeA - timeB;
        });
        setMessages(sortedMessages);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;
    
    // Ensure chatbot user ID is loaded
    let chatbotId = chatbotUserId;
    if (!chatbotId) {
      chatbotId = await loadChatbotUserId();
      if (!chatbotId) {
        console.error('Chatbot user ID not available');
        return;
      }
      setChatbotUserId(chatbotId);
    }

    const messageContent = newMessage.trim();
    setNewMessage('');
    setSending(true);

    // Add user message immediately
    const userMessage = {
      id: `temp-user-${Date.now()}`,
      content: messageContent,
      senderId: parseInt(user.id),
      receiverId: chatbotId,
      createdAt: new Date().toISOString(),
      read: false,
    };

    setMessages(prev => [...prev, userMessage]);
    scrollToBottom();

    try {
      // Send to chatbot and get response
      // Get language code (fr, en, ar)
      const langCode = currentLanguage?.split('-')[0] || 'fr';
      const chatbotResponse = await chatbotApi.sendMessage(messageContent, langCode);
      
      // Update messages with chatbot response
      setMessages(prev => {
        // Remove temp message and add both messages
        const filtered = prev.filter(m => !m.id.toString().startsWith('temp-'));
        return [...filtered, userMessage, chatbotResponse].sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      });
      
      scrollToBottom();
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove temp message on error
      setMessages(prev => prev.filter(m => m.id !== userMessage.id));
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return t('chat.justNow');
    if (minutes < 60) return t('chat.minutesAgo', { count: minutes });
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('fr-FR', { hour: 'numeric', minute: '2-digit' });
    }
    return date.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  const renderMessageContent = (content) => {
    if (!content) return content;
    
    // Parse property links in format: [text](PROPERTY:ID)
    const propertyLinkRegex = /\[([^\]]+)\]\(PROPERTY:(\d+)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = propertyLinkRegex.exec(content)) !== null) {
      // Add text before the link
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: content.substring(lastIndex, match.index)
        });
      }
      
      // Add the link
      parts.push({
        type: 'link',
        text: match[1],
        propertyId: match[2]
      });
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        content: content.substring(lastIndex)
      });
    }
    
    // If no links found, return original content
    if (parts.length === 0) {
      return content;
    }
    
    // Render parts with links
    return (
      <>
        {parts.map((part, index) => {
          if (part.type === 'link') {
            return (
              <Link
                key={index}
                to={`/properties/${part.propertyId}`}
                className="inline-flex items-center space-x-1.5 mt-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg border border-blue-200 dark:border-blue-800 font-medium transition-colors"
                onClick={() => {
                  // Scroll to top when navigating
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                <span>{part.text}</span>
              </Link>
            );
          }
          return <span key={index}>{part.content}</span>;
        })}
      </>
    );
  };

  // Show loading state while authentication is being checked
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'TENANT') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <span className="text-3xl">🤖</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {t('chat.virtualAssistant')}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {t('chat.yourIntelligentAssistant')}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">{t('chat.online')}</span>
          </div>
        </div>

        {/* Chat Container */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
          {/* Messages Area */}
          <div
            className="h-[600px] overflow-y-auto px-6 py-4 space-y-4"
            style={{
              backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(147, 51, 234, 0.05) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(236, 72, 153, 0.05) 0%, transparent 50%)'
            }}
          >
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">{t('chat.loadingMessages')}</p>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center max-w-md">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center">
                    <span className="text-4xl">💬</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {t('chat.welcome')}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {t('chat.chatbotIntro')}
                  </p>
                  <div className="text-left space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center space-x-2">
                      <span>🔍</span>
                      <span>{t('chat.searchProperties')}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span>💰</span>
                      <span>{t('chat.priceInfo')}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span>📍</span>
                      <span>{t('chat.regionGuide')}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span>💡</span>
                      <span>{t('chat.personalizedAdvice')}</span>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mt-4">
                    {t('chat.askQuestion')}
                  </p>
                </div>
              </div>
            ) : (
              <>
                {messages.map((message) => {
                  const isUser = message.senderId === parseInt(user.id);
                  const isTemp = message.id && message.id.toString().startsWith('temp-');

                  return (
                    <div
                      key={message.id}
                      className={`flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
                    >
                      {/* Avatar */}
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                        isUser
                          ? 'bg-blue-500'
                          : 'bg-gradient-to-br from-purple-500 to-pink-500'
                      }`}>
                        {isUser ? (
                          <span className="text-white font-semibold text-sm">
                            {user.firstName?.[0]?.toUpperCase() || 'U'}
                          </span>
                        ) : (
                          <span className="text-xl">🤖</span>
                        )}
                      </div>

                      {/* Message Bubble */}
                      <div className={`flex-1 max-w-[75%] ${isUser ? 'flex flex-col items-end' : 'flex flex-col items-start'}`}>
                        <div
                          className={`px-4 py-3 rounded-2xl ${
                            isUser
                              ? 'bg-blue-500 text-white rounded-br-sm'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-sm'
                          } ${isTemp ? 'opacity-70' : ''}`}
                        >
                          <div className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                            {renderMessageContent(message.content)}
                          </div>
                        </div>
                        <span className={`text-xs text-gray-500 dark:text-gray-400 mt-1 px-2 ${
                          isUser ? 'text-right' : 'text-left'
                        }`}>
                          {formatTime(message.createdAt)}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {sending && (
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <span className="text-xl">🤖</span>
                    </div>
                    <div className="flex-1">
                      <div className="bg-gray-100 dark:bg-gray-700 px-4 py-3 rounded-2xl rounded-bl-sm">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-900">
            <div className="flex items-end space-x-3">
              <div className="flex-1 bg-white dark:bg-gray-800 rounded-full px-5 py-3 flex items-center border border-gray-200 dark:border-gray-700 shadow-sm">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={t('chat.askYourQuestion')}
                  disabled={sending || loading}
                  className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm"
                />
              </div>
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim() || sending || loading}
                className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all shadow-lg hover:shadow-xl disabled:shadow-none flex-shrink-0"
              >
                {sending ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
              {t('chat.pressEnterToSend')}
            </p>
          </div>
        </div>

         {/* Quick Actions */}
         <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
           <button
             onClick={() => setNewMessage(t('chat.searchPropertiesExample'))}
             className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow text-left border border-gray-200 dark:border-gray-700"
           >
             <div>
               <p className="font-semibold text-gray-900 dark:text-white">{t('chat.search')}</p>
               <p className="text-sm text-gray-600 dark:text-gray-400">{t('chat.findProperties')}</p>
             </div>
           </button>
           <button
             onClick={() => setNewMessage(t('chat.averagePriceQuestion'))}
             className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow text-left border border-gray-200 dark:border-gray-700"
           >
             <div>
               <p className="font-semibold text-gray-900 dark:text-white">{t('chat.price')}</p>
               <p className="text-sm text-gray-600 dark:text-gray-400">{t('chat.priceInformation')}</p>
             </div>
           </button>
           <button
             onClick={() => setNewMessage(t('chat.giveAdviceQuestion'))}
             className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow text-left border border-gray-200 dark:border-gray-700"
           >
             <div>
               <p className="font-semibold text-gray-900 dark:text-white">{t('chat.advice')}</p>
               <p className="text-sm text-gray-600 dark:text-gray-400">{t('chat.personalizedTips')}</p>
             </div>
           </button>
         </div>
      </div>
    </div>
  );
};

