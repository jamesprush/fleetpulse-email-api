// Shared state for cross-device communication
// This creates a simple in-memory "server" that both devices can access

interface Message {
  id: string;
  channelId: string;
  userId: string;
  content: string;
  timestamp: number;
  status: 'sending' | 'delivered' | 'read';
  readBy: string[];
}

interface TypingUser {
  userId: string;
  channelId: string;
  timestamp: number;
}

// Global shared state
let sharedMessages: { [channelId: string]: Message[] } = {};
let sharedTypingUsers: { [channelId: string]: TypingUser[] } = {};
let listeners: ((type: string, data: any) => void)[] = [];

// Simulate a simple server
class SharedState {
  private deviceId: string;

  constructor() {
    this.deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log('🔗 Device connected:', this.deviceId);
  }

  // Subscribe to updates
  subscribe(callback: (type: string, data: any) => void) {
    listeners.push(callback);
    console.log('📡 Subscribed to shared state. Total listeners:', listeners.length);
    
    return () => {
      listeners = listeners.filter(l => l !== callback);
      console.log('📡 Unsubscribed from shared state. Total listeners:', listeners.length);
    };
  }

  // Add a message
  addMessage(message: Omit<Message, 'id' | 'timestamp' | 'status' | 'readBy'>) {
    const newMessage: Message = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      status: 'delivered',
      readBy: [message.userId]
    };

    if (!sharedMessages[message.channelId]) {
      sharedMessages[message.channelId] = [];
    }
    sharedMessages[message.channelId].push(newMessage);

    console.log('💬 Message added:', newMessage.content, 'to channel', message.channelId);
    
    // Notify all listeners
    this.notifyListeners('message', newMessage);
    
    return newMessage;
  }

  // Get messages for a channel
  getMessages(channelId: string): Message[] {
    return sharedMessages[channelId] || [];
  }

  // Set typing status
  setTyping(userId: string, channelId: string, isTyping: boolean) {
    if (!sharedTypingUsers[channelId]) {
      sharedTypingUsers[channelId] = [];
    }

    if (isTyping) {
      // Add or update typing user
      const existingIndex = sharedTypingUsers[channelId].findIndex(u => u.userId === userId);
      if (existingIndex >= 0) {
        sharedTypingUsers[channelId][existingIndex].timestamp = Date.now();
      } else {
        sharedTypingUsers[channelId].push({
          userId,
          channelId,
          timestamp: Date.now()
        });
      }
    } else {
      // Remove typing user
      sharedTypingUsers[channelId] = sharedTypingUsers[channelId].filter(u => u.userId !== userId);
    }

    // Clean up old typing users (older than 5 seconds)
    const now = Date.now();
    sharedTypingUsers[channelId] = sharedTypingUsers[channelId].filter(u => now - u.timestamp < 5000);

    console.log('⌨️ Typing status updated:', userId, 'in channel', channelId, 'isTyping:', isTyping);
    
    // Notify all listeners
    this.notifyListeners('typing', {
      userId,
      channelId,
      isTyping,
      typingUsers: sharedTypingUsers[channelId].map(u => u.userId)
    });
  }

  // Get typing users for a channel
  getTypingUsers(channelId: string): string[] {
    const now = Date.now();
    return (sharedTypingUsers[channelId] || [])
      .filter(u => now - u.timestamp < 5000)
      .map(u => u.userId);
  }

  // Notify all listeners
  private notifyListeners(type: string, data: any) {
    listeners.forEach(listener => {
      try {
        listener(type, data);
      } catch (error) {
        console.error('Error notifying listener:', error);
      }
    });
  }

  // Get device ID
  getDeviceId(): string {
    return this.deviceId;
  }
}

// Create global instance
export const sharedState = new SharedState();

// Export types
export type { Message, TypingUser };
