import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  SafeAreaView,
  Keyboard,
  Animated,
  Vibration
} from 'react-native';
import { useTheme, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useConnect } from '../context/ConnectContext';
import { Channel, Message, User } from '../types/connect';
import LoginScreen from './LoginScreen';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isTablet = screenWidth > 768;
const sidebarWidth = isTablet ? 300 : screenWidth * 0.85;

export default function ConnectScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { 
    currentUser, 
    setCurrentUser,
    getChannelsForUser, 
    canUserWriteToChannel, 
    addMessage,
    deleteMessage,
    getMessagesForChannel,
    getOnlineUsers,
    setTyping,
    getTypingUsers,
    markMessageAsRead,
    markChannelAsRead,
    signIn,
    signOut,
    isLoading
  } = useConnect();
  
  // All state hooks
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSidebar, setShowSidebar] = useState(isTablet);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [showMessageOptions, setShowMessageOptions] = useState<string | null>(null);
  const [unreadChannels, setUnreadChannels] = useState<Set<string>>(new Set());
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [nickname, setNickname] = useState('');
  const [serverNicknames, setServerNicknames] = useState<{[key: string]: string}>({});
  const [showMessageOptionsModal, setShowMessageOptionsModal] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [pinnedMessages, setPinnedMessages] = useState<Set<string>>(new Set());
  const [showPinnedMessages, setShowPinnedMessages] = useState(false);
  const [deletingMessage, setDeletingMessage] = useState<string | null>(null);
  const [explodingMessage, setExplodingMessage] = useState<string | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  
  // Animation values
  const sidebarTranslateX = useRef(new Animated.Value(isTablet ? 0 : -sidebarWidth)).current;
  const messageSlideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const explosionScale = useRef(new Animated.Value(1)).current;
  const explosionOpacity = useRef(new Animated.Value(1)).current;
  const inputFocusAnim = useRef(new Animated.Value(0)).current;
  const inputScaleAnim = useRef(new Animated.Value(1)).current;
  const typingDotAnim1 = useRef(new Animated.Value(0.4)).current;
  const typingDotAnim2 = useRef(new Animated.Value(0.7)).current;
  const typingDotAnim3 = useRef(new Animated.Value(1)).current;
  
  // All ref hooks
  const scrollViewRef = useRef<ScrollView>(null);
  const textInputRef = useRef<TextInput>(null);

  // Get channels before any hooks that use them
  const channels = currentUser ? getChannelsForUser(currentUser) : [];
  const messages = selectedChannel ? getMessagesForChannel(selectedChannel.id) : [];
  const onlineUsers = getOnlineUsers();
  const allTypingUsers = selectedChannel ? getTypingUsers(selectedChannel.id) : [];
  const typingUsers = allTypingUsers?.filter(user => user.id !== currentUser?.id) || [];

  // Group channels by category (Discord-style)
  const channelsByCategory = channels.reduce((acc, channel) => {
    const category = channel.category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(channel);
    return acc;
  }, {} as { [category: string]: Channel[] });

  const toggleCategory = (categoryName: string) => {
    setCollapsedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryName)) {
        newSet.delete(categoryName);
      } else {
        newSet.add(categoryName);
      }
      return newSet;
    });
  };

  const getChannelIcon = (channel: Channel) => {
    // Map channel names to specific icons based on your Discord layout
    const iconMap: { [key: string]: string } = {
      'welcome': 'chatbubbles',
      'overdue-oil': 'warning',
      'inspection-reports': 'document-text',
      'other': 'construct',
      'oil-receipts': 'document-text',
      'general': 'chatbubbles',
      'attendance': 'time',
      'fleet-maintenance': 'car',
      'accidents': 'flash',
      'mod-logs': 'hardware-chip',
      'alerts': 'warning',
      'announcements': 'megaphone',
      'resources': 'book',
      'academy-onboarding': 'school',
      'training-chat': 'chatbubbles',
      'training-updates': 'chatbubbles',
      'truck-maintenance': 'construct',
      'timeclock-issues': 'time',
      'gas-card-issues': 'car',
      'other-issues': 'help-circle',
      'time-off-requests': 'leaf',
      'off-topic': 'chatbubbles',
      'all-staff-meeting': 'mic'
    };
    
    return iconMap[channel.name] || (channel.type === 'announcement' ? 'megaphone' : 'chatbubbles');
  };

  const getCategoryIcon = (categoryName: string) => {
    const iconMap: { [key: string]: string } = {
      'Fleetio Alerts': 'alert-circle',
      'ADP Leadership': 'people',
      'Information': 'megaphone',
      'Training Academy': 'school',
      'Issues / Reports': 'document-text',
      'Scheduling / Time Off': 'calendar',
      'Social': 'happy',
      'WheelzUp Meetings': 'people'
    };
    
    return iconMap[categoryName] || 'folder';
  };

  // ALL useEffect hooks must be before any early returns
  useEffect(() => {
    if (channels.length > 0 && !selectedChannel) {
      setSelectedChannel(channels[0]);
    }
  }, [channels, selectedChannel]);

  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        const height = e.endCoordinates.height;
        setIsKeyboardVisible(true);
        setKeyboardHeight(height);
        
        // Close sidebar when keyboard appears
        if (!isTablet) {
          setShowSidebar(false);
        }
        
        // Scroll to bottom after keyboard animation
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, Platform.OS === 'ios' ? 300 : 100);
      }
    );

    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      (e) => {
        setIsKeyboardVisible(false);
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, [isTablet]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  useEffect(() => {
    if (selectedChannel && currentUser) {
      markChannelAsRead(selectedChannel.id, currentUser.id);
      // Remove from unread when channel is selected
      setUnreadChannels(prev => {
        const newSet = new Set(prev);
        newSet.delete(selectedChannel.id);
        return newSet;
      });
    }
  }, [selectedChannel, currentUser, markChannelAsRead]);

  // Simulate unread messages for testing
  useEffect(() => {
    // Add some channels as unread for demonstration
    const timer = setTimeout(() => {
      setUnreadChannels(new Set(['660e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440004']));
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  // Enhanced keyboard handling with fluid animations
  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        const height = e.endCoordinates.height;
        setIsKeyboardVisible(true);
        setKeyboardHeight(height);
        
        // Close sidebar when keyboard appears
        if (!isTablet) {
          setShowSidebar(false);
        }
        
        // Scroll to bottom when keyboard appears
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, Platform.OS === 'ios' ? 100 : 50);
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, Platform.OS === 'ios' ? 300 : 150);
      }
    );

    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setIsKeyboardVisible(false);
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, [isTablet]);

  // Animate sidebar
  useEffect(() => {
    Animated.timing(sidebarTranslateX, {
      toValue: showSidebar ? 0 : -sidebarWidth,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [showSidebar, sidebarTranslateX]);

  // Animate input focus
  useEffect(() => {
    if (isInputFocused) {
      Animated.parallel([
        Animated.timing(inputFocusAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(inputScaleAnim, {
          toValue: 1.02,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(inputFocusAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(inputScaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isInputFocused, inputFocusAnim, inputScaleAnim]);

  // Animate typing dots
  useEffect(() => {
    if (typingUsers.length > 0) {
      const createTypingAnimation = (animValue: Animated.Value, delay: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(animValue, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(animValue, {
              toValue: 0.3,
              duration: 600,
              useNativeDriver: true,
            }),
          ])
        );
      };

      const animation1 = createTypingAnimation(typingDotAnim1, 0);
      const animation2 = createTypingAnimation(typingDotAnim2, 200);
      const animation3 = createTypingAnimation(typingDotAnim3, 400);

      animation1.start();
      animation2.start();
      animation3.start();

      return () => {
        animation1.stop();
        animation2.stop();
        animation3.stop();
      };
    }
  }, [typingUsers.length, typingDotAnim1, typingDotAnim2, typingDotAnim3]);

  // Animate channel switch with smooth transition
  const animateChannelSwitch = () => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Smooth message slide animation
  const animateMessageSlide = () => {
    Animated.timing(messageSlideAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      messageSlideAnim.setValue(0);
    });
  };

  // Show login screen if not authenticated
  if (!currentUser) {
    return <LoginScreen />;
  }

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedChannel || !currentUser) return;
    
    if (!canUserWriteToChannel(currentUser, selectedChannel)) {
      Alert.alert('Permission Denied', 'You do not have permission to write in this channel.');
      return;
    }

    // Stop typing indicator
    setTyping(selectedChannel.id, currentUser.id, false);
    if (typingTimeout) {
      clearTimeout(typingTimeout);
      setTypingTimeout(null);
    }

    // Store message content before clearing
    const messageContent = messageText.trim();
    
    if (editingMessage) {
      // Edit existing message
      Alert.alert('Message Edited', 'Message has been updated!');
      setEditingMessage(null);
    } else {
      // Add new message
      addMessage(selectedChannel.id, {
        channelId: selectedChannel.id,
        userId: currentUser.id,
        content: messageContent,
        type: 'text',
        reactions: [],
        isPinned: false,
        isDeleted: false
      });
    }

    // Clear message text after sending
    setMessageText('');
  };

  const handleTextChange = (text: string) => {
    setMessageText(text);
    
    if (!selectedChannel || !currentUser) return;

    // Start typing indicator (only for others to see)
    if (text.trim() && !isTyping) {
      setIsTyping(true);
      setTyping(selectedChannel.id, currentUser.id, true);
    }

    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    // Set new timeout to stop typing indicator
    const timeout = setTimeout(() => {
      setTyping(selectedChannel.id, currentUser.id, false);
      setIsTyping(false);
    }, 2000);

    setTypingTimeout(timeout);
  };

  const handleChannelSelect = (channel: Channel) => {
    if (channel.id !== selectedChannel?.id) {
      animateChannelSwitch();
      setSelectedChannel(channel);
      if (!isTablet) {
        setShowSidebar(false);
      }
    }
  };

  const handleBackPress = () => {
    if (showSidebar && !isTablet) {
      setShowSidebar(false);
    } else {
      navigation.goBack();
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              console.error('Sign out error:', error);
            }
          }
        }
      ]
    );
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    // Discord-style smart timestamps
    if (diff < 10000) return 'now'; // Less than 10 seconds
    if (diff < 60000) return `${Math.floor(diff / 1000)}s`; // Seconds
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`; // Minutes
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`; // Hours
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d`; // Days
    
    // For older messages, show date
    const isToday = date.toDateString() === now.toDateString();
    const isYesterday = new Date(now.getTime() - 86400000).toDateString() === date.toDateString();
    
    if (isToday) return 'Today';
    if (isYesterday) return 'Yesterday';
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const getUserDisplayName = (userId: string) => {
    // Check for server nickname first
    if (serverNicknames[userId]) {
      return serverNicknames[userId];
    }
    
    // Try to find user in the online users list
    const onlineUser = onlineUsers.find(user => user.id === userId);
    if (onlineUser) {
      return onlineUser.displayName || onlineUser.username || 'Unknown User';
    }
    
    // Fallback to hardcoded mapping for development
    const userMap: { [key: string]: string } = {
      '550e8400-e29b-41d4-a716-446655440001': 'James Prush',
      '550e8400-e29b-41d4-a716-446655440002': 'Wes Johnson'
    };
    return userMap[userId] || 'Unknown User';
  };

  const getUserRole = (userId: string): string => {
    // Role mapping for demo - Discord-style role hierarchy
    const roleMap: { [key: string]: string } = {
      '550e8400-e29b-41d4-a716-446655440001': 'admin',      // James - Admin
      '550e8400-e29b-41d4-a716-446655440002': 'manager',   // Wes - Manager
      '550e8400-e29b-41d4-a716-446655440003': 'driver',    // Prush - Driver
    };
    
    return roleMap[userId] || 'driver';
  };

  const getUserNameColor = (userId: string): string => {
    const role = getUserRole(userId);
    
    // Discord-style role colors with distinct hierarchy
    switch (role) {
      case 'admin':
        return '#ff6b6b'; // Bright red for admin
      case 'manager':
        return '#4ecdc4'; // Teal for manager
      case 'supervisor':
        return '#96ceb4'; // Green for supervisor
      case 'dispatcher':
        return '#feca57'; // Yellow for dispatcher
      case 'driver':
        return '#45b7d1'; // Blue for driver
      default:
        return '#95a5a6'; // Gray for unknown
    }
  };

  const getMessageStatusIcon = (message: Message) => {
    if (message.status === 'sending') return '⏳';
    if (message.status === 'delivered') return '✓';
    if (message.status === 'read') return '✓✓';
    return '✓';
  };

  const getMessageStatusColor = (message: Message) => {
    if (message.status === 'sending') return colors.text + '40';
    if (message.status === 'delivered') return colors.text + '60';
    if (message.status === 'read') return colors.primary;
    return colors.text + '60';
  };

  const renderCategoryHeader = (categoryName: string) => {
    const isCollapsed = collapsedCategories.has(categoryName);
    const categoryIcon = getCategoryIcon(categoryName);
    
    return (
      <TouchableOpacity
        key={categoryName}
        style={styles.categoryHeader}
        onPress={() => toggleCategory(categoryName)}
      >
        <View style={styles.categoryHeaderContent}>
          <Ionicons 
            name={isCollapsed ? "chevron-forward" : "chevron-down"} 
            size={12} 
            color={colors.text + '70'} 
          />
          <Ionicons 
            name={categoryIcon as any} 
            size={14} 
            color={colors.text + '70'} 
            style={styles.categoryIcon}
          />
          <Text style={[styles.categoryTitle, { color: colors.text + '70' }]}>
            {categoryName.toUpperCase()}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.addChannelButton}
          onPress={() => Alert.alert('Add Channel', 'Channel creation coming soon!')}
        >
          <Ionicons name="add" size={14} color={colors.text + '70'} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderChannel = (channel: Channel) => {
    const isSelected = selectedChannel?.id === channel.id;
    const hasUnread = unreadChannels.has(channel.id);
    const channelMessages = getMessagesForChannel(channel.id);
    const unreadCount = hasUnread ? channelMessages.length : 0;
    const channelIcon = getChannelIcon(channel);
    
    return (
      <TouchableOpacity
        key={channel.id}
        style={[
          styles.channelItem,
          { 
            backgroundColor: isSelected ? colors.primary + '15' : 'transparent',
            borderLeftColor: isSelected ? colors.primary : 'transparent'
          }
        ]}
        onPress={() => handleChannelSelect(channel)}
      >
        <View style={styles.channelIcon}>
          {channel.type === 'announcement' ? (
            <Ionicons name="megaphone" size={16} color={colors.text + '70'} />
          ) : (
            <Ionicons name={channelIcon as any} size={16} color={colors.text + '70'} />
          )}
        </View>
        <View style={styles.channelInfo}>
          <Text style={[
            styles.channelName, 
            { 
              color: isSelected 
                ? colors.text 
                : hasUnread 
                  ? colors.text 
                  : colors.text + '90',
              fontWeight: isSelected ? '600' : '400'
            }
          ]}>
            {channel.name || 'Unknown Channel'}
          </Text>
        </View>
        {channel.isPrivate && (
          <Ionicons name="lock-closed" size={12} color={colors.text + '50'} style={styles.lockIcon} />
        )}
        {unreadCount > 0 && (
          <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.unreadText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
          </View>
        )}
        {hasUnread && unreadCount === 0 && (
          <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
        )}
      </TouchableOpacity>
    );
  };

  const renderMessage = (message: Message, index: number) => {
    const isOwn = currentUser?.id === message.userId;
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;
    const isSameUser = prevMessage && prevMessage.userId === message.userId;
    const isNextSameUser = nextMessage && nextMessage.userId === message.userId;
    const timeDiff = prevMessage ? message.timestamp - prevMessage.timestamp : 0;
    const showAvatar = true; // Always show avatars for testing
    const isExploding = explodingMessage === message.id;
    const isPinned = pinnedMessages.has(message.id);
    
    // Check if we need a date separator (Discord-style)
    const messageDate = new Date(message.timestamp).toDateString();
    const prevMessageDate = prevMessage ? new Date(prevMessage.timestamp).toDateString() : null;
    const showDateSeparator = !prevMessage || messageDate !== prevMessageDate;
    
    if (isExploding) {
      return (
        <Animated.View 
          key={message.id}
          style={[
            styles.messageWrapper, 
            isOwn && styles.ownMessageWrapper,
            {
              opacity: explosionOpacity,
              transform: [{ scale: explosionScale }]
            }
          ]}
        />
      );
    }
    
    return (
      <View key={message.id}>
        {/* Date Separator (Discord-style) */}
        {showDateSeparator && (
          <View style={styles.dateSeparator}>
            <View style={styles.dateLine} />
            <Text style={styles.dateText}>
              {new Date(message.timestamp).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Text>
            <View style={styles.dateLine} />
          </View>
        )}
        
        <TouchableOpacity
          style={[
            styles.messageWrapper, 
            isOwn && styles.ownMessageWrapper,
            isPinned && styles.pinnedMessageWrapper
          ]}
          onLongPress={() => setShowMessageOptionsModal(message.id)}
          activeOpacity={0.7}
        >
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { backgroundColor: getUserNameColor(message.userId) + '20' }]}>
            <Text style={[styles.avatarText, { color: getUserNameColor(message.userId) }]}>
              {getUserDisplayName(message.userId).charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={[styles.statusDot, { backgroundColor: '#00ff88' }]} />
        </View>
        
        <View style={styles.messageContent}>
          <View style={styles.messageHeader}>
            <Text style={[styles.messageAuthor, { color: getUserNameColor(message.userId) }]}>
              {getUserDisplayName(message.userId)}
            </Text>
            <Text style={[styles.messageTime, { color: colors.text + '50' }]}>
              {formatTime(message.timestamp)}
            </Text>
          </View>
          <Text style={[
            styles.messageText, 
            { color: colors.text }
          ]}>
            {message.content}
          </Text>
          {isOwn && (
            <View style={styles.messageFooter}>
              <Text style={[styles.messageStatus, { color: getMessageStatusColor(message) }]}>
                {getMessageStatusIcon(message)}
              </Text>
            </View>
          )}
        </View>

        {/* Message Options - Premium Vertical Menu */}
        {showMessageOptions === message.id && (
          <View style={[styles.messageOptions, { backgroundColor: colors.card }]}>
            <TouchableOpacity 
              style={styles.optionButton}
              onPress={() => {
                // Copy to clipboard functionality
                Alert.alert('Copied!', 'Message copied to clipboard');
                setShowMessageOptions(null);
              }}
            >
              <Ionicons name="copy" size={18} color={colors.text} />
              <Text style={[styles.optionText, { color: colors.text }]}>Copy Message</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.optionButton}
              onPress={() => {
                Alert.alert('React', 'Emoji reactions coming soon!');
                setShowMessageOptions(null);
              }}
            >
              <Ionicons name="heart" size={18} color="#ff4444" />
              <Text style={[styles.optionText, { color: colors.text }]}>Add Reaction</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.optionButton}
              onPress={() => {
                setPinnedMessages(prev => new Set([...prev, message.id]));
                Alert.alert('Pinned!', 'Message has been pinned to the channel');
                setShowMessageOptions(null);
              }}
            >
              <Ionicons name="pin" size={18} color={colors.primary} />
              <Text style={[styles.optionText, { color: colors.text }]}>Pin Message</Text>
            </TouchableOpacity>
            
            {isOwn && (
              <>
                <TouchableOpacity 
                  style={styles.optionButton}
                  onPress={() => {
                    setEditingMessage(message);
                    setMessageText(message.content);
                    setShowMessageOptions(null);
                    // Focus the input and bring keyboard up
                    setTimeout(() => {
                      textInputRef.current?.focus();
                    }, 100);
                  }}
                >
                  <Ionicons name="create" size={18} color={colors.primary} />
                  <Text style={[styles.optionText, { color: colors.text }]}>Edit Message</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.optionButton, styles.deleteButton]}
                  onPress={() => {
                    Alert.alert(
                      'Delete Message',
                      'Are you sure you want to delete this message?',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { 
                          text: 'Delete', 
                          style: 'destructive',
                          onPress: () => {
                            // Start explosion animation
                            setExplodingMessage(message.id);
                            
                            // Haptic feedback for explosion
                            Vibration.vibrate(50);
                            
                            // Telegram-style explosion animation
                            Animated.parallel([
                              Animated.timing(explosionScale, {
                                toValue: 1.5,
                                duration: 200,
                                useNativeDriver: true,
                              }),
                              Animated.timing(explosionOpacity, {
                                toValue: 0,
                                duration: 200,
                                useNativeDriver: true,
                              }),
                            ]).start(() => {
                              // Actually delete the message after animation
                              deleteMessage(message.id);
                              setShowMessageOptions(null);
                              setExplodingMessage(null);
                              // Reset animation values
                              explosionScale.setValue(1);
                              explosionOpacity.setValue(1);
                            });
                          }
                        }
                      ]
                    );
                  }}
                >
                  <Ionicons name="trash" size={18} color="#ff4444" />
                  <Text style={[styles.optionText, { color: '#ff4444' }]}>Delete Message</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Header - Discord Style */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          {!isTablet && (
            <TouchableOpacity 
              style={styles.menuButton}
              onPress={() => setShowSidebar(!showSidebar)}
            >
              <Ionicons name="menu" size={24} color={colors.text} />
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBackPress}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            {selectedChannel ? (
              <View style={styles.channelHeader}>
                <View style={styles.channelTitleRow}>
                  <Text style={[styles.channelIcon, { color: colors.primary }]}>
                    {selectedChannel.type === 'announcement' ? '📢' : '💬'}
                  </Text>
                  <Text style={[styles.channelTitle, { color: colors.text }]} numberOfLines={1}>
                    {selectedChannel.name}
                  </Text>
                  {pinnedMessages.size > 0 && (
                    <TouchableOpacity 
                      style={styles.pinIndicator}
                      onPress={() => setShowPinnedMessages(!showPinnedMessages)}
                    >
                      <Ionicons name="pin" size={12} color={colors.primary} />
                      <Text style={[styles.pinCount, { color: colors.primary }]}>
                        {pinnedMessages.size}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
                <View style={styles.channelMeta}>
                  <Text style={[styles.channelDescription, { color: colors.text + '70' }]} numberOfLines={1}>
                    {selectedChannel.description}
                  </Text>
                  <View style={styles.memberCount}>
                    <Ionicons name="people" size={12} color={colors.text + '50'} />
                    <Text style={[styles.memberCountText, { color: colors.text + '50' }]}>
                      {onlineUsers.length} online
                    </Text>
                  </View>
                </View>
              </View>
            ) : (
              <Text style={[styles.headerTitle, { color: colors.text }]}>WheelzUp Connect</Text>
            )}
          </View>
        </View>
        
        <View style={styles.topHeaderRight}>
          <TouchableOpacity 
            style={styles.headerActionButton}
            onPress={() => Alert.alert('Search', 'Message search coming soon!')}
          >
            <Ionicons name="search" size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerActionButton}
            onPress={() => Alert.alert('Notifications', 'Notification settings coming soon!')}
          >
            <Ionicons name="notifications" size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerActionButton}
            onPress={() => setShowProfileSettings(true)}
          >
            <Ionicons name="person-circle" size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerActionButton}
            onPress={() => Alert.alert('More Options', 'Channel settings coming soon!')}
          >
            <Ionicons name="ellipsis-vertical" size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerActionButton}
            onPress={handleSignOut}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Sidebar */}
        <Animated.View 
          style={[
            styles.sidebar, 
            { 
              backgroundColor: colors.card, 
              borderRightColor: colors.border, 
              width: sidebarWidth,
              transform: [{ translateX: sidebarTranslateX }]
            }
          ]}
        >
          {/* Server Header */}
          <View style={[styles.serverHeader, { backgroundColor: colors.background }]}>
            <View style={styles.serverInfo}>
              <View style={[styles.serverIcon, { backgroundColor: colors.primary }]}>
                <Text style={styles.serverIconText}>WU</Text>
              </View>
              <View style={styles.serverDetails}>
                <Text style={[styles.serverName, { color: colors.text }]}>WheelzUp</Text>
                <Text style={[styles.serverStatus, { color: colors.text + '70' }]}>Online</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.serverMenuButton}
              onPress={() => Alert.alert('Server Settings', 'Server settings coming soon!')}
            >
              <Ionicons name="chevron-down" size={16} color={colors.text + '70'} />
            </TouchableOpacity>
          </View>

          {/* Channel Categories - Discord Style */}
          <View style={styles.channelCategories}>
            <ScrollView style={styles.channelList} showsVerticalScrollIndicator={false}>
              {/* Render channels without categories first */}
              {channelsByCategory[''] && channelsByCategory[''].map(renderChannel)}
              
              {/* Render categorized channels */}
              {Object.entries(channelsByCategory)
                .filter(([categoryName]) => categoryName !== '')
                .map(([categoryName, categoryChannels]) => (
                  <View key={categoryName}>
                    {renderCategoryHeader(categoryName)}
                    {!collapsedCategories.has(categoryName) && (
                      <View style={styles.categoryChannels}>
                        {categoryChannels.map(renderChannel)}
                      </View>
                    )}
                  </View>
                ))}
            </ScrollView>
          </View>

          {/* User Profile Section */}
          <View style={[styles.userProfile, { backgroundColor: colors.card }]}>
            <View style={styles.userInfo}>
              <View style={[styles.userAvatar, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.userAvatarText, { color: colors.primary }]}>
                  {currentUser?.displayName?.charAt(0) || 'U'}
                </Text>
              </View>
              <View style={styles.userDetails}>
                <Text style={[styles.userName, { color: colors.text }]}>
                  {currentUser?.displayName || 'User'}
                </Text>
                <Text style={[styles.userStatus, { color: colors.text + '70' }]}>Online</Text>
              </View>
            </View>
            <View style={styles.userActions}>
              <TouchableOpacity style={styles.userActionButton}>
                <Ionicons name="mic" size={16} color={colors.text + '70'} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.userActionButton}>
                <Ionicons name="headset" size={16} color={colors.text + '70'} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.userActionButton}>
                <Ionicons name="settings" size={16} color={colors.text + '70'} />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* Chat Area */}
        <Animated.View style={[styles.chatArea, { opacity: fadeAnim }]}>
          {selectedChannel ? (
            <>
              {/* Pinned Messages Button */}
              {pinnedMessages.size > 0 && (
                <TouchableOpacity 
                  style={[styles.pinnedButton, { backgroundColor: colors.primary + '15' }]}
                  onPress={() => setShowPinnedMessages(!showPinnedMessages)}
                >
                  <Ionicons name="pin" size={16} color={colors.primary} />
                  <Text style={[styles.pinnedButtonText, { color: colors.primary }]}>
                    {pinnedMessages.size} Pinned Message{pinnedMessages.size !== 1 ? 's' : ''}
                  </Text>
                  <Ionicons name={showPinnedMessages ? "chevron-up" : "chevron-down"} size={16} color={colors.primary} />
                </TouchableOpacity>
              )}

              {/* Pinned Messages List */}
              {showPinnedMessages && pinnedMessages.size > 0 && (
                <View style={[styles.pinnedContainer, { backgroundColor: colors.card }]}>
                  <Text style={[styles.pinnedTitle, { color: colors.text }]}>Pinned Messages</Text>
                  {messages.filter(m => pinnedMessages.has(m.id)).map((message, index) => (
                    <View key={message.id} style={styles.pinnedMessage}>
                      <Text style={[styles.pinnedAuthor, { color: getUserNameColor(message.userId) }]}>
                        {getUserDisplayName(message.userId)}
                      </Text>
                      <Text style={[styles.pinnedContent, { color: colors.text }]}>
                        {message.content}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Messages */}
              <TouchableOpacity 
                style={styles.messagesContainer}
                activeOpacity={1}
                onPress={() => {
                  setShowMessageOptions(null);
                  setShowMessageOptionsModal(null);
                  setShowSidebar(false);
                  // Dismiss keyboard when tapping chat area
                  Keyboard.dismiss();
                }}
              >
                <ScrollView
                  ref={scrollViewRef}
                  style={styles.messagesList}
                  contentContainerStyle={[
                    styles.messagesContent,
                    { 
                      paddingBottom: isKeyboardVisible ? keyboardHeight + 100 : 120,
                    }
                  ]}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {messages.map((message, index) => renderMessage(message, index))}
                
                {/* Enhanced Typing Indicator with Premium Animation */}
                {typingUsers.length > 0 && (
                  <View style={styles.typingContainer}>
                    <View style={styles.typingBubble}>
                      <View style={styles.typingDots}>
                        <Animated.View style={[
                          styles.typingDot, 
                          { 
                            backgroundColor: '#FF9500',
                            opacity: typingDotAnim1
                          }
                        ]} />
                        <Animated.View style={[
                          styles.typingDot, 
                          { 
                            backgroundColor: '#FF9500',
                            opacity: typingDotAnim2
                          }
                        ]} />
                        <Animated.View style={[
                          styles.typingDot, 
                          { 
                            backgroundColor: '#FF9500',
                            opacity: typingDotAnim3
                          }
                        ]} />
                      </View>
                      <Text style={styles.typingText}>
                        {typingUsers.map(u => u.displayName || u.username).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                      </Text>
                    </View>
                  </View>
                )}
                
                {/* No Messages Indicator */}
                {messages.length === 0 && (
                  <View style={styles.noMessagesContainer}>
                    <View style={styles.noMessagesIcon}>
                      <Ionicons name="chatbubbles-outline" size={48} color={colors.text + '30'} />
                    </View>
                    <Text style={[styles.noMessagesTitle, { color: colors.text }]}>
                      No messages yet
                    </Text>
                    <Text style={[styles.noMessagesText, { color: colors.text + '70' }]}>
                      This is the beginning of #{selectedChannel.name}. Start the conversation!
                    </Text>
                  </View>
                )}
                </ScrollView>
              </TouchableOpacity>

              {/* Message Input - Fluid Overlay Positioning */}
              <View 
                style={[
                  styles.messageInput, 
                  { 
                    backgroundColor: colors.card, 
                    borderTopColor: colors.border,
                    position: isKeyboardVisible ? 'absolute' : 'relative',
                    bottom: isKeyboardVisible ? 0 : undefined,
                    left: isKeyboardVisible ? 0 : undefined,
                    right: isKeyboardVisible ? 0 : undefined,
                    zIndex: isKeyboardVisible ? 1000 : 1,
                  }
                ]}
              >
                <Animated.View 
                  style={[
                    styles.inputWrapper,
                    isInputFocused && styles.inputWrapperFocused,
                    {
                      transform: [{ scale: inputScaleAnim }],
                      borderColor: inputFocusAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['rgba(255, 255, 255, 0.1)', 'rgba(255, 149, 0, 0.5)'],
                      }),
                    }
                  ]}
                >
                    <TouchableOpacity style={styles.attachButton}>
                      <Ionicons name="add" size={20} color={colors.text + '70'} />
                    </TouchableOpacity>
                    <TextInput
                      ref={textInputRef}
                      style={[styles.textInput, { color: colors.text }]}
                      placeholder={editingMessage ? `Edit message in #${selectedChannel.name.toLowerCase()}` : `Message #${selectedChannel.name.toLowerCase()}`}
                      placeholderTextColor={colors.text + '50'}
                      value={messageText}
                      onChangeText={handleTextChange}
                      onFocus={() => {
                        setIsInputFocused(true);
                        if (!isTablet) setShowSidebar(false);
                        // Immediate scroll to bottom
                        setTimeout(() => {
                          scrollViewRef.current?.scrollToEnd({ animated: true });
                        }, 50);
                        setTimeout(() => {
                          scrollViewRef.current?.scrollToEnd({ animated: true });
                        }, 200);
                      }}
                      onBlur={() => setIsInputFocused(false)}
                      onSubmitEditing={() => {
                        if (messageText.trim()) {
                          handleSendMessage();
                          setMessageText(''); // Clear text immediately after sending
                          Keyboard.dismiss(); // Dismiss keyboard after sending
                        }
                      }}
                      multiline={false}
                      maxLength={2000}
                      returnKeyType="send"
                      blurOnSubmit={true}
                    />
                    <TouchableOpacity
                      style={[
                        styles.sendButton, 
                        { backgroundColor: messageText.trim() ? colors.primary : colors.border }
                      ]}
                      onPress={() => {
                        handleSendMessage();
                        setMessageText(''); // Clear text immediately after sending
                        Keyboard.dismiss(); // Dismiss keyboard after sending
                      }}
                      disabled={!messageText.trim()}
                    >
                      <Ionicons name="send" size={18} color="#fff" />
                    </TouchableOpacity>
                  </Animated.View>
                </View>
              </>
            ) : (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={80} color={colors.text + '30'} />
              <Text style={[styles.emptyStateText, { color: colors.text + '70' }]}>
                Select a channel to start messaging
              </Text>
              <Text style={[styles.emptyStateSubtext, { color: colors.text + '50' }]}>
                Swipe right or tap the menu to see available channels
              </Text>
            </View>
          )}
        </Animated.View>
      </View>
      </KeyboardAvoidingView>
      
      {/* Profile Settings Modal */}
      {showProfileSettings && (
        <View style={styles.modalOverlay}>
          <View style={[styles.profileModal, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Profile Settings</Text>
              <TouchableOpacity onPress={() => setShowProfileSettings(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.profileSection}>
              <Text style={[styles.sectionLabel, { color: colors.text }]}>Server Nickname</Text>
              <TextInput
                style={[styles.nicknameInput, { 
                  color: colors.text, 
                  borderColor: colors.border,
                  backgroundColor: colors.background 
                }]}
                placeholder="Enter a nickname for this server"
                placeholderTextColor={colors.text + '50'}
                value={nickname}
                onChangeText={setNickname}
              />
              <Text style={[styles.helpText, { color: colors.text + '70' }]}>
                This nickname will be displayed instead of your username in this server
              </Text>
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.cancelButton, { backgroundColor: colors.border }]}
                onPress={() => setShowProfileSettings(false)}
              >
                <Text style={[styles.buttonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={() => {
                  if (currentUser) {
                    setServerNicknames(prev => ({
                      ...prev,
                      [currentUser.id]: nickname || currentUser.displayName || currentUser.username
                    }));
                  }
                  Alert.alert('Saved!', `Nickname set to: ${nickname || 'Default username'}`);
                  setShowProfileSettings(false);
                }}
              >
                <Text style={[styles.buttonText, { color: '#ffffff' }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
      
      {/* Full-Screen Message Options Modal */}
      {showMessageOptionsModal && (
        <View style={styles.modalOverlay}>
          <View style={[styles.messageOptionsModal, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Message Options</Text>
              <TouchableOpacity onPress={() => setShowMessageOptionsModal(null)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.optionsList}>
              <TouchableOpacity 
                style={styles.modalOptionButton}
                onPress={() => {
                  Alert.alert('Copied!', 'Message copied to clipboard');
                  setShowMessageOptionsModal(null);
                }}
              >
                <Ionicons name="copy" size={20} color={colors.text} />
                <Text style={[styles.modalOptionText, { color: colors.text }]}>Copy Message</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalOptionButton}
                onPress={() => {
                  Alert.alert('React', 'Emoji reactions coming soon!');
                  setShowMessageOptionsModal(null);
                }}
              >
                <Ionicons name="heart" size={20} color="#ff4444" />
                <Text style={[styles.modalOptionText, { color: colors.text }]}>Add Reaction</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalOptionButton}
                onPress={() => {
                  setPinnedMessages(prev => new Set([...prev, showMessageOptionsModal]));
                  Alert.alert('Pinned!', 'Message has been pinned to the channel');
                  setShowMessageOptionsModal(null);
                }}
              >
                <Ionicons name="pin" size={20} color={colors.primary} />
                <Text style={[styles.modalOptionText, { color: colors.text }]}>Pin Message</Text>
              </TouchableOpacity>
              
              {currentUser?.id === messages.find(m => m.id === showMessageOptionsModal)?.userId && (
                <>
                  <TouchableOpacity 
                    style={styles.modalOptionButton}
                    onPress={() => {
                      const message = messages.find(m => m.id === showMessageOptionsModal);
                      if (message) {
                        setEditingMessage(message);
                        setMessageText(message.content);
                        setShowMessageOptionsModal(null);
                        setTimeout(() => {
                          textInputRef.current?.focus();
                        }, 100);
                      }
                    }}
                  >
                    <Ionicons name="create" size={20} color={colors.primary} />
                    <Text style={[styles.modalOptionText, { color: colors.text }]}>Edit Message</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.modalOptionButton, styles.deleteOptionButton]}
                    onPress={() => {
                      Alert.alert(
                        'Delete Message',
                        'Are you sure you want to delete this message?',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { 
                            text: 'Delete', 
                            style: 'destructive',
                            onPress: () => {
                              setExplodingMessage(showMessageOptionsModal);
                              Vibration.vibrate(50);
                              Animated.parallel([
                                Animated.timing(explosionScale, {
                                  toValue: 1.5,
                                  duration: 200,
                                  useNativeDriver: true,
                                }),
                                Animated.timing(explosionOpacity, {
                                  toValue: 0,
                                  duration: 200,
                                  useNativeDriver: true,
                                }),
                              ]).start(() => {
                                deleteMessage(showMessageOptionsModal);
                                setShowMessageOptionsModal(null);
                                setExplodingMessage(null);
                                explosionScale.setValue(1);
                                explosionOpacity.setValue(1);
                              });
                            }
                          }
                        ]
                      );
                    }}
                  >
                    <Ionicons name="trash" size={20} color="#ff4444" />
                    <Text style={[styles.modalOptionText, { color: '#ff4444' }]}>Delete Message</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: '#1a1a1a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#1e1e1e',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuButton: {
    marginRight: 16,
    padding: 8,
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    marginBottom: 2,
  },
  channelHeader: {
    flex: 1,
    justifyContent: 'center',
  },
  channelTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  channelTitle: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    flex: 1,
    marginRight: 8,
  },
  pinIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 149, 0, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 24,
    justifyContent: 'center',
  },
  pinCount: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    marginLeft: 2,
  },
  channelDescription: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  topHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActionButton: {
    padding: 6,
    marginLeft: 2,
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 300,
    backgroundColor: '#1a1a1a',
    borderRightWidth: 0.5,
    borderRightColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 24,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 16,
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sidebarTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    color: '#ffffff',
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  onlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  onlineCount: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  channelList: {
    flex: 1,
  },
  channelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 8,
    borderRadius: 8,
    marginBottom: 2,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  channelInfo: {
    flex: 1,
  },
  channelName: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 2,
    color: '#ffffff',
  },
  channelDesc: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#b3b3b3',
  },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    backgroundColor: '#FF9500',
    shadowColor: '#FF9500',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  unreadText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  chatArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  messagesContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: 'transparent',
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
    position: 'relative',
    paddingHorizontal: 20,
    paddingVertical: 6,
  },
  ownMessageWrapper: {
    justifyContent: 'flex-end',
  },
  avatarContainer: {
    marginRight: 12,
    marginTop: 2,
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  messageContainer: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  ownMessage: {
    backgroundColor: 'rgba(255, 149, 0, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.3)',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  messageAuthor: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  messageTime: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    opacity: 0.7,
    marginLeft: 8,
  },
  messageContent: {
    flex: 1,
    paddingTop: 0,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4,
  },
  ownMessageTime: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginRight: 4,
    opacity: 0.7,
  },
  messageStatus: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  messageOptions: {
    position: 'absolute',
    right: 0,
    top: 0,
    flexDirection: 'column',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    minWidth: 160,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    width: '100%',
  },
  deleteButton: {
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 68, 0.2)',
  },
  optionText: {
    fontSize: 14,
    marginLeft: 8,
    fontFamily: 'Inter_500Medium',
  },
  typingContainer: {
    marginTop: 8,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 149, 0, 0.08)',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 24,
    alignSelf: 'flex-start',
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
    shadowColor: '#FF9500',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.2)',
  },
  typingDots: {
    flexDirection: 'row',
    marginRight: 8,
  },
  typingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 3,
  },
  typingText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#FF9500',
    letterSpacing: 0.3,
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  messageInput: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#1e1e1e',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    minHeight: 90,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
    minHeight: 56,
  },
  inputWrapperFocused: {
    shadowColor: '#FF9500',
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 12,
  },
  attachButton: {
    padding: 12,
    marginRight: 16,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    maxHeight: 120,
    paddingVertical: 10,
    lineHeight: 22,
    color: '#ffffff',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
    shadowColor: '#FF9500',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.3)',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 20,
    textAlign: 'center',
    marginTop: 20,
    fontFamily: 'Inter_600SemiBold',
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    fontFamily: 'Inter_400Regular',
  },
  noMessagesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  noMessagesIcon: {
    marginBottom: 20,
  },
  noMessagesTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 8,
  },
  noMessagesText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: 'Inter_400Regular',
  },
  pinnedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.2)',
  },
  pinnedButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    marginLeft: 8,
    flex: 1,
  },
  pinnedContainer: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.2)',
  },
  pinnedTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 12,
  },
  pinnedMessage: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  pinnedAuthor: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
  },
  pinnedContent: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
  pinnedMessageWrapper: {
    borderLeftWidth: 3,
    borderLeftColor: 'rgba(255, 149, 0, 0.5)',
    backgroundColor: 'rgba(255, 149, 0, 0.05)',
  },
  messageContentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  // Discord-style message bubbles
  messageBubble: {
    maxWidth: '85%',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginVertical: 0,
  },
  ownMessageBubble: {
    backgroundColor: '#FF9500', // Orange for own messages
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: '#1a1a1a', // Dark gray for others
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#333333',
  },
  messageBubbleGrouped: {
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  messageBubbleGroupedNext: {
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: 'Inter_400Regular',
    flexWrap: 'wrap',
    flex: 1,
    maxWidth: '100%',
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  messageGrouped: {
    marginTop: 0,
  },
  messageGroupedNext: {
    marginBottom: 0,
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#2f3136',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
  // Discord-style sidebar
  serverHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  serverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serverIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 3,
    borderColor: '#FF9500',
    shadowColor: '#FF9500',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  serverIconText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    fontFamily: 'Inter_800ExtraBold',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  serverDetails: {
    flex: 1,
  },
  serverName: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  serverStatus: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  serverMenuButton: {
    padding: 4,
  },
  channelCategories: {
    flex: 1,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 16,
  },
  categoryHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    marginLeft: 8,
    marginRight: 4,
  },
  categoryTitle: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
    marginLeft: 4,
    flex: 1,
  },
  categoryChannels: {
    paddingLeft: 8,
  },
  lockIcon: {
    marginLeft: 4,
  },
  addChannelButton: {
    padding: 4,
  },
  userProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  userStatus: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  userActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userActionButton: {
    padding: 6,
    marginLeft: 4,
  },
  // Discord-style channel header
  channelMeta: {
    marginTop: 4,
  },
  memberCount: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  memberCountText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginLeft: 4,
  },
  // Discord-style channel hash
  channelHash: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    fontWeight: '400',
  },
  channelIcon: {
    width: 20,
    alignItems: 'center',
    marginRight: 8,
  },
  // Discord-style date separator
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    marginHorizontal: 16,
  },
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dateText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: 'rgba(255, 255, 255, 0.6)',
    marginHorizontal: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Profile Settings Modal
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  profileModal: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  profileSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 8,
  },
  nicknameInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    lineHeight: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  // Message Options Modal
  messageOptionsModal: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  optionsList: {
    gap: 8,
  },
  modalOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
    marginLeft: 12,
  },
  deleteOptionButton: {
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
  },
});
