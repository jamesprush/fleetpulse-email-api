// Global sync system for cross-device communication
// This simulates a real-time server by using a shared state

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
let lastMessageId = 0;

class GlobalSync {
  private listeners: ((update: MessageUpdate) => void)[] = [];

  subscribe(listener: (update: MessageUpdate) => void) {
    this.listeners.push(listener);
    globalListeners.push(listener);
    
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
      globalListeners = globalListeners.filter(l => l !== listener);
    };
  }

  async broadcast(update: MessageUpdate) {
    // Store the update globally
    if (update.type === 'message') {
      if (!globalMessages[update.channelId]) {
        globalMessages[update.channelId] = [];
      }
      globalMessages[update.channelId].push(update.data);
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

    // Broadcast to all listeners across all app instances
    globalListeners.forEach(listener => {
      try {
        listener(update);
      } catch (error) {
        console.error('Error in global listener:', error);
      }
    });
  }

  getMessages(channelId: string) {
    return globalMessages[channelId] || [];
  }

  getTypingUsers(channelId: string) {
    return Array.from(globalTypingUsers[channelId] || []);
  }

  // Simulate cross-device sync by checking for new messages
  startPolling() {
    setInterval(() => {
      // This would normally check a server, but for demo we'll use the global state
      Object.keys(globalMessages).forEach(channelId => {
        const messages = globalMessages[channelId];
        if (messages.length > 0) {
          const latestMessage = messages[messages.length - 1];
          
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
      });
    }, 1000); // Check every second
  }
}

// Global instance
export const globalSync = new GlobalSync();

// Start polling for cross-device sync
globalSync.startPolling();

// Simulate network delay
export const simulateNetworkDelay = (callback: () => void, delay: number = 100) => {
  setTimeout(callback, delay);
};
