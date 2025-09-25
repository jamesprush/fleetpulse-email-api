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
const sidebarWidth = isTablet ? 280 : screenWidth * 0.35;

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
  const [keyboardAnimationDuration, setKeyboardAnimationDuration] = useState(250);
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
        const duration = e.duration || 250;
        
        setIsKeyboardVisible(true);
        setKeyboardHeight(height);
        setKeyboardAnimationDuration(duration);
        
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, Platform.OS === 'ios' ? 50 : 100);
      }
    );

    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      (e) => {
        const duration = e.duration || 250;
        
        setIsKeyboardVisible(false);
        setKeyboardHeight(0);
        setKeyboardAnimationDuration(duration);
      }
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, []);

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
    const userMap: { [key: string]: string } = {
      'admin1': 'James Prush',
      'driver1': 'Wes Johnson'
    };
    return userMap[userId] || 'Unknown User';
  };

  const renderChannel = (channel: Channel) => {
    const isSelected = selectedChannel?.id === channel.id;
    const hasUnread = false;
    
    return (
      <TouchableOpacity
        key={channel.id}
        style={[
          styles.channelItem,
          { 
            backgroundColor: isSelected ? colors.primary + '20' : 'transparent',
            borderLeftColor: isSelected ? colors.primary : 'transparent'
          }
        ]}
        onPress={() => handleChannelSelect(channel)}
      >
        <View style={styles.channelIcon}>
          <Ionicons 
            name={channel.type === 'announcement' ? 'megaphone' : 'chatbubbles'} 
            size={20} 
            color={isSelected ? colors.primary : colors.text} 
          />
        </View>
        <View style={styles.channelInfo}>
          <Text style={[
            styles.channelName, 
            { color: isSelected ? colors.primary : colors.text }
          ]}>
            {channel.name || 'Unknown Channel'}
          </Text>
          <Text style={[styles.channelDesc, { color: colors.text }]}>
            {channel.members?.length || 0} member{(channel.members?.length || 0) !== 1 ? 's' : ''}
          </Text>
        </View>
        {hasUnread && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
      </TouchableOpacity>
    );
  };

  const renderMessage = (message: Message) => {
    const isOwn = currentUser?.id === message.userId;
    
    return (
      <View key={message.id} style={[styles.messageContainer, isOwn && styles.ownMessage]}>
        <View style={styles.messageHeader}>
          <Text style={[styles.messageAuthor, { color: colors.primary }]}>
            {getUserDisplayName(message.userId)}
          </Text>
          <Text style={[styles.messageTime, { color: colors.text }]}>
            {formatTime(message.timestamp)}
          </Text>
        </View>
        <Text style={[styles.messageContent, { color: colors.text }]}>
          {message.content}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
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
                  <Text style={[styles.channelDescription, { color: colors.text }]} numberOfLines={1}>
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
                <Text style={[styles.onlineCount, { color: colors.text }]}>
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
                  style={[styles.messagesList, { marginBottom: isKeyboardVisible ? keyboardHeight * 0.8 : 0 }]}
                  contentContainerStyle={{ paddingBottom: isKeyboardVisible ? keyboardHeight + 100 : 20 }}
                  showsVerticalScrollIndicator={false}
                >
                  {messages.map(renderMessage)}
                  
                  {/* Typing Indicator */}
                  {typingUsers.length > 0 && (
                    <View style={styles.typingContainer}>
                      <Text style={[styles.typingText, { color: colors.text }]}>
                        {typingUsers.map(u => u.displayName || u.username).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                      </Text>
                    </View>
                  )}
                </ScrollView>

                {/* Message Input */}
                <View style={[styles.messageInput, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
                  <TextInput
                    ref={textInputRef}
                    style={[styles.textInput, { color: colors.text }]}
                    placeholder="Type a message..."
                    placeholderTextColor={colors.text + '60'}
                    value={messageText}
                    onChangeText={handleTextChange}
                    multiline
                    maxLength={1000}
                  />
                  <TouchableOpacity
                    style={[styles.sendButton, { backgroundColor: colors.primary }]}
                    onPress={handleSendMessage}
                    disabled={!messageText.trim()}
                  >
                    <Ionicons name="send" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="chatbubbles-outline" size={64} color={colors.text + '40'} />
                <Text style={[styles.emptyStateText, { color: colors.text }]}>
                  Select a channel to start messaging
                </Text>
              </View>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuButton: {
    marginRight: 12,
    padding: 4,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  channelInfo: {
    marginTop: 2,
  },
  channelTitle: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
  },
  channelDescription: {
    fontSize: 12,
    opacity: 0.7,
    fontFamily: 'Inter_400Regular',
  },
  topHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActionButton: {
    padding: 8,
    marginLeft: 8,
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    borderRightWidth: 1,
    paddingTop: 16,
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  sidebarTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  onlineCount: {
    fontSize: 12,
    opacity: 0.7,
    fontFamily: 'Inter_400Regular',
  },
  channelList: {
    flex: 1,
  },
  channelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderLeftWidth: 3,
  },
  channelIcon: {
    marginRight: 12,
  },
  channelName: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
  },
  channelDesc: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2,
    fontFamily: 'Inter_400Regular',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 'auto',
  },
  chatArea: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messageContainer: {
    marginVertical: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    maxWidth: '80%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(255, 149, 0, 0.2)',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  messageAuthor: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  messageTime: {
    fontSize: 10,
    opacity: 0.7,
    fontFamily: 'Inter_400Regular',
  },
  messageContent: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Inter_400Regular',
  },
  typingContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  typingText: {
    fontSize: 12,
    fontStyle: 'italic',
    opacity: 0.7,
    fontFamily: 'Inter_400Regular',
  },
  messageInput: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    opacity: 0.7,
    fontFamily: 'Inter_400Regular',
  },
});
