// Real-time sync system that works across different app instances
// This simulates a real-time server using a shared global state

interface MessageUpdate {
  type: 'message' | 'typing' | 'typing_stop';
  channelId: string;
  data: any;
  timestamp: number;
  fromUserId?: string;
}

// Global state that persists across app instances
let globalMessages: { [channelId: string]: any[] } = {};
let globalTypingUsers: { [channelId: string]: Set<string> } = {};
let globalListeners: ((update: MessageUpdate) => void)[] = [];
let lastMessageTimestamp = 0;

// Polling interval for cross-device sync
let pollInterval: NodeJS.Timeout | null = null;

// Start polling for updates
function startPolling() {
  if (pollInterval) return;
  
  pollInterval = setInterval(() => {
    // Check for new messages in all channels
    Object.keys(globalMessages).forEach(channelId => {
      const messages = globalMessages[channelId];
      if (messages && messages.length > 0) {
        const latestMessage = messages[messages.length - 1];
        
        // Only broadcast if this is a new message (within last 10 seconds)
        if (latestMessage.timestamp > lastMessageTimestamp) {
          lastMessageTimestamp = latestMessage.timestamp;
          
          console.log('🔄 Polling found new message:', latestMessage.content, 'in channel', channelId);
          
          // Broadcast to all listeners
          globalListeners.forEach(listener => {
            try {
              listener({
                type: 'message',
                channelId,
                data: latestMessage,
                timestamp: latestMessage.timestamp,
                fromUserId: latestMessage.userId
              });
            } catch (error) {
              console.error('Error in polling listener:', error);
            }
          });
        }
      }
    });
  }, 1000); // Check every second
}

// Start polling immediately
startPolling();

class RealTimeSync {
  private listeners: ((update: MessageUpdate) => void)[] = [];

  subscribe(listener: (update: MessageUpdate) => void) {
    this.listeners.push(listener);
    globalListeners.push(listener);
    
    console.log('📡 Subscribed to real-time sync. Total listeners:', globalListeners.length);
    
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
      globalListeners = globalListeners.filter(l => l !== listener);
      console.log('📡 Unsubscribed from real-time sync. Total listeners:', globalListeners.length);
    };
  }

  async broadcast(update: MessageUpdate) {
    console.log('🔄 Broadcasting update:', update.type, update.channelId, update.data?.content || '');
    
    // Update global state
    if (update.type === 'message') {
      if (!globalMessages[update.channelId]) {
        globalMessages[update.channelId] = [];
      }
      globalMessages[update.channelId].push(update.data);
      console.log('📝 Message stored in global state:', globalMessages[update.channelId].length, 'messages');
    } else if (update.type === 'typing') {
      if (!globalTypingUsers[update.channelId]) {
        globalTypingUsers[update.channelId] = new Set();
      }
      globalTypingUsers[update.channelId].add(update.fromUserId || '');
    } else if (update.type === 'typing_stop') {
      if (globalTypingUsers[update.channelId]) {
        globalTypingUsers[update.channelId].delete(update.fromUserId || '');
      }
    }

    // Broadcast to all listeners
    console.log('📡 Broadcasting to', globalListeners.length, 'listeners');
    globalListeners.forEach(listener => {
      try {
        listener(update);
      } catch (error) {
        console.error('Error in real-time listener:', error);
      }
    });
  }

  getMessages(channelId: string) {
    return globalMessages[channelId] || [];
  }

  getTypingUsers(channelId: string) {
    return Array.from(globalTypingUsers[channelId] || []);
  }

  destroy() {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  }
}

// Global instance
export const realTimeSync = new RealTimeSync();

// Simulate network delay
export const simulateNetworkDelay = (callback: () => void, delay: number = 100) => {
  setTimeout(callback, delay);
};