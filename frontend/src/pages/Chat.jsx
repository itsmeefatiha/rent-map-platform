import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { messagesApi } from '../api/messages';
import { chatbotApi } from '../api/chatbot';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { VoiceMessagePlayer } from '../components/VoiceMessagePlayer';

export const Chat = () => {
  const { t } = useTranslation();
  const { otherUserId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { currentLanguage } = useLanguage();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [stompClient, setStompClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [otherUser, setOtherUser] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const messagesEndRef = useRef(null);
  const clientRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showMessageMenu, setShowMessageMenu] = useState(null);
  const [sendingStatus, setSendingStatus] = useState({}); // Track sending status per message
  const [showReactionPicker, setShowReactionPicker] = useState(null);
  const [hoveredMessage, setHoveredMessage] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  
  // Sidebar state
  const [conversations, setConversations] = useState([]);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [chatbotUserId, setChatbotUserId] = useState(null);
  const [isChatbot, setIsChatbot] = useState(false);

  useEffect(() => {
    if (user && otherUserId) {
      loadOtherUser();
      loadMessages();
    }
  }, [otherUserId, user?.id]);

  useEffect(() => {
    if (user) {
      loadConversations();
      // Load chatbot user ID for tenants
      if (user.role === 'TENANT') {
        loadChatbotUserId();
      }
      // Refresh conversations periodically
      const interval = setInterval(loadConversations, 10000);
      return () => clearInterval(interval);
    }
  }, [user, otherUserId]);

  useEffect(() => {
    // Check if current conversation is with chatbot
    if (otherUserId && chatbotUserId && parseInt(otherUserId) === chatbotUserId) {
      setIsChatbot(true);
    } else {
      setIsChatbot(false);
    }
  }, [otherUserId, chatbotUserId]);

  const loadChatbotUserId = async () => {
    try {
      const id = await chatbotApi.getChatbotUserId();
      setChatbotUserId(id);
    } catch (error) {
      console.error('Failed to load chatbot user ID:', error);
    }
  };

  useEffect(() => {
    if (user && user.id) {
      connectWebSocket();
    }

    return () => {
      disconnectWebSocket();
    };
  }, [user?.id, otherUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Mark messages as read when conversation is opened
    if (messages.length > 0 && user && otherUserId) {
      const unreadMessages = messages.filter(m => 
        !m.read && m.receiverId === parseInt(user.id)
      );
      
      if (unreadMessages.length > 0) {
        // Mark each unread message individually
        unreadMessages.forEach(message => {
          if (message.id && !message.id.toString().startsWith('temp-')) {
            messagesApi.markAsRead(message.id).catch(console.error);
          }
        });
        // Also mark conversation as read
        messagesApi.markConversationAsRead(otherUserId).catch(console.error);
      }
    }
  }, [messages, user, otherUserId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const loadOtherUser = async () => {
    try {
      // Check if it's the chatbot
      if (chatbotUserId && parseInt(otherUserId) === chatbotUserId) {
        setOtherUser({ id: chatbotUserId, name: t('chat.virtualAssistant') });
        return;
      }
      
      const conversations = await messagesApi.getConversations();
      const conversation = conversations.find(c => 
        c.senderId === parseInt(otherUserId) || c.receiverId === parseInt(otherUserId)
      );
      
      if (conversation) {
        const otherUserInfo = conversation.senderId === parseInt(otherUserId) 
          ? { id: conversation.senderId, name: conversation.senderName }
          : { id: conversation.receiverId, name: conversation.receiverName };
        setOtherUser(otherUserInfo);
      } else if (chatbotUserId && parseInt(otherUserId) === chatbotUserId) {
        // Fallback for chatbot
        setOtherUser({ id: chatbotUserId, name: t('chat.virtualAssistant') });
      }
    } catch (error) {
      console.error('Failed to load other user:', error);
    }
  };

  const loadConversations = async () => {
    if (!user) return;
    
    setConversationsLoading(true);
    try {
      const data = await messagesApi.getConversations();
      
      // Get unread counts for each conversation
      const formatted = await Promise.all(
        data.map(async (msg) => {
          const partnerId = msg.senderId === parseInt(user.id) ? msg.receiverId : msg.senderId;
          const partnerName = msg.senderId === parseInt(user.id) ? msg.receiverName : msg.senderName;
          
          // Get unread count for this conversation
          let unreadCount = 0;
          try {
            unreadCount = await messagesApi.getUnreadCountForConversation(partnerId);
          } catch (error) {
            console.error('Failed to load unread count for conversation:', error);
          }
          
          return {
            partnerId,
            partnerName,
            lastMessage: msg.content,
            lastMessageTime: msg.createdAt,
            unreadCount: unreadCount || 0,
            unread: unreadCount > 0,
            isChatbot: partnerId === chatbotUserId,
          };
        })
      );
      
      // Add chatbot conversation for tenants if it doesn't exist
      if (user.role === 'TENANT' && chatbotUserId) {
        const hasChatbotConversation = formatted.some(c => c.partnerId === chatbotUserId);
        if (!hasChatbotConversation) {
          formatted.unshift({
            partnerId: chatbotUserId,
            partnerName: t('chat.virtualAssistant'),
            lastMessage: t('chat.chatbotWelcomeMessage'),
            lastMessageTime: new Date().toISOString(),
            unreadCount: 0,
            unread: false,
            isChatbot: true,
          });
        }
      }
      
      // Sort by last message time (most recent first)
      formatted.sort((a, b) => {
        const timeA = new Date(a.lastMessageTime).getTime();
        const timeB = new Date(b.lastMessageTime).getTime();
        return timeB - timeA;
      });
      
      setConversations(formatted);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setConversationsLoading(false);
    }
  };

  const formatConversationTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return t('chat.justNow');
    if (minutes < 60) return t('chat.minutesAgo', { count: minutes });
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const filteredConversations = conversations.filter(conv =>
    conv.partnerName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const loadMessages = async () => {
    if (!user || !otherUserId) return;
    
    setLoading(true);
    try {
      const data = await messagesApi.getConversation(otherUserId);
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

  const connectWebSocket = () => {
    if (clientRef.current?.connected) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found, cannot connect to WebSocket');
      return;
    }

    const socket = new SockJS('http://localhost:8080/ws/chat');
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      onConnect: () => {
        setConnected(true);
        const userId = user.id.toString();
        client.subscribe(`/user/${userId}/queue/messages`, (message) => {
          const messageData = JSON.parse(message.body);
          // Check if message is for this conversation
          const isForThisConversation = 
            (messageData.receiverId === parseInt(user.id) && messageData.senderId === parseInt(otherUserId)) ||
            (messageData.senderId === parseInt(user.id) && messageData.receiverId === parseInt(otherUserId));
          
          if (isForThisConversation) {
            setMessages(prev => {
              // Check if message already exists by ID
              const existsById = prev.find(m => m.id === messageData.id);
              if (existsById) return prev;
              
              // Check if there's a temp message with same content from same sender (within 2 seconds)
              const tempMessage = prev.find(m => 
                m.id && m.id.toString().startsWith('temp-') && 
                m.content === messageData.content && 
                m.senderId === messageData.senderId &&
                Math.abs(new Date(m.createdAt).getTime() - new Date(messageData.createdAt).getTime()) < 2000
              );
              
              if (tempMessage) {
                // Replace temp message with saved message
                return prev.map(m => m.id === tempMessage.id ? messageData : m)
                  .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
              }
              
              // Add new message
              return [...prev, messageData].sort((a, b) => 
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
              );
            });
            scrollToBottom();
          }
          
          // Update conversations list when receiving any message
          loadConversations();
        });

        client.subscribe(`/user/${userId}/queue/typing`, (message) => {
          const typingData = JSON.parse(message.body);
          if (typingData.userId === parseInt(otherUserId)) {
            setIsTyping(typingData.typing);
            if (typingData.typing) {
              if (typingTimeout) {
                clearTimeout(typingTimeout);
              }
              const timeout = setTimeout(() => setIsTyping(false), 3000);
              setTypingTimeout(timeout);
            }
          }
        });
      },
      onDisconnect: () => {
        setConnected(false);
      },
      onStompError: (frame) => {
        console.error('WebSocket error:', frame);
        setConnected(false);
      },
    });

    client.activate();
    clientRef.current = client;
    setStompClient(client);
  };

  const disconnectWebSocket = () => {
    if (clientRef.current) {
      clientRef.current.deactivate();
      clientRef.current = null;
    }
    setStompClient(null);
    setConnected(false);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !otherUserId) return;

    let messageContent = newMessage.trim();
    
    // Add reply prefix if replying to a message
    if (replyingTo) {
      const replyPrefix = `${t('chat.replyingTo')}: ${replyingTo.senderName || t('chat.user')}\n"${replyingTo.content?.substring(0, 50)}${replyingTo.content?.length > 50 ? '...' : ''}"\n\n`;
      messageContent = replyPrefix + messageContent;
    }
    
    setNewMessage('');
    setReplyingTo(null);

    const tempId = `temp-${Date.now()}`;
    const tempMessage = {
      id: tempId,
      content: messageContent,
      senderId: parseInt(user.id),
      receiverId: parseInt(otherUserId),
      createdAt: new Date().toISOString(),
      read: false,
      replyingTo: replyingTo,
    };

    setMessages(prev => [...prev, tempMessage]);
    setSendingStatus(prev => ({ ...prev, [tempId]: 'sending' }));
    scrollToBottom();

    try {
      // If chatting with chatbot, use chatbot API
      if (isChatbot && user.role === 'TENANT') {
        // Get language code (fr, en, ar)
        const langCode = currentLanguage?.split('-')[0] || 'fr';
        const chatbotResponse = await chatbotApi.sendMessage(messageContent, langCode);
        // Remove temp message and add both user message and chatbot response
        setMessages(prev => {
          const filtered = prev.filter(m => m.id !== tempId);
          // Add user message
          const userMessage = {
            ...tempMessage,
            id: `user-${Date.now()}`,
          };
          // Add chatbot response
          return [...filtered, userMessage, chatbotResponse].sort((a, b) => 
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        });
        setSendingStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus[tempId];
          return newStatus;
        });
        loadConversations();
        return;
      }

      // Normal message sending
      if (stompClient && stompClient.connected) {
        // Send via WebSocket - backend will save and broadcast to both users
        // The saved message will replace the temp message when received via WebSocket
        stompClient.publish({
          destination: '/app/chat.send',
          body: JSON.stringify({
            receiverId: parseInt(otherUserId),
            content: messageContent,
          }),
        });
        // Status will be updated when message is received via WebSocket
      } else {
        // Fallback to REST API if WebSocket not connected
        const savedMessage = await messagesApi.sendMessage(parseInt(otherUserId), messageContent);
        setMessages(prev => prev.map(m => m.id === tempId ? savedMessage : m));
        setSendingStatus(prev => ({ ...prev, [tempId]: 'sent' }));
        setTimeout(() => {
          setSendingStatus(prev => {
            const newStatus = { ...prev };
            delete newStatus[tempId];
            return newStatus;
          });
        }, 2000);
      }
      
      // Update conversations list after sending message
      loadConversations();
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setSendingStatus(prev => {
        const newStatus = { ...prev };
        delete newStatus[tempId];
        return newStatus;
      });
    }
  };


  const handleTyping = useCallback(() => {
    if (stompClient && stompClient.connected) {
      stompClient.publish({
        destination: '/app/chat.typing',
        body: JSON.stringify({
          receiverId: parseInt(otherUserId),
          typing: true,
        }),
      });
    }
  }, [stompClient, otherUserId]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file || !user || !otherUserId) return;

    // Determine file type
    const fileType = file.type;
    let messageType = 'FILE';
    if (fileType.startsWith('image/')) {
      messageType = 'IMAGE';
    } else if (fileType.startsWith('video/')) {
      messageType = 'VIDEO';
    } else if (fileType.startsWith('audio/')) {
      messageType = 'AUDIO';
    }

    const tempId = `temp-${Date.now()}`;
    const tempMessage = {
      id: tempId,
      content: file.name,
      fileUrl: URL.createObjectURL(file),
      messageType: messageType,
      senderId: parseInt(user.id),
      receiverId: parseInt(otherUserId),
      createdAt: new Date().toISOString(),
      read: false,
    };

    setMessages(prev => [...prev, tempMessage]);
    scrollToBottom();

    try {
      const savedMessage = await messagesApi.sendFile(parseInt(otherUserId), file, file.name);
      setMessages(prev => prev.map(m => m.id === tempId ? savedMessage : m));
      loadConversations();
    } catch (error) {
      console.error('Failed to send file:', error);
      setMessages(prev => prev.filter(m => m.id !== tempId));
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        await sendVoiceMessage(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setAudioChunks(chunks);
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Microphone access denied. Please allow microphone access to send voice messages.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const sendVoiceMessage = async (audioBlob) => {
    if (!user || !otherUserId) return;

    const tempId = `temp-${Date.now()}`;
    const tempMessage = {
      id: tempId,
      content: 'Voice message',
      fileUrl: URL.createObjectURL(audioBlob),
      messageType: 'VOICE',
      senderId: parseInt(user.id),
      receiverId: parseInt(otherUserId),
      createdAt: new Date().toISOString(),
      read: false,
    };

    setMessages(prev => [...prev, tempMessage]);
    scrollToBottom();

    try {
      const savedMessage = await messagesApi.sendVoice(parseInt(otherUserId), audioBlob);
      setMessages(prev => prev.map(m => m.id === tempId ? savedMessage : m));
      loadConversations();
    } catch (error) {
      console.error('Failed to send voice message:', error);
      setMessages(prev => prev.filter(m => m.id !== tempId));
    }
  };

  const addReaction = async (messageId, emoji) => {
    if (!user || !messageId) return;

    try {
      await messagesApi.addReaction(messageId, emoji);
      // Update message reactions in state
      setMessages(prev => prev.map(m => {
        if (m.id === messageId) {
          const reactions = m.reactions || {};
          const currentCount = reactions[emoji] || 0;
          return {
            ...m,
            reactions: {
              ...reactions,
              [emoji]: currentCount + 1
            }
          };
        }
        return m;
      }));
    } catch (error) {
      console.error('Failed to add reaction:', error);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return t('common.justNow');
    if (minutes < 60) return `${minutes}m ${t('chat.ago')}`;
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  const formatFullDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return t('chat.today');
    } else if (date.toDateString() === yesterday.toDateString()) {
      return t('chat.yesterday');
    } else {
      return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }
  };

  const groupMessagesByDate = (messages) => {
    const groups = [];
    let currentDate = null;
    let currentGroup = [];

    messages.forEach((message, index) => {
      const messageDate = new Date(message.createdAt).toDateString();
      
      if (messageDate !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({ date: currentDate, messages: currentGroup });
        }
        currentDate = messageDate;
        currentGroup = [message];
      } else {
        currentGroup.push(message);
      }

      if (index === messages.length - 1) {
        groups.push({ date: currentDate, messages: currentGroup });
      }
    });

    return groups;
  };

  // Show loading state while authentication is being checked
  if (authLoading) {
    return (
      <div className="min-h-screen bg-bg dark:bg-bg-dark py-8 flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-text-secondary dark:text-text-secondary-dark">{t('common.loading') || 'Chargement...'}</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-bg dark:bg-bg-dark py-8 flex items-center justify-center transition-colors duration-300">
        <div className="text-text-secondary dark:text-text-secondary-dark">{t('chat.pleaseLogInToUseChat')}</div>
      </div>
    );
  }

  const messageGroups = groupMessagesByDate(messages);
  const otherUserName = otherUser?.name || 'User';

  return (
    <div className="min-h-screen bg-bg dark:bg-bg-dark transition-colors duration-300">
      <div className="h-screen flex">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0 lg:border-r border-border dark:border-border-dark">
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate(-1)}
              className="md:hidden p-2 hover:bg-bg dark:hover:bg-bg-dark rounded-full transition-colors"
            >
              <svg className="w-6 h-6 text-text-secondary dark:text-text-secondary-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
              isChatbot ? 'bg-gradient-to-br from-purple-500 to-pink-500' : 'bg-primary'
            }`}>
              {isChatbot ? '🤖' : (otherUserName[0]?.toUpperCase() || 'U')}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-semibold text-text-primary dark:text-text-primary-dark">{otherUserName}</h2>
                {isChatbot && (
                  <span className="px-2 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
                    {t('chat.aiAssistant')}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${connected || isChatbot ? 'bg-secondary' : 'bg-text-secondary dark:bg-text-secondary-dark'}`}></div>
                <span className="text-xs text-text-secondary dark:text-text-secondary-dark">
                  {isChatbot ? t('chat.alwaysAvailable') : (connected ? t('chat.activeNow') : t('chat.offline'))}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 px-4 py-4 transition-colors duration-300"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.05) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(147, 51, 234, 0.05) 0%, transparent 50%)' }}
        >
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-border dark:bg-border-dark flex items-center justify-center">
                  <svg className="w-8 h-8 text-text-secondary dark:text-text-secondary-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-text-secondary dark:text-text-secondary-dark">{t('chat.messages')}</p>
                <p className="text-sm text-text-secondary dark:text-text-secondary-dark mt-1 opacity-70">{t('chat.typeMessage')}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messageGroups.map((group, groupIndex) => (
                <div key={groupIndex}>
                  <div className="flex items-center justify-center my-6">
                    <div className="bg-white dark:bg-gray-800 px-4 py-1.5 rounded-full text-xs text-gray-500 dark:text-gray-400 shadow-sm border border-gray-200 dark:border-gray-700">
                      {formatDate(group.messages[0].createdAt)}
                    </div>
                  </div>
                  {group.messages.map((message) => {
                    const isSender = message.senderId === parseInt(user.id);
                    const isTemp = message.id && message.id.toString().startsWith('temp-');
                    const isFile = message.messageType === 'FILE' || message.messageType === 'IMAGE' || message.messageType === 'VIDEO' || message.messageType === 'AUDIO';
                    const isVoice = message.messageType === 'VOICE';
                    const isImage = message.messageType === 'IMAGE';
                    const isVideo = message.messageType === 'VIDEO';
                    const fileUrl = message.fileUrl ? (
                      message.fileUrl.startsWith('http://') || message.fileUrl.startsWith('https://') || message.fileUrl.startsWith('blob:')
                        ? message.fileUrl 
                        : `http://localhost:8080${message.fileUrl}`
                    ) : null;
                    const isReply = message.replyingTo || (message.content && message.content.startsWith('Replying to:'));
                    
                    if (isSender) {
                      const sendingState = sendingStatus[message.id];
                      return (
                        <div
                          key={message.id}
                          className="flex items-end justify-end mb-1 group relative"
                          onMouseEnter={() => setHoveredMessage(message.id)}
                          onMouseLeave={() => setHoveredMessage(null)}
                        >
                          <div className="flex items-end space-x-1.5 max-w-[70%] sm:max-w-[65%]">
                            <div className="flex flex-col items-end flex-1">
                              <div className="flex items-center space-x-2">
                                <div
                                  className={`px-3.5 py-2 rounded-2xl rounded-br-sm transition-all duration-300 shadow-sm ${
                                    isTemp ? 'opacity-70 animate-pulse' : sendingState === 'sending' ? 'opacity-80' : 'opacity-100'
                                } ${isFile || isVoice ? 'p-0 bg-gray-100 dark:bg-gray-700 rounded-2xl' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                              >
                                {isVoice ? (
                                  <VoiceMessagePlayer 
                                    audioUrl={fileUrl || ''} 
                                    duration={null}
                                  />
                                ) : isImage && fileUrl ? (
                                  <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="block">
                                    <img src={fileUrl} alt={message.content} className="max-w-xs max-h-64 rounded-lg" />
                                  </a>
                                ) : isVideo && fileUrl ? (
                                  <div className="max-w-xs">
                                    <video controls className="max-w-xs max-h-64 rounded-lg">
                                      <source src={fileUrl} type="video/mp4" />
                                      <source src={fileUrl} type="video/webm" />
                                      Your browser does not support the video tag.
                                    </video>
                                  </div>
                                ) : isFile && fileUrl ? (
                                  <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 p-2 text-white hover:bg-primary-dark rounded-lg">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <span className="text-sm">{message.content}</span>
                                  </a>
                                ) : (
                                  <div className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                                    {isReply && (
                                      <div className="mb-2 pl-3 border-l-2 border-blue-300 opacity-80 text-xs">
                                        {message.replyingTo ? (
                                          <>
                                            <div className="font-semibold">{message.replyingTo.senderName || 'User'}</div>
                                            <div className="truncate">{message.replyingTo.content?.substring(0, 50)}{message.replyingTo.content?.length > 50 ? '...' : ''}</div>
                                          </>
                                        ) : message.content.includes('Replying to:') ? (
                                          <div>{message.content.split('\n\n')[0]}</div>
                                        ) : null}
                                      </div>
                                    )}
                                    <p>{isReply ? message.content.split('\n\n').slice(1).join('\n\n') : message.content}</p>
                                  </div>
                                )}
                                </div>
                                
                                {/* Reactions display - Always visible next to message */}
                                {message.reactions && Object.keys(message.reactions).length > 0 && (
                                  <div className="flex items-center space-x-1 flex-wrap max-w-[100px]">
                                    {Object.entries(message.reactions).map(([emoji, count]) => (
                                      <button
                                        key={emoji}
                                        onClick={() => setShowReactionPicker(message.id)}
                                        className="text-xs bg-white dark:bg-gray-800 px-1.5 py-0.5 rounded-full border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                        title={`${emoji} ${count}`}
                                      >
                                        {emoji} {count}
                                      </button>
                                    ))}
                                  </div>
                                )}
                                
                                {/* Action Icons for All Messages */}
                                {hoveredMessage === message.id && !isTemp && (
                                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={() => {
                                        setShowReactionPicker(message.id);
                                      }}
                                      className="w-6 h-6 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-400 transition-colors"
                                      title={t('chat.react')}
                                    >
                                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a1 1 0 10-1.415-1.414 3 3 0 01-4.242 0 1 1 0 00-1.415 1.414 5 5 0 007.072 0z" clipRule="evenodd" />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={() => {
                                        setReplyingTo(message);
                                      }}
                                      className="w-6 h-6 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-400 transition-colors"
                                      title={t('chat.reply')}
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                      </svg>
                                    </button>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center space-x-1 mt-0.5 px-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-[10px] text-gray-500 dark:text-gray-400" title={formatFullDateTime(message.createdAt)}>
                                  {formatTime(message.createdAt)}
                                </span>
                                {sendingState === 'sending' ? (
                                  <div className="w-3 h-3 flex items-center justify-center">
                                    <div className="w-2.5 h-2.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  </div>
                                ) : message.read ? (
                                  <span className="text-blue-400 text-xs" title={t('chat.read')}>✔️✔️</span>
                                ) : sendingState === 'sent' ? (
                                  <span className="text-gray-300 text-xs" title={t('chat.sent')}>✔️</span>
                                ) : null}
                              </div>
                            </div>
                          </div>
                          
                          {/* Reaction Picker - Bar above message */}
                          {showReactionPicker === message.id && (
                            <div className="absolute bottom-full right-0 mb-2 bg-gray-100 dark:bg-gray-700 rounded-lg shadow-lg z-20 px-3 py-2 flex items-center space-x-2">
                              {['❤️', '😂', '😮', '😢', '😠', '👍'].map((emoji) => (
                                <button
                                  key={emoji}
                                  onClick={async () => {
                                    await addReaction(message.id, emoji);
                                    setShowReactionPicker(null);
                                  }}
                                  className="w-8 h-8 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center text-xl transition-transform hover:scale-125"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    } else {
                      return (
                        <div
                          key={message.id}
                          className="flex items-end justify-start mb-1 group relative"
                          onMouseEnter={() => setHoveredMessage(message.id)}
                          onMouseLeave={() => setHoveredMessage(null)}
                        >
                          <div className="flex items-end space-x-1.5 max-w-[70%] sm:max-w-[65%]">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 shadow-sm">
                              {otherUserName[0]?.toUpperCase() || 'U'}
                            </div>
                            <div className="flex flex-col items-start flex-1">
                              <div className="flex items-center space-x-2">
                                <div
                                  className={`px-3.5 py-2 rounded-2xl rounded-bl-sm shadow-sm ${
                                    isTemp ? 'opacity-70' : ''
                                  } ${isFile || isVoice ? 'p-0 bg-gray-100 dark:bg-gray-700 rounded-2xl' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'}`}
                                >
                                  {isVoice ? (
                                    <VoiceMessagePlayer 
                                      audioUrl={fileUrl || ''} 
                                      duration={null}
                                    />
                                  ) : isImage && fileUrl ? (
                                    <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="block">
                                      <img src={fileUrl} alt={message.content} className="max-w-xs max-h-64 rounded-lg" />
                                    </a>
                                  ) : isVideo && fileUrl ? (
                                    <div className="max-w-xs">
                                      <video controls className="max-w-xs max-h-64 rounded-lg">
                                        <source src={fileUrl} type="video/mp4" />
                                        <source src={fileUrl} type="video/webm" />
                                        {t('chat.browserNotSupportVideo')}
                                      </video>
                                    </div>
                                  ) : isFile && fileUrl ? (
                                    <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 p-2 text-text-primary dark:text-text-primary-dark hover:bg-bg dark:hover:bg-bg-dark rounded-lg">
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                      </svg>
                                      <span className="text-sm">{message.content}</span>
                                    </a>
                                  ) : (
                                    <div className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                                      {isReply && (
                                        <div className="mb-2 pl-3 border-l-2 border-gray-400 opacity-80 text-xs">
                                          {message.replyingTo ? (
                                            <>
                                              <div className="font-semibold">{message.replyingTo.senderName || t('chat.user')}</div>
                                              <div className="truncate">{message.replyingTo.content?.substring(0, 50)}{message.replyingTo.content?.length > 50 ? '...' : ''}</div>
                                            </>
                                          ) : message.content.includes('Replying to:') ? (
                                            <div>{message.content.split('\n\n')[0]}</div>
                                          ) : null}
                                        </div>
                                      )}
                                      <p>{isReply ? message.content.split('\n\n').slice(1).join('\n\n') : message.content}</p>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Reactions display - Always visible next to message */}
                                {message.reactions && Object.keys(message.reactions).length > 0 && (
                                  <div className="flex items-center space-x-1 flex-wrap max-w-[100px]">
                                    {Object.entries(message.reactions).map(([emoji, count]) => (
                                      <button
                                        key={emoji}
                                        onClick={() => setShowReactionPicker(message.id)}
                                        className="text-xs bg-white dark:bg-gray-800 px-1.5 py-0.5 rounded-full border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                        title={`${emoji} ${count}`}
                                      >
                                        {emoji} {count}
                                      </button>
                                    ))}
                                  </div>
                                )}
                                
                                {/* Action Icons for All Messages */}
                                {hoveredMessage === message.id && !isTemp && (
                                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={() => {
                                        setShowReactionPicker(message.id);
                                      }}
                                      className="w-6 h-6 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-400 transition-colors"
                                      title={t('chat.react')}
                                    >
                                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a1 1 0 10-1.415-1.414 3 3 0 01-4.242 0 1 1 0 00-1.415 1.414 5 5 0 007.072 0z" clipRule="evenodd" />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={() => {
                                        setReplyingTo(message);
                                      }}
                                      className="w-6 h-6 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-400 transition-colors"
                                      title={t('chat.reply')}
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                      </svg>
                                    </button>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center space-x-1 mt-0.5 px-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                  {formatTime(message.createdAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                          {/* Reaction Picker - Bar above message */}
                          {showReactionPicker === message.id && (
                            <div className="absolute bottom-full left-0 mb-2 bg-gray-100 dark:bg-gray-700 rounded-lg shadow-lg z-20 px-3 py-2 flex items-center space-x-2">
                              {['❤️', '😂', '😮', '😢', '😠', '👍'].map((emoji) => (
                                <button
                                  key={emoji}
                                  onClick={async () => {
                                    await addReaction(message.id, emoji);
                                    setShowReactionPicker(null);
                                  }}
                                  className="w-8 h-8 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center text-xl transition-transform hover:scale-125"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    }
                  })}
                </div>
              ))}
              
              {isTyping && (
                <div className="flex items-end space-x-2 mb-1">
                  <div className="w-8 h-8 rounded-full bg-border dark:bg-border-dark flex items-center justify-center text-text-primary dark:text-text-primary-dark text-xs font-semibold flex-shrink-0">
                    {otherUserName[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="bg-surface dark:bg-surface-dark px-4 py-2 rounded-2xl rounded-bl-md shadow-sm border border-border dark:border-border-dark">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-text-secondary dark:bg-text-secondary-dark rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-text-secondary dark:bg-text-secondary-dark rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-text-secondary dark:bg-text-secondary-dark rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>


        {/* Click outside to close menu */}
        {showReactionPicker && (
          <div
            className="fixed inset-0 z-10"
            onClick={() => {
              setShowReactionPicker(null);
            }}
          />
        )}

        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-3 transition-colors duration-300">
          {/* Reply Preview */}
          {replyingTo && (
            <div className="mb-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-between">
              <div className="flex-1">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">{t('chat.replyingTo')} {replyingTo.senderName || t('chat.user')}</div>
                <div className="text-sm text-gray-800 dark:text-gray-200 truncate">{replyingTo.content?.substring(0, 50)}{replyingTo.content?.length > 50 ? '...' : ''}</div>
              </div>
              <button
                onClick={() => setReplyingTo(null)}
                className="ml-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          <div className="flex items-end space-x-2">
            {/* File Upload Button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 flex items-center justify-center transition-colors flex-shrink-0"
              title={t('chat.sendFile')}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>

            {/* Voice Message Button */}
            {!isRecording ? (
              <button
                onClick={startRecording}
                className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 flex items-center justify-center transition-colors flex-shrink-0"
                title={t('chat.recordVoice')}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                </svg>
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors flex-shrink-0 animate-pulse"
                title={t('chat.stopRecording')}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 6h12v12H6z" />
                </svg>
              </button>
            )}

            <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full px-5 py-2.5 flex items-center">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  handleTyping();
                }}
                onKeyPress={handleKeyPress}
                placeholder={t('chat.typeMessage')}
                className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm"
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim()}
              className="w-9 h-9 rounded-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors flex-shrink-0 shadow-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
        </div>

        {/* Sidebar - Conversations List */}
        {/* eslint-disable-next-line no-conflicting-tailwind-classes */}
        <div className="hidden lg:flex lg:flex-col w-80 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          {/* Search Bar */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <input
                type="text"
                placeholder={t('chat.searchConversations')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-100 dark:bg-gray-700 border-none rounded-full px-4 py-2.5 pl-10 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <svg
                className="absolute left-3 top-3 w-5 h-5 text-gray-400 dark:text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {conversationsLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center">
                <svg className="w-12 h-12 mx-auto text-text-secondary dark:text-text-secondary-dark mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-text-secondary dark:text-text-secondary-dark text-sm">
                  {searchQuery ? t('chat.noConversationsFound') : t('chat.noConversations')}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border dark:divide-border-dark">
                {filteredConversations.map((conv) => {
                    const isActive = parseInt(otherUserId) === conv.partnerId;
                    const isChatbotConv = conv.isChatbot || conv.partnerId === chatbotUserId;
                  return (
                    <div
                      key={conv.partnerId}
                      onClick={() => navigate(`/chat/${conv.partnerId}`)}
                      className={`p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer ${
                        isActive ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' : ''
                      } ${conv.unread && !isActive ? 'bg-gray-50 dark:bg-gray-700/30' : ''}`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 relative">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${
                            isActive 
                              ? isChatbotConv ? 'bg-gradient-to-br from-purple-500 to-pink-500' : 'bg-blue-500'
                              : isChatbotConv ? 'bg-gradient-to-br from-purple-400 to-pink-400' : 'bg-gradient-to-br from-gray-400 to-gray-500'
                          }`}>
                            {isChatbotConv ? (
                              <span className="text-white text-lg">🤖</span>
                            ) : (
                              <span className="text-white font-semibold text-base">
                                {conv.partnerName?.[0]?.toUpperCase() || 'U'}
                              </span>
                            )}
                          </div>
                          {conv.unread && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-surface dark:border-surface-dark flex items-center justify-center">
                              <span className="text-white text-xs font-bold">
                                {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center space-x-2 flex-1 min-w-0">
                              <p className={`text-sm font-semibold truncate ${
                                conv.unread || isActive
                                  ? 'text-text-primary dark:text-text-primary-dark' 
                                  : 'text-text-secondary dark:text-text-secondary-dark'
                              }`}>
                                {conv.partnerName}
                              </p>
                              {isChatbotConv && (
                                <span className="px-1.5 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full flex-shrink-0">
                                  {t('chat.aiAssistant')}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-text-secondary dark:text-text-secondary-dark flex-shrink-0 ml-2">
                              {formatConversationTime(conv.lastMessageTime)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className={`text-sm truncate ${
                              conv.unread || isActive
                                ? 'text-text-primary dark:text-text-primary-dark font-medium' 
                                : 'text-text-secondary dark:text-text-secondary-dark'
                            }`}>
                              {conv.lastMessage}
                            </p>
                            {conv.unread && !isActive && (
                              <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 ml-2"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
