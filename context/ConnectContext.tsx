import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { User, Channel, Message, ConnectState, SAMPLE_CHANNELS, SAMPLE_USERS } from '../types/connect';
import { SupabaseService } from '../services/supabaseService';

const ConnectContext = createContext<{
  state: ConnectState;
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  getChannelsForUser: (user: User) => Channel[];
  canUserAccessChannel: (user: User, channel: Channel) => boolean;
  canUserWriteToChannel: (user: User, channel: Channel) => boolean;
  addMessage: (channelId: string, message: Omit<Message, 'id' | 'timestamp' | 'status' | 'readBy'>) => void;
  deleteMessage: (messageId: string) => void;
  getMessagesForChannel: (channelId: string) => Message[];
  getOnlineUsers: () => User[];
  markUserOnline: (userId: string) => void;
  markUserOffline: (userId: string) => void;
  setTyping: (channelId: string, userId: string, isTyping: boolean) => void;
  getTypingUsers: (channelId: string) => User[];
  markMessageAsRead: (messageId: string, userId: string) => void;
  markChannelAsRead: (channelId: string, userId: string) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isLoading: boolean;
} | null>(null);

export const ConnectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<ConnectState>({
    currentUser: null,
    channels: [],
    messages: {},
    users: SAMPLE_USERS.reduce((acc, user) => ({ ...acc, [user.id]: user }), {}),
    directMessages: [],
    onlineUsers: [],
    notifications: {
      mentions: true,
      allMessages: false,
      channelUpdates: true,
      directMessages: true,
      soundEnabled: true
    },
    typingUsers: {}
  });

  const [isLoading, setIsLoading] = useState(false);
  const [subscriptions, setSubscriptions] = useState<{ [channelId: string]: any }>({});

  // Initialize user and load data
  useEffect(() => {
    const initializeUser = async () => {
      try {
        const authUser = await SupabaseService.getCurrentUser();
        if (authUser) {
          // Get user profile by email instead of ID
          const userProfile = await SupabaseService.getUserProfile(authUser.id);
          if (userProfile) {
            setCurrentUser(userProfile);
            await loadUserData(userProfile);
          } else {
            console.error('User profile not found in database');
          }
        }
      } catch (error) {
        console.error('Error initializing user:', error);
      }
    };

    initializeUser();
  }, []);

  const loadUserData = async (user: User) => {
    try {
      setIsLoading(true);
      
      // Load channels
      const channels = await SupabaseService.getChannelsForUser(user.id);
      setState(prev => ({ ...prev, channels }));

      // Load users for each channel
      const allUsers = new Set<string>();
      for (const channel of channels) {
        const members = await SupabaseService.getChannelMembers(channel.id);
        members.forEach(member => allUsers.add(member.id));
      }

      // Load user profiles
      const userProfiles: { [key: string]: User } = {};
      for (const userId of allUsers) {
        const profile = await SupabaseService.getUserProfile(userId);
        if (profile) {
          userProfiles[userId] = profile;
        }
      }

      setState(prev => ({
        ...prev,
        users: { ...prev.users, ...userProfiles }
      }));

    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setCurrentUser = useCallback((user: User | null) => {
    setState(prev => ({ ...prev, currentUser: user }));
    
    if (user) {
      // Mark user as online
      SupabaseService.updateUserStatus(user.id, 'online');
      markUserOnline(user.id);
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { user } = await SupabaseService.signIn(email, password);
      
      if (user) {
        const userProfile = await SupabaseService.getUserProfile(user.id);
        if (userProfile) {
          setCurrentUser(userProfile);
          await loadUserData(userProfile);
        }
      }
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      if (state.currentUser) {
        await SupabaseService.updateUserStatus(state.currentUser.id, 'offline');
        markUserOffline(state.currentUser.id);
      }
      
      await SupabaseService.signOut();
      setCurrentUser(null);
      
      // Clear all data
      setState(prev => ({
        ...prev,
        channels: [],
        messages: {},
        onlineUsers: [],
        typingUsers: {}
      }));

      // Unsubscribe from all channels
      Object.values(subscriptions).forEach(sub => sub.unsubscribe());
      setSubscriptions({});
      
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }, [state.currentUser, subscriptions]);

  const getChannelsForUser = useCallback((user: User): Channel[] => {
    return state.channels.filter(channel => canUserAccessChannel(user, channel));
  }, [state.channels]);

  const canUserAccessChannel = useCallback((user: User, channel: Channel): boolean => {
    return channel.permissions.read.includes(user.role);
  }, []);

  const canUserWriteToChannel = useCallback((user: User, channel: Channel): boolean => {
    return channel.permissions.write.includes(user.role);
  }, []);

  const addMessage = useCallback(async (channelId: string, messageData: Omit<Message, 'id' | 'timestamp' | 'status' | 'readBy'>) => {
    try {
      console.log('📤 Sending message:', messageData.content, 'to channel', channelId);
      
      const message = await SupabaseService.sendMessage(
        channelId, 
        messageData.userId, 
        messageData.content
      );

      // Add message locally
      setState(prev => ({
        ...prev,
        messages: {
          ...prev.messages,
          [channelId]: [...(prev.messages[channelId] || []), message]
        }
      }));
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }, []);

  const deleteMessage = useCallback((messageId: string) => {
    setState(prevState => {
      const newMessages = { ...prevState.messages };
      Object.keys(newMessages).forEach(channelId => {
        newMessages[channelId] = newMessages[channelId].filter(msg => msg.id !== messageId);
      });
      return {
        ...prevState,
        messages: newMessages
      };
    });
  }, []);

  const getMessagesForChannel = useCallback((channelId: string): Message[] => {
    return state.messages[channelId] || [];
  }, [state.messages]);

  const loadMessagesForChannel = useCallback(async (channelId: string) => {
    try {
      const messages = await SupabaseService.getMessagesForChannel(channelId);
      setState(prev => ({
        ...prev,
        messages: {
          ...prev.messages,
          [channelId]: messages
        }
      }));
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }, []);

  const getOnlineUsers = useCallback((): User[] => {
    return state.onlineUsers.map(userId => state.users[userId]).filter(Boolean);
  }, [state.onlineUsers, state.users]);

  const markUserOnline = useCallback((userId: string) => {
    setState(prev => ({
      ...prev,
      onlineUsers: [...new Set([...prev.onlineUsers, userId])],
      users: {
        ...prev.users,
        [userId]: {
          ...prev.users[userId],
          status: 'online',
          lastSeen: Date.now()
        }
      }
    }));
  }, []);

  const markUserOffline = useCallback((userId: string) => {
    setState(prev => ({
      ...prev,
      onlineUsers: prev.onlineUsers.filter(id => id !== userId),
      users: {
        ...prev.users,
        [userId]: {
          ...prev.users[userId],
          status: 'offline',
          lastSeen: Date.now()
        }
      }
    }));
  }, []);

  const setTyping = useCallback(async (channelId: string, userId: string, isTyping: boolean) => {
    try {
      await SupabaseService.setTyping(channelId, userId, isTyping);
      
      // Update local state
      setState(prev => {
        const currentTyping = prev.typingUsers[channelId] || [];
        let newTyping;
        
        if (isTyping) {
          newTyping = [...currentTyping.filter(id => id !== userId), userId];
        } else {
          newTyping = currentTyping.filter(id => id !== userId);
        }

        return {
          ...prev,
          typingUsers: {
            ...prev.typingUsers,
            [channelId]: newTyping
          }
        };
      });
    } catch (error) {
      console.error('Error setting typing status:', error);
    }
  }, []);

  const getTypingUsers = useCallback((channelId: string): User[] => {
    const typingUserIds = state.typingUsers[channelId] || [];
    return typingUserIds.map(userId => state.users[userId]).filter(Boolean);
  }, [state.typingUsers, state.users]);

  const markMessageAsRead = useCallback((messageId: string, userId: string) => {
    setState(prev => {
      const newMessages = { ...prev.messages };
      
      Object.keys(newMessages).forEach(channelId => {
        newMessages[channelId] = newMessages[channelId].map(msg => {
          if (msg.id === messageId && !msg.readBy.includes(userId)) {
            return {
              ...msg,
              readBy: [...msg.readBy, userId],
              status: 'read'
            };
          }
          return msg;
        });
      });

      return {
        ...prev,
        messages: newMessages
      };
    });
  }, []);

  const markChannelAsRead = useCallback((channelId: string, userId: string) => {
    setState(prev => {
      const newMessages = { ...prev.messages };
      
      if (newMessages[channelId]) {
        newMessages[channelId] = newMessages[channelId].map(msg => {
          if (!msg.readBy.includes(userId)) {
            return {
              ...msg,
              readBy: [...msg.readBy, userId],
              status: 'read'
            };
          }
          return msg;
        });
      }

      return {
        ...prev,
        messages: newMessages
      };
    });
  }, []);

  // Subscribe to real-time updates for a channel
  const subscribeToChannel = useCallback((channelId: string) => {
    if (subscriptions[channelId]) {
      return; // Already subscribed
    }

    // Load initial messages
    loadMessagesForChannel(channelId);

    // Subscribe to new messages
    const messageSubscription = SupabaseService.subscribeToMessages(channelId, (message) => {
      console.log('📨 New message received:', message);
      setState(prev => ({
        ...prev,
        messages: {
          ...prev.messages,
          [channelId]: [...(prev.messages[channelId] || []), message]
        }
      }));
    });

    // Subscribe to typing indicators
    const typingSubscription = SupabaseService.subscribeToTyping(channelId, (typingUserIds) => {
      setState(prev => ({
        ...prev,
        typingUsers: {
          ...prev.typingUsers,
          [channelId]: typingUserIds
        }
      }));
    });

    setSubscriptions(prev => ({
      ...prev,
      [channelId]: {
        unsubscribe: () => {
          messageSubscription.unsubscribe();
          typingSubscription.unsubscribe();
        }
      }
    }));
  }, [subscriptions, loadMessagesForChannel]);

  // Auto-subscribe to channels when they change
  useEffect(() => {
    if (state.channels.length > 0) {
      state.channels.forEach(channel => {
        subscribeToChannel(channel.id);
      });
    }
  }, [state.channels, subscribeToChannel]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(subscriptions).forEach(sub => sub.unsubscribe());
    };
  }, [subscriptions]);

  return (
    <ConnectContext.Provider value={{
      state,
      currentUser: state.currentUser,
      setCurrentUser,
      getChannelsForUser,
      canUserAccessChannel,
      canUserWriteToChannel,
      addMessage,
      deleteMessage,
      getMessagesForChannel,
      getOnlineUsers,
      markUserOnline,
      markUserOffline,
      setTyping,
      getTypingUsers,
      markMessageAsRead,
      markChannelAsRead,
      signIn,
      signOut,
      isLoading
    }}>
      {children}
    </ConnectContext.Provider>
  );
};

export const useConnect = () => {
  const context = useContext(ConnectContext);
  if (!context) {
    throw new Error('useConnect must be used within a ConnectProvider');
  }
  return context;
};