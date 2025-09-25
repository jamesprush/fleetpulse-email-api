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
  Keyboard
} from 'react-native';
import { useTheme, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useConnect } from '../context/ConnectContext';
import { Channel, Message, User } from '../types/connect';
import LoginScreen from './LoginScreen';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isTablet = screenWidth > 768;
const sidebarWidth = isTablet ? 280 : screenWidth * 0.85;

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
    setSelectedChannel(channel);
    if (!isTablet) {
      setShowSidebar(false);
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

  const renderChannel = (channel: Channel) => {
    const isSelected = selectedChannel?.id === channel.id;
    
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
      <View key={message.id} style={[styles.messageWrapper, isOwn && styles.ownMessageWrapper]}>
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
            <Text style={[styles.ownMessageTime, { color: colors.text + '50' }]}>
              {formatTime(message.timestamp)}
            </Text>
          )}
        </View>
      </View>
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
        {showSidebar && (
          <View style={[styles.sidebar, { backgroundColor: colors.card, borderRightColor: colors.border, width: sidebarWidth }]}>
            <View style={styles.sidebarHeader}>
              <Text style={[styles.sidebarTitle, { color: colors.text }]}>Channels</Text>
              <Text style={[styles.onlineCount, { color: colors.text + '70' }]}>
                {onlineUsers.length} online
              </Text>
            </View>
            <ScrollView style={styles.channelList}>
              {channels.map(renderChannel)}
            </ScrollView>
          </View>
        )}

        {/* Chat Area */}
        <View style={styles.chatArea}>
          {selectedChannel ? (
            <>
              {/* Messages */}
              <ScrollView
                ref={scrollViewRef}
                style={styles.messagesList}
                contentContainerStyle={[
                  styles.messagesContent,
                  { paddingBottom: isKeyboardVisible ? keyboardHeight + 100 : 100 }
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
              <Ionicons name="chatbubbles-outline" size={64} color={colors.text + '30'} />
              <Text style={[styles.emptyStateText, { color: colors.text + '70' }]}>
                Select a channel to start messaging
              </Text>
            </View>
          )}
        </View>
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
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    borderRightWidth: 1,
    paddingTop: 20,
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
  },
  channelIcon: {
    marginRight: 16,
    width: 24,
    alignItems: 'center',
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
  },
  ownMessageWrapper: {
    justifyContent: 'flex-end',
  },
  avatarContainer: {
    marginRight: 12,
    marginBottom: 4,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
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
  ownMessageTime: {
    fontSize: 11,
    marginTop: 4,
    textAlign: 'right',
    fontFamily: 'Inter_400Regular',
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
    fontSize: 18,
    textAlign: 'center',
    marginTop: 20,
    fontFamily: 'Inter_500Medium',
  },
});
