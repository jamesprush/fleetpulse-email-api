// Cross-device sync using a simple polling mechanism
// This simulates real-time communication between different devices

interface MessageUpdate {
  type: 'message' | 'typing' | 'typing_stop';
  channelId: string;
  data: any;
  timestamp: number;
  fromUserId?: string;
}

// Simple in-memory store that simulates a server
let serverMessages: { [channelId: string]: any[] } = {};
let serverTypingUsers: { [channelId: string]: Set<string> } = {};
let messageCounter = 0;

class CrossDeviceSync {
  private listeners: ((update: MessageUpdate) => void)[] = [];
  private pollInterval: NodeJS.Timeout | null = null;
  private lastSyncTime = 0;

  constructor() {
    this.startPolling();
  }

  subscribe(listener: (update: MessageUpdate) => void) {
    this.listeners.push(listener);
    
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private startPolling() {
    // Poll for updates every 500ms
    this.pollInterval = setInterval(() => {
      // Check for new messages in all channels
      Object.keys(serverMessages).forEach(channelId => {
        const messages = serverMessages[channelId];
        if (messages.length > 0) {
          const latestMessage = messages[messages.length - 1];
          
          // Only broadcast if this is a new message
          if (latestMessage.timestamp > this.lastSyncTime) {
            this.lastSyncTime = latestMessage.timestamp;
            
            this.listeners.forEach(listener => {
              try {
                listener({
                  type: 'message',
                  channelId,
                  data: latestMessage,
                  timestamp: latestMessage.timestamp,
                  fromUserId: latestMessage.userId
                });
              } catch (error) {
                console.error('Error in cross-device listener:', error);
              }
            });
          }
        }
      });
    }, 500);
  }

  async broadcast(update: MessageUpdate) {
    // Store the update on the "server"
    if (update.type === 'message') {
      if (!serverMessages[update.channelId]) {
        serverMessages[update.channelId] = [];
      }
      serverMessages[update.channelId].push(update.data);
    } else if (update.type === 'typing') {
      if (!serverTypingUsers[update.channelId]) {
        serverTypingUsers[update.channelId] = new Set();
      }
      serverTypingUsers[update.channelId].add(update.fromUserId || '');
    } else if (update.type === 'typing_stop') {
      if (serverTypingUsers[update.channelId]) {
        serverTypingUsers[update.channelId].delete(update.fromUserId || '');
      }
    }

    // Broadcast to all listeners in this instance
    this.listeners.forEach(listener => {
      try {
        listener(update);
      } catch (error) {
        console.error('Error in cross-device listener:', error);
      }
    });
  }

  getMessages(channelId: string) {
    return serverMessages[channelId] || [];
  }

  getTypingUsers(channelId: string) {
    return Array.from(serverTypingUsers[channelId] || []);
  }

  destroy() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }
}

// Global instance
export const crossDeviceSync = new CrossDeviceSync();

// Simulate network delay
export const simulateNetworkDelay = (callback: () => void, delay: number = 100) => {
  setTimeout(callback, delay);
};
