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
  PanGestureHandler,
  State
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
  
  // Animation values
  const sidebarTranslateX = useRef(new Animated.Value(isTablet ? 0 : -sidebarWidth)).current;
  const messageSlideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  
  // All ref hooks
  const scrollViewRef = useRef<ScrollView>(null);
  const textInputRef = useRef<TextInput>(null);

  // Get channels before any hooks that use them
  const channels = currentUser ? getChannelsForUser(currentUser) : [];
  const messages = selectedChannel ? getMessagesForChannel(selectedChannel.id) : [];
  const onlineUsers = getOnlineUsers();
  const allTypingUsers = selectedChannel ? getTypingUsers(selectedChannel.id) : [];
  const typingUsers = allTypingUsers?.filter(user => user.id !== currentUser?.id) || [];

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
    }
  }, [selectedChannel, currentUser, markChannelAsRead]);

  // Animate sidebar
  useEffect(() => {
    Animated.timing(sidebarTranslateX, {
      toValue: showSidebar ? 0 : -sidebarWidth,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [showSidebar, sidebarTranslateX]);

  // Animate channel switch
  const animateChannelSwitch = () => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
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
    
    // Add message first
    addMessage(selectedChannel.id, {
      channelId: selectedChannel.id,
      userId: currentUser.id,
      content: messageContent,
      type: 'text',
      reactions: [],
      isPinned: false,
      isDeleted: false
    });

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

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    
    return date.toLocaleDateString();
  };

  const getUserDisplayName = (userId: string) => {
    // Try to find user in the online users list first
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

  const renderChannel = (channel: Channel) => {
    const isSelected = selectedChannel?.id === channel.id;
    const unreadCount = 0; // You'd implement unread logic here
    
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
          <Ionicons 
            name={channel.type === 'announcement' ? 'megaphone' : 'chatbubbles'} 
            size={20} 
            color={isSelected ? colors.primary : colors.text + '70'} 
          />
        </View>
        <View style={styles.channelInfo}>
          <Text style={[
            styles.channelName, 
            { color: isSelected ? colors.text : colors.text + '90' }
          ]}>
            {channel.name || 'Unknown Channel'}
          </Text>
          <Text style={[styles.channelDesc, { color: colors.text + '50' }]}>
            {channel.members?.length || 0} member{(channel.members?.length || 0) !== 1 ? 's' : ''}
          </Text>
        </View>
        {unreadCount > 0 && (
          <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.unreadText}>{unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderMessage = (message: Message, index: number) => {
    const isOwn = currentUser?.id === message.userId;
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const isSameUser = prevMessage && prevMessage.userId === message.userId;
    const timeDiff = prevMessage ? message.timestamp - prevMessage.timestamp : 0;
    const showAvatar = !isSameUser || timeDiff > 300000; // 5 minutes
    
    return (
      <TouchableOpacity
        key={message.id}
        style={[styles.messageWrapper, isOwn && styles.ownMessageWrapper]}
        onLongPress={() => setShowMessageOptions(message.id)}
        activeOpacity={0.7}
      >
        {showAvatar && !isOwn && (
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.avatarText, { color: colors.primary }]}>
                {getUserDisplayName(message.userId).charAt(0).toUpperCase()}
              </Text>
            </View>
          </View>
        )}
        
        <View style={[styles.messageContainer, isOwn && styles.ownMessage]}>
          {showAvatar && !isOwn && (
            <View style={styles.messageHeader}>
              <Text style={[styles.messageAuthor, { color: colors.primary }]}>
                {getUserDisplayName(message.userId)}
              </Text>
              <Text style={[styles.messageTime, { color: colors.text + '50' }]}>
                {formatTime(message.timestamp)}
              </Text>
            </View>
          )}
          <Text style={[styles.messageContent, { color: colors.text }]}>
            {message.content}
          </Text>
          {isOwn && (
            <View style={styles.messageFooter}>
              <Text style={[styles.ownMessageTime, { color: colors.text + '50' }]}>
                {formatTime(message.timestamp)}
              </Text>
              <Text style={[styles.messageStatus, { color: getMessageStatusColor(message) }]}>
                {getMessageStatusIcon(message)}
              </Text>
            </View>
          )}
        </View>

        {/* Message Options */}
        {showMessageOptions === message.id && (
          <View style={[styles.messageOptions, { backgroundColor: colors.card }]}>
            <TouchableOpacity style={styles.optionButton}>
              <Ionicons name="copy" size={16} color={colors.text} />
              <Text style={[styles.optionText, { color: colors.text }]}>Copy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionButton}>
              <Ionicons name="heart" size={16} color={colors.text} />
              <Text style={[styles.optionText, { color: colors.text }]}>React</Text>
            </TouchableOpacity>
            {isOwn && (
              <TouchableOpacity style={styles.optionButton}>
                <Ionicons name="trash" size={16} color="#ff4444" />
                <Text style={[styles.optionText, { color: '#ff4444' }]}>Delete</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
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
            <Text style={[styles.headerTitle, { color: colors.text }]}>FleetPulse Connect</Text>
            {selectedChannel && (
              <View style={styles.channelInfo}>
                <Text style={[styles.channelTitle, { color: colors.primary }]}>
                  #{selectedChannel.name}
                </Text>
                <Text style={[styles.channelDescription, { color: colors.text + '70' }]} numberOfLines={1}>
                  {selectedChannel.description}
                </Text>
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.topHeaderRight}>
          <TouchableOpacity style={styles.headerActionButton}>
            <Ionicons name="search" size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerActionButton}>
            <Ionicons name="notifications" size={20} color={colors.text} />
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
          <View style={styles.sidebarHeader}>
            <Text style={[styles.sidebarTitle, { color: colors.text }]}>Channels</Text>
            <View style={styles.onlineIndicator}>
              <View style={[styles.onlineDot, { backgroundColor: '#4CAF50' }]} />
              <Text style={[styles.onlineCount, { color: colors.text + '70' }]}>
                {onlineUsers.length} online
              </Text>
            </View>
          </View>
          <ScrollView style={styles.channelList} showsVerticalScrollIndicator={false}>
            {channels.map(renderChannel)}
          </ScrollView>
        </Animated.View>

        {/* Chat Area */}
        <Animated.View style={[styles.chatArea, { opacity: fadeAnim }]}>
          {selectedChannel ? (
            <>
              {/* Messages */}
              <ScrollView
                ref={scrollViewRef}
                style={styles.messagesList}
                contentContainerStyle={[
                  styles.messagesContent,
                  { paddingBottom: isKeyboardVisible ? keyboardHeight + 120 : 120 }
                ]}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {messages.map((message, index) => renderMessage(message, index))}
                
                {/* Typing Indicator */}
                {typingUsers.length > 0 && (
                  <View style={styles.typingContainer}>
                    <View style={styles.typingBubble}>
                      <View style={styles.typingDots}>
                        <View style={[styles.typingDot, { backgroundColor: colors.text + '40' }]} />
                        <View style={[styles.typingDot, { backgroundColor: colors.text + '60' }]} />
                        <View style={[styles.typingDot, { backgroundColor: colors.text + '80' }]} />
                      </View>
                      <Text style={[styles.typingText, { color: colors.text + '70' }]}>
                        {typingUsers.map(u => u.displayName || u.username).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                      </Text>
                    </View>
                  </View>
                )}
              </ScrollView>

              {/* Message Input */}
              <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.inputContainer}
              >
                <View style={[styles.messageInput, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
                  <View style={styles.inputWrapper}>
                    <TouchableOpacity style={styles.attachButton}>
                      <Ionicons name="add" size={20} color={colors.text + '70'} />
                    </TouchableOpacity>
                    <TextInput
                      ref={textInputRef}
                      style={[styles.textInput, { color: colors.text }]}
                      placeholder={`Message #${selectedChannel.name.toLowerCase()}`}
                      placeholderTextColor={colors.text + '50'}
                      value={messageText}
                      onChangeText={handleTextChange}
                      onFocus={() => {
                        setIsInputFocused(true);
                        if (!isTablet) setShowSidebar(false);
                      }}
                      onBlur={() => setIsInputFocused(false)}
                      multiline
                      maxLength={2000}
                      returnKeyType="send"
                      onSubmitEditing={handleSendMessage}
                      blurOnSubmit={false}
                    />
                    <TouchableOpacity
                      style={[
                        styles.sendButton, 
                        { backgroundColor: messageText.trim() ? colors.primary : colors.border }
                      ]}
                      onPress={handleSendMessage}
                      disabled={!messageText.trim()}
                    >
                      <Ionicons name="send" size={18} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              </KeyboardAvoidingView>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  channelInfo: {
    marginTop: 2,
  },
  channelTitle: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
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
    padding: 12,
    marginLeft: 4,
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
    borderRightWidth: 1,
    paddingTop: 20,
    zIndex: 1000,
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sidebarTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
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
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderLeftWidth: 3,
    marginVertical: 2,
    position: 'relative',
  },
  channelIcon: {
    marginRight: 16,
    width: 24,
    alignItems: 'center',
  },
  channelInfo: {
    flex: 1,
  },
  channelName: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 2,
  },
  channelDesc: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  chatArea: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-end',
    position: 'relative',
  },
  ownMessageWrapper: {
    justifyContent: 'flex-end',
  },
  avatarContainer: {
    marginRight: 12,
    marginBottom: 4,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
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
    marginBottom: 6,
  },
  messageAuthor: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  messageTime: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  messageContent: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: 'Inter_400Regular',
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
  },
  messageStatus: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  messageOptions: {
    position: 'absolute',
    right: 0,
    top: 0,
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginHorizontal: 4,
  },
  optionText: {
    fontSize: 12,
    marginLeft: 4,
    fontFamily: 'Inter_500Medium',
  },
  typingContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  typingDots: {
    flexDirection: 'row',
    marginRight: 8,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 1,
  },
  typingText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  messageInput: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  attachButton: {
    padding: 8,
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    maxHeight: 100,
    paddingVertical: 8,
    lineHeight: 20,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
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
});
