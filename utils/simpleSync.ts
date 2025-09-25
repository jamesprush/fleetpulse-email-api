// Simple cross-device sync using a shared global state
// This simulates real-time communication between different devices

interface MessageUpdate {
  type: 'message' | 'typing' | 'typing_stop';
  channelId: string;
  data: any;
  timestamp: number;
  fromUserId?: string;
}

// Global state that simulates a server
let globalState = {
  messages: {} as { [channelId: string]: any[] },
  typingUsers: {} as { [channelId: string]: Set<string> },
  lastUpdate: 0
};

let listeners: ((update: MessageUpdate) => void)[] = [];
let pollInterval: NodeJS.Timeout | null = null;

// Start polling for updates
function startPolling() {
  if (pollInterval) return;
  
  pollInterval = setInterval(() => {
    // Check if there are new messages
    if (globalState.lastUpdate > 0) {
      // Broadcast all recent messages
      Object.keys(globalState.messages).forEach(channelId => {
        const messages = globalState.messages[channelId];
        if (messages.length > 0) {
          const latestMessage = messages[messages.length - 1];
          
          // Only broadcast if this is a recent message (within last 5 seconds)
          if (Date.now() - latestMessage.timestamp < 5000) {
            console.log('🔄 Polling found new message:', latestMessage.content, 'in channel', channelId);
            listeners.forEach(listener => {
              try {
                listener({
                  type: 'message',
                  channelId,
                  data: latestMessage,
                  timestamp: latestMessage.timestamp,
                  fromUserId: latestMessage.userId
                });
              } catch (error) {
                console.error('Error in sync listener:', error);
              }
            });
          }
        }
      });
    }
  }, 1000); // Check every second
}

// Start polling immediately
startPolling();

class SimpleSync {
  subscribe(listener: (update: MessageUpdate) => void) {
    listeners.push(listener);
    
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  }

  async broadcast(update: MessageUpdate) {
    console.log('🔄 Broadcasting update:', update.type, update.channelId, update.data?.content || '');
    
    // Update global state
    if (update.type === 'message') {
      if (!globalState.messages[update.channelId]) {
        globalState.messages[update.channelId] = [];
      }
      globalState.messages[update.channelId].push(update.data);
      globalState.lastUpdate = Date.now();
      console.log('📝 Message stored in global state:', globalState.messages[update.channelId].length, 'messages');
    } else if (update.type === 'typing') {
      if (!globalState.typingUsers[update.channelId]) {
        globalState.typingUsers[update.channelId] = new Set();
      }
      globalState.typingUsers[update.channelId].add(update.fromUserId || '');
    } else if (update.type === 'typing_stop') {
      if (globalState.typingUsers[update.channelId]) {
        globalState.typingUsers[update.channelId].delete(update.fromUserId || '');
      }
    }

    // Broadcast to all listeners
    console.log('📡 Broadcasting to', listeners.length, 'listeners');
    listeners.forEach(listener => {
      try {
        listener(update);
      } catch (error) {
        console.error('Error in sync listener:', error);
      }
    });
  }

  getMessages(channelId: string) {
    return globalState.messages[channelId] || [];
  }

  getTypingUsers(channelId: string) {
    return Array.from(globalState.typingUsers[channelId] || []);
  }
}

// Global instance
export const simpleSync = new SimpleSync();

// Simulate network delay
export const simulateNetworkDelay = (callback: () => void, delay: number = 100) => {
  setTimeout(callback, delay);
};
