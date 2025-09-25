export interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  role: 'admin' | 'manager' | 'driver';
  avatar?: string;
  status: 'online' | 'offline' | 'away';
  lastSeen: number;
  createdAt: number;
}

export interface Channel {
  id: string;
  name: string;
  description?: string;
  type: 'text' | 'announcement' | 'voice';
  category: string; // Category name for Discord-style organization
  permissions: {
    read: string[]; // role names that can read
    write: string[]; // role names that can write
    admin: string[]; // role names that can admin
  };
  isPrivate: boolean;
  members: string[]; // user IDs of members
  lastMessage?: Message;
  createdAt: number;
  createdBy: string;
}

export interface Message {
  id: string;
  channelId: string;
  userId: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
  timestamp: number;
  editedAt?: number;
  replyTo?: string; // message ID being replied to
  reactions: Reaction[];
  attachments?: Attachment[];
  isPinned: boolean;
  isDeleted: boolean;
  status: 'sending' | 'delivered' | 'read';
  readBy: string[]; // user IDs who have read this message
}

export interface Reaction {
  emoji: string;
  userId: string;
  timestamp: number;
}

export interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'file' | 'document';
  url: string;
  size: number;
  uploadedAt: number;
}

export interface DirectMessage {
  id: string;
  participants: string[]; // user IDs
  lastMessage?: Message;
  createdAt: number;
}

export interface NotificationSettings {
  mentions: boolean;
  allMessages: boolean;
  channelUpdates: boolean;
  directMessages: boolean;
  soundEnabled: boolean;
}

export interface ConnectState {
  currentUser: User | null;
  channels: Channel[];
  messages: { [channelId: string]: Message[] };
  users: { [userId: string]: User };
  directMessages: DirectMessage[];
  onlineUsers: string[];
  notifications: NotificationSettings;
  typingUsers: { [channelId: string]: string[] }; // channelId -> user IDs who are typing
}

// Sample data for development - Discord-style organization
export const SAMPLE_CHANNELS: Channel[] = [
  // Welcome Channel (no category)
  {
    id: 'welcome',
    name: 'welcome',
    description: 'Welcome to WheelzUp!',
    type: 'text',
    category: '',
    permissions: {
      read: ['admin', 'manager', 'driver'],
      write: ['admin', 'manager'],
      admin: ['admin']
    },
    isPrivate: false,
    members: ['admin1', 'driver1'],
    createdAt: Date.now() - 86400000 * 30,
    createdBy: 'admin'
  },
  
  // Fleetio Alerts Category
  {
    id: 'overdue-oil',
    name: 'overdue-oil',
    description: 'Oil change overdue alerts',
    type: 'text',
    category: 'Fleetio Alerts',
    permissions: {
      read: ['admin', 'manager'],
      write: ['admin', 'manager'],
      admin: ['admin']
    },
    isPrivate: true,
    members: ['admin1'],
    createdAt: Date.now() - 86400000 * 30,
    createdBy: 'admin'
  },
  {
    id: 'inspection-reports',
    name: 'inspection-reports',
    description: 'Vehicle inspection reports',
    type: 'text',
    category: 'Fleetio Alerts',
    permissions: {
      read: ['admin', 'manager'],
      write: ['admin', 'manager'],
      admin: ['admin']
    },
    isPrivate: true,
    members: ['admin1'],
    createdAt: Date.now() - 86400000 * 25,
    createdBy: 'admin'
  },
  {
    id: 'other-alerts',
    name: 'other',
    description: 'Other Fleetio alerts and notifications',
    type: 'text',
    category: 'Fleetio Alerts',
    permissions: {
      read: ['admin', 'manager'],
      write: ['admin', 'manager'],
      admin: ['admin']
    },
    isPrivate: true,
    members: ['admin1'],
    createdAt: Date.now() - 86400000 * 20,
    createdBy: 'admin'
  },
  {
    id: 'oil-receipts',
    name: 'oil-receipts',
    description: 'Oil change receipts and documentation',
    type: 'text',
    category: 'Fleetio Alerts',
    permissions: {
      read: ['admin', 'manager'],
      write: ['admin', 'manager'],
      admin: ['admin']
    },
    isPrivate: true,
    members: ['admin1'],
    createdAt: Date.now() - 86400000 * 15,
    createdBy: 'admin'
  },
  
  // ADP Leadership Category
  {
    id: 'leadership-general',
    name: 'general',
    description: 'General leadership discussions',
    type: 'text',
    category: 'ADP Leadership',
    permissions: {
      read: ['admin', 'manager'],
      write: ['admin', 'manager'],
      admin: ['admin']
    },
    isPrivate: true,
    members: ['admin1'],
    createdAt: Date.now() - 86400000 * 30,
    createdBy: 'admin'
  },
  {
    id: 'attendance',
    name: 'attendance',
    description: 'Attendance tracking and management',
    type: 'text',
    category: 'ADP Leadership',
    permissions: {
      read: ['admin', 'manager'],
      write: ['admin', 'manager'],
      admin: ['admin']
    },
    isPrivate: true,
    members: ['admin1'],
    createdAt: Date.now() - 86400000 * 25,
    createdBy: 'admin'
  },
  {
    id: 'fleet-maintenance',
    name: 'fleet-maintenance',
    description: 'Fleet maintenance planning and coordination',
    type: 'text',
    category: 'ADP Leadership',
    permissions: {
      read: ['admin', 'manager'],
      write: ['admin', 'manager'],
      admin: ['admin']
    },
    isPrivate: true,
    members: ['admin1'],
    createdAt: Date.now() - 86400000 * 20,
    createdBy: 'admin'
  },
  {
    id: 'accidents',
    name: 'accidents',
    description: 'Accident reports and investigations',
    type: 'text',
    category: 'ADP Leadership',
    permissions: {
      read: ['admin', 'manager'],
      write: ['admin', 'manager'],
      admin: ['admin']
    },
    isPrivate: true,
    members: ['admin1'],
    createdAt: Date.now() - 86400000 * 15,
    createdBy: 'admin'
  },
  {
    id: 'mod-logs',
    name: 'mod-logs',
    description: 'Moderation logs and system activities',
    type: 'text',
    category: 'ADP Leadership',
    permissions: {
      read: ['admin', 'manager'],
      write: ['admin'],
      admin: ['admin']
    },
    isPrivate: true,
    members: ['admin1'],
    createdAt: Date.now() - 86400000 * 10,
    createdBy: 'admin'
  },
  
  // Information Category
  {
    id: 'alerts',
    name: 'alerts',
    description: 'Important alerts and notifications',
    type: 'announcement',
    category: 'Information',
    permissions: {
      read: ['admin', 'manager', 'driver'],
      write: ['admin', 'manager'],
      admin: ['admin']
    },
    isPrivate: false,
    members: ['admin1', 'driver1'],
    createdAt: Date.now() - 86400000 * 30,
    createdBy: 'admin'
  },
  {
    id: 'announcements',
    name: 'announcements',
    description: 'Company announcements and updates',
    type: 'announcement',
    category: 'Information',
    permissions: {
      read: ['admin', 'manager', 'driver'],
      write: ['admin', 'manager'],
      admin: ['admin']
    },
    isPrivate: false,
    members: ['admin1', 'driver1'],
    createdAt: Date.now() - 86400000 * 25,
    createdBy: 'admin'
  },
  {
    id: 'resources',
    name: 'resources',
    description: 'Helpful resources and documentation',
    type: 'text',
    category: 'Information',
    permissions: {
      read: ['admin', 'manager', 'driver'],
      write: ['admin', 'manager'],
      admin: ['admin']
    },
    isPrivate: false,
    members: ['admin1', 'driver1'],
    createdAt: Date.now() - 86400000 * 20,
    createdBy: 'admin'
  },
  
  // Training Academy Category
  {
    id: 'academy-onboarding',
    name: 'academy-onboarding',
    description: 'New employee onboarding and training',
    type: 'text',
    category: 'Training Academy',
    permissions: {
      read: ['admin', 'manager', 'driver'],
      write: ['admin', 'manager'],
      admin: ['admin']
    },
    isPrivate: false,
    members: ['admin1', 'driver1'],
    createdAt: Date.now() - 86400000 * 15,
    createdBy: 'admin'
  },
  {
    id: 'training-chat',
    name: 'training-chat',
    description: 'General training discussions',
    type: 'text',
    category: 'Training Academy',
    permissions: {
      read: ['admin', 'manager', 'driver'],
      write: ['admin', 'manager', 'driver'],
      admin: ['admin', 'manager']
    },
    isPrivate: false,
    members: ['admin1', 'driver1'],
    createdAt: Date.now() - 86400000 * 10,
    createdBy: 'admin'
  },
  {
    id: 'training-updates',
    name: 'training-updates',
    description: 'Training program updates and news',
    type: 'text',
    category: 'Training Academy',
    permissions: {
      read: ['admin', 'manager', 'driver'],
      write: ['admin', 'manager'],
      admin: ['admin']
    },
    isPrivate: false,
    members: ['admin1', 'driver1'],
    createdAt: Date.now() - 86400000 * 5,
    createdBy: 'admin'
  },
  
  // Issues / Reports Category
  {
    id: 'truck-maintenance',
    name: 'truck-maintenance',
    description: 'Truck maintenance issues and reports',
    type: 'text',
    category: 'Issues / Reports',
    permissions: {
      read: ['admin', 'manager', 'driver'],
      write: ['admin', 'manager', 'driver'],
      admin: ['admin', 'manager']
    },
    isPrivate: false,
    members: ['admin1', 'driver1'],
    createdAt: Date.now() - 86400000 * 20,
    createdBy: 'admin'
  },
  {
    id: 'timeclock-issues',
    name: 'timeclock-issues',
    description: 'Timeclock and scheduling issues',
    type: 'text',
    category: 'Issues / Reports',
    permissions: {
      read: ['admin', 'manager', 'driver'],
      write: ['admin', 'manager', 'driver'],
      admin: ['admin', 'manager']
    },
    isPrivate: false,
    members: ['admin1', 'driver1'],
    createdAt: Date.now() - 86400000 * 15,
    createdBy: 'admin'
  },
  {
    id: 'gas-card-issues',
    name: 'gas-card-issues',
    description: 'Gas card and fuel-related issues',
    type: 'text',
    category: 'Issues / Reports',
    permissions: {
      read: ['admin', 'manager', 'driver'],
      write: ['admin', 'manager', 'driver'],
      admin: ['admin', 'manager']
    },
    isPrivate: false,
    members: ['admin1', 'driver1'],
    createdAt: Date.now() - 86400000 * 10,
    createdBy: 'admin'
  },
  {
    id: 'other-issues',
    name: 'other-issues',
    description: 'Other miscellaneous issues and reports',
    type: 'text',
    category: 'Issues / Reports',
    permissions: {
      read: ['admin', 'manager', 'driver'],
      write: ['admin', 'manager', 'driver'],
      admin: ['admin', 'manager']
    },
    isPrivate: false,
    members: ['admin1', 'driver1'],
    createdAt: Date.now() - 86400000 * 5,
    createdBy: 'admin'
  },
  
  // Scheduling / Time Off Category
  {
    id: 'time-off-requests',
    name: 'time-off-requests',
    description: 'Submit and manage time off requests',
    type: 'text',
    category: 'Scheduling / Time Off',
    permissions: {
      read: ['admin', 'manager', 'driver'],
      write: ['admin', 'manager', 'driver'],
      admin: ['admin', 'manager']
    },
    isPrivate: false,
    members: ['admin1', 'driver1'],
    createdAt: Date.now() - 86400000 * 15,
    createdBy: 'admin'
  },
  
  // Social Category
  {
    id: 'off-topic',
    name: 'off-topic',
    description: 'General off-topic discussions',
    type: 'text',
    category: 'Social',
    permissions: {
      read: ['admin', 'manager', 'driver'],
      write: ['admin', 'manager', 'driver'],
      admin: ['admin', 'manager']
    },
    isPrivate: false,
    members: ['admin1', 'driver1'],
    createdAt: Date.now() - 86400000 * 10,
    createdBy: 'admin'
  },
  
  // WheelzUp Meetings Category
  {
    id: 'all-staff-meeting',
    name: 'all-staff-meeting',
    description: 'All staff meeting discussions',
    type: 'text',
    category: 'WheelzUp Meetings',
    permissions: {
      read: ['admin', 'manager', 'driver'],
      write: ['admin', 'manager'],
      admin: ['admin']
    },
    isPrivate: false,
    members: ['admin1', 'driver1'],
    createdAt: Date.now() - 86400000 * 5,
    createdBy: 'admin'
  }
];

export const SAMPLE_USERS: User[] = [
  {
    id: 'admin1',
    username: 'james.admin',
    displayName: 'James Prush',
    email: 'james@WheelzUp.com',
    role: 'admin',
    status: 'online',
    lastSeen: Date.now(),
    createdAt: Date.now() - 86400000 * 365
  },
  {
    id: 'driver1',
    username: 'wes.driver',
    displayName: 'Wes Johnson',
    email: 'wes@WheelzUp.com',
    role: 'driver',
    status: 'online',
    lastSeen: Date.now() - 60000,
    createdAt: Date.now() - 86400000 * 100
  }
];
