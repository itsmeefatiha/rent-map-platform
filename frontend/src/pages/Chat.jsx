import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { messagesApi } from '../api/messages';
import { useAuth } from '../context/AuthContext';

export const Chat = () => {
  const { otherUserId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
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

  useEffect(() => {
    if (user && otherUserId) {
      loadOtherUser();
      loadMessages();
    }
  }, [otherUserId, user?.id]);

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
    if (messages.length > 0 && user) {
      const unreadMessages = messages.filter(m => 
        !m.read && m.receiverId === parseInt(user.id)
      );
      
      if (unreadMessages.length > 0) {
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
      const conversations = await messagesApi.getConversations();
      const conversation = conversations.find(c => 
        c.senderId === parseInt(otherUserId) || c.receiverId === parseInt(otherUserId)
      );
      
      if (conversation) {
        const otherUserInfo = conversation.senderId === parseInt(otherUserId) 
          ? { id: conversation.senderId, name: conversation.senderName }
          : { id: conversation.receiverId, name: conversation.receiverName };
        setOtherUser(otherUserInfo);
      }
    } catch (error) {
      console.error('Failed to load other user:', error);
    }
  };

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

    const socket = new SockJS('http://localhost:8080/ws');
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        setConnected(true);
        const userId = user.id.toString();
        client.subscribe(`/user/${userId}/queue/messages`, (message) => {
          const messageData = JSON.parse(message.body);
          if (messageData.receiverId === parseInt(user.id) && 
              (messageData.senderId === parseInt(otherUserId) || messageData.receiverId === parseInt(otherUserId))) {
            setMessages(prev => {
              const exists = prev.find(m => m.id === messageData.id);
              if (exists) return prev;
              return [...prev, messageData].sort((a, b) => {
                return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
              });
            });
            scrollToBottom();
          }
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

    const messageContent = newMessage.trim();
    setNewMessage('');

    const tempId = `temp-${Date.now()}`;
    const tempMessage = {
      id: tempId,
      content: messageContent,
      senderId: parseInt(user.id),
      receiverId: parseInt(otherUserId),
      createdAt: new Date().toISOString(),
      read: false,
    };

    setMessages(prev => [...prev, tempMessage]);
    scrollToBottom();

    try {
      if (stompClient && stompClient.connected) {
        stompClient.publish({
          destination: '/app/chat.send',
          body: JSON.stringify({
            receiverId: parseInt(otherUserId),
            content: messageContent,
          }),
        });
      }

      const savedMessage = await messagesApi.sendMessage(parseInt(otherUserId), messageContent);
      setMessages(prev => prev.map(m => m.id === tempId ? savedMessage : m));
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => prev.filter(m => m.id !== tempId));
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

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
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

  if (!user) {
    return (
      <div className="min-h-screen bg-bg dark:bg-bg-dark py-8 flex items-center justify-center transition-colors duration-300">
        <div className="text-text-secondary dark:text-text-secondary-dark">Please log in to use chat</div>
      </div>
    );
  }

  const messageGroups = groupMessagesByDate(messages);
  const otherUserName = otherUser?.name || 'User';

  return (
    <div className="min-h-screen bg-bg dark:bg-bg-dark transition-colors duration-300">
      <div className="max-w-5xl mx-auto h-screen flex flex-col">
        <div className="bg-surface dark:bg-surface-dark border-b border-border dark:border-border-dark px-6 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate(-1)}
              className="md:hidden p-2 hover:bg-bg dark:hover:bg-bg-dark rounded-full transition-colors"
            >
              <svg className="w-6 h-6 text-text-secondary dark:text-text-secondary-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-semibold">
              {otherUserName[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary dark:text-text-primary-dark">{otherUserName}</h2>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${connected ? 'bg-secondary' : 'bg-text-secondary dark:bg-text-secondary-dark'}`}></div>
                <span className="text-xs text-text-secondary dark:text-text-secondary-dark">
                  {connected ? 'Active now' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto bg-bg dark:bg-bg-dark px-4 py-6 transition-colors duration-300"
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
                <p className="text-text-secondary dark:text-text-secondary-dark">No messages yet</p>
                <p className="text-sm text-text-secondary dark:text-text-secondary-dark mt-1 opacity-70">Start the conversation!</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messageGroups.map((group, groupIndex) => (
                <div key={groupIndex}>
                  <div className="flex items-center justify-center my-4">
                    <div className="bg-surface dark:bg-surface-dark px-3 py-1 rounded-full text-xs text-text-secondary dark:text-text-secondary-dark shadow-sm border border-border dark:border-border-dark">
                      {formatDate(group.messages[0].createdAt)}
                    </div>
                  </div>
                  {group.messages.map((message) => {
                    const isSender = message.senderId === parseInt(user.id);
                    const isTemp = message.id && message.id.toString().startsWith('temp-');
                    
                    if (isSender) {
                      return (
                        <div
                          key={message.id}
                          className="flex items-end justify-end mb-2 group"
                        >
                          <div className="flex items-end space-x-2 max-w-[75%]">
                            <div className="flex flex-col items-end">
                              <div
                                className={`px-4 py-2 rounded-2xl rounded-br-md ${
                                  isTemp ? 'opacity-70' : ''
                                } bg-primary text-white`}
                              >
                                <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                              </div>
                              <div className="flex items-center space-x-1 mt-1 px-1">
                                <span className="text-xs text-text-secondary dark:text-text-secondary-dark">
                                  {formatTime(message.createdAt)}
                                </span>
                                {message.read && (
                                  <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                            </div>
                            <div className="w-8 flex-shrink-0"></div>
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <div
                          key={message.id}
                          className="flex items-end justify-start mb-2 group"
                        >
                          <div className="flex items-end space-x-2 max-w-[75%]">
                            <div className="w-8 h-8 rounded-full bg-border dark:bg-border-dark flex items-center justify-center text-text-primary dark:text-text-primary-dark text-xs font-semibold flex-shrink-0">
                              {otherUserName[0]?.toUpperCase() || 'U'}
                            </div>
                            <div className="flex flex-col items-start">
                              <div
                                className={`px-4 py-2 rounded-2xl rounded-bl-md ${
                                  isTemp ? 'opacity-70' : ''
                                } bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark shadow-sm border border-border dark:border-border-dark`}
                              >
                                <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                              </div>
                              <div className="flex items-center space-x-1 mt-1 px-1">
                                <span className="text-xs text-text-secondary dark:text-text-secondary-dark">
                                  {formatTime(message.createdAt)}
                                </span>
                              </div>
                            </div>
                          </div>
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

        <div className="bg-surface dark:bg-surface-dark border-t border-border dark:border-border-dark px-4 py-3 transition-colors duration-300">
          <div className="flex items-end space-x-2">
            <div className="flex-1 bg-bg dark:bg-bg-dark rounded-3xl px-4 py-2 flex items-center border border-border dark:border-border-dark">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  handleTyping();
                }}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="flex-1 bg-transparent border-none outline-none text-text-primary dark:text-text-primary-dark placeholder-text-secondary dark:placeholder-text-secondary-dark text-sm"
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim()}
              className="w-10 h-10 rounded-full bg-primary hover:bg-primary-dark disabled:bg-text-secondary dark:disabled:bg-text-secondary-dark disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors flex-shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
