// Supabase service layer for FleetPulse Connect
import { supabase, TABLES, REALTIME_CHANNELS } from '../config/supabase';
import { User, Channel, Message } from '../types/connect';

export class SupabaseService {
  // Authentication methods
  static async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    return data;
  }

  static async signUp(email: string, password: string, userData: Partial<User>) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    });
    
    if (error) throw error;
    return data;
  }

  static async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  static async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  // User methods
  static async getUserProfile(userId: string): Promise<User | null> {
    // Get the authenticated user's email first
    const { data: authUser } = await supabase.auth.getUser();
    
    if (!authUser.user?.email) {
      console.error('No authenticated user found');
      return null;
    }

    // Find user profile by email (this is more reliable)
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .select('*')
      .eq('email', authUser.user.email)
      .single();
    
    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
    
    return data;
  }

  static async updateUserStatus(userId: string, status: 'online' | 'offline' | 'away') {
    const { error } = await supabase
      .from(TABLES.USERS)
      .update({ 
        status,
        last_seen: new Date().toISOString()
      })
      .eq('id', userId);
    
    if (error) throw error;
  }

  // Channel methods
  static async getChannelsForUser(userId: string): Promise<Channel[]> {
    const { data, error } = await supabase
      .from(TABLES.CHANNELS)
      .select(`
        *,
        channel_members!inner(user_id)
      `)
      .eq('channel_members.user_id', userId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching channels:', error);
      return [];
    }
    
    return data.map(channel => ({
      id: channel.id,
      name: channel.name,
      description: channel.description,
      type: channel.type,
      permissions: {
        read: ['admin', 'manager', 'driver'], // Simplified for now
        write: ['admin', 'manager', 'driver'],
        admin: ['admin']
      },
      isPrivate: channel.is_private,
      members: channel.channel_members?.map((cm: any) => cm.user_id) || [],
      createdAt: new Date(channel.created_at).getTime(),
      createdBy: channel.created_by
    }));
  }

  static async getChannelMembers(channelId: string): Promise<User[]> {
    const { data, error } = await supabase
      .from(TABLES.CHANNEL_MEMBERS)
      .select(`
        user_id,
        users!inner(*)
      `)
      .eq('channel_id', channelId);
    
    if (error) {
      console.error('Error fetching channel members:', error);
      return [];
    }
    
    return data.map((member: any) => ({
      id: member.users.id,
      username: member.users.username,
      displayName: member.users.display_name,
      email: member.users.email,
      role: member.users.role,
      status: member.users.status,
      lastSeen: new Date(member.users.last_seen).getTime(),
      createdAt: new Date(member.users.created_at).getTime()
    }));
  }

  // Message methods
  static async getMessagesForChannel(channelId: string, limit = 50): Promise<Message[]> {
    const { data, error } = await supabase
      .from(TABLES.MESSAGES)
      .select(`
        *,
        users!inner(username, display_name)
      `)
      .eq('channel_id', channelId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
    
    return data.map((msg: any) => ({
      id: msg.id,
      channelId: msg.channel_id,
      userId: msg.user_id,
      content: msg.content,
      type: msg.type,
      timestamp: new Date(msg.created_at).getTime(),
      editedAt: msg.updated_at ? new Date(msg.updated_at).getTime() : undefined,
      replyTo: msg.reply_to,
      reactions: [], // TODO: Implement reactions
      attachments: [], // TODO: Implement attachments
      isPinned: msg.is_pinned,
      isDeleted: msg.is_deleted,
      status: 'delivered', // TODO: Implement read status
      readBy: [] // TODO: Implement read receipts
    }));
  }

  static async sendMessage(channelId: string, userId: string, content: string): Promise<Message> {
    const { data, error } = await supabase
      .from(TABLES.MESSAGES)
      .insert({
        channel_id: channelId,
        user_id: userId,
        content,
        type: 'text'
      })
      .select(`
        *,
        users!inner(username, display_name)
      `)
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      channelId: data.channel_id,
      userId: data.user_id,
      content: data.content,
      type: data.type,
      timestamp: new Date(data.created_at).getTime(),
      editedAt: data.updated_at ? new Date(data.updated_at).getTime() : undefined,
      replyTo: data.reply_to,
      reactions: [],
      attachments: [],
      isPinned: data.is_pinned,
      isDeleted: data.is_deleted,
      status: 'delivered',
      readBy: []
    };
  }

  // Real-time subscriptions
  static subscribeToMessages(channelId: string, callback: (message: Message) => void) {
    return supabase
      .channel(`${REALTIME_CHANNELS.MESSAGES}:${channelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: TABLES.MESSAGES,
          filter: `channel_id=eq.${channelId}`
        },
        async (payload) => {
          console.log('📨 New message received:', payload);
          
          // Fetch the full message with user data
          const { data: messageData } = await supabase
            .from(TABLES.MESSAGES)
            .select(`
              *,
              users!inner(username, display_name)
            `)
            .eq('id', payload.new.id)
            .single();
          
          if (messageData) {
            const message: Message = {
              id: messageData.id,
              channelId: messageData.channel_id,
              userId: messageData.user_id,
              content: messageData.content,
              type: messageData.type,
              timestamp: new Date(messageData.created_at).getTime(),
              editedAt: messageData.updated_at ? new Date(messageData.updated_at).getTime() : undefined,
              replyTo: messageData.reply_to,
              reactions: [],
              attachments: [],
              isPinned: messageData.is_pinned,
              isDeleted: messageData.is_deleted,
              status: 'delivered',
              readBy: []
            };
            
            callback(message);
          }
        }
      )
      .subscribe();
  }

  static subscribeToTyping(channelId: string, callback: (typingUsers: string[]) => void) {
    return supabase
      .channel(`${REALTIME_CHANNELS.TYPING}:${channelId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: TABLES.TYPING_INDICATORS,
          filter: `channel_id=eq.${channelId}`
        },
        async () => {
          // Fetch current typing users
          const { data } = await supabase
            .from(TABLES.TYPING_INDICATORS)
            .select('user_id')
            .eq('channel_id', channelId)
            .gte('started_at', new Date(Date.now() - 5000).toISOString()); // Last 5 seconds
          
          const typingUsers = data?.map(t => t.user_id) || [];
          callback(typingUsers);
        }
      )
      .subscribe();
  }

  static async setTyping(channelId: string, userId: string, isTyping: boolean) {
    if (isTyping) {
      // Insert or update typing indicator
      await supabase
        .from(TABLES.TYPING_INDICATORS)
        .upsert({
          channel_id: channelId,
          user_id: userId,
          started_at: new Date().toISOString()
        });
    } else {
      // Remove typing indicator
      await supabase
        .from(TABLES.TYPING_INDICATORS)
        .delete()
        .eq('channel_id', channelId)
        .eq('user_id', userId);
    }
  }

  // Cleanup methods
  static async cleanup() {
    // Clean up old typing indicators (older than 10 seconds)
    await supabase
      .from(TABLES.TYPING_INDICATORS)
      .delete()
      .lt('started_at', new Date(Date.now() - 10000).toISOString());
  }
}
