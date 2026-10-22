import { supabase } from '../lib/supabase';
import type { ChatSession, ChatMessage, UserAnalytics } from '../lib/supabase';

class ChatService {
  private currentSessionId: string | null = null;

  // Create new chat session
  async createChatSession(userId: string): Promise<string | null> {
    try {
      // Ensure we have a valid authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.id !== userId) {
        console.error('User not authenticated or ID mismatch');
        return null;
      }

      const { data, error } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: userId,
          session_start: new Date().toISOString()
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error creating chat session:', error);
        return null;
      }

      this.currentSessionId = data.id;
      
      // Update daily analytics
      await this.updateDailyAnalytics(userId, { sessions_count: 1 });
      
      return data.id;
    } catch (error) {
      console.error('Error in createChatSession:', error);
      return null;
    }
  }

  // End current chat session
  async endChatSession(sessionId: string, rating?: number): Promise<void> {
    try {
      const updates: any = {
        session_end: new Date().toISOString()
      };

      if (rating) {
        updates.session_rating = rating;
      }

      const { error } = await supabase
        .from('chat_sessions')
        .update(updates)
        .eq('id', sessionId);

      if (error) {
        console.error('Error ending chat session:', error);
      }

      this.currentSessionId = null;
    } catch (error) {
      console.error('Error in endChatSession:', error);
    }
  }

  // Save chat message
  async saveChatMessage(
    sessionId: string,
    userId: string,
    messageType: 'user' | 'ai',
    content: string,
    metadata?: {
      sentiment?: string;
      keywords?: string[];
      aiFramework?: string;
      confidenceScore?: number;
    }
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          user_id: userId,
          message_type: messageType,
          content: content,
          sentiment: metadata?.sentiment,
          keywords: metadata?.keywords,
          ai_framework: metadata?.aiFramework,
          confidence_score: metadata?.confidenceScore
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error saving chat message:', error);
        return null;
      }

      // Update session message count
      await this.updateSessionMessageCount(sessionId);
      
      // Update daily analytics for user messages
      if (messageType === 'user') {
        await this.updateDailyAnalytics(userId, { messages_sent: 1 });
      }

      return data.id;
    } catch (error) {
      console.error('Error in saveChatMessage:', error);
      return null;
    }
  }

  // Update session message count
  private async updateSessionMessageCount(sessionId: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('increment_message_count', {
        session_id: sessionId
      });

      if (error) {
        // Fallback: manual count update
        const { data: messages } = await supabase
          .from('chat_messages')
          .select('id')
          .eq('session_id', sessionId);

        if (messages) {
          await supabase
            .from('chat_sessions')
            .update({ message_count: messages.length })
            .eq('id', sessionId);
        }
      }
    } catch (error) {
      console.error('Error updating message count:', error);
    }
  }

  // Get chat history for a session
  async getChatHistory(sessionId: string): Promise<ChatMessage[]> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: true });

      if (error) {
        console.error('Error fetching chat history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getChatHistory:', error);
      return [];
    }
  }

  // Get user's recent chat sessions
  async getRecentSessions(userId: string, limit: number = 10): Promise<ChatSession[]> {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('session_start', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching recent sessions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getRecentSessions:', error);
      return [];
    }
  }

  // Update daily analytics
  async updateDailyAnalytics(
    userId: string, 
    updates: {
      sessions_count?: number;
      messages_sent?: number;
      time_spent_minutes?: number;
      mood_score?: number;
    }
  ): Promise<void> {
    try {
      const { error } = await supabase.rpc('update_daily_analytics', {
        p_user_id: userId,
        p_session_increment: updates.sessions_count || 0,
        p_message_increment: updates.messages_sent || 0,
        p_time_increment: updates.time_spent_minutes || 0,
        p_mood_score: updates.mood_score || null
      });

      if (error) {
        console.error('Error updating daily analytics:', error);
      }
    } catch (error) {
      console.error('Error in updateDailyAnalytics:', error);
    }
  }

  // Get user analytics
  async getUserAnalytics(userId: string, days: number = 30): Promise<UserAnalytics[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('user_analytics')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching user analytics:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserAnalytics:', error);
      return [];
    }
  }

  // Update session with AI analysis
  async updateSessionAnalysis(
    sessionId: string,
    analysis: {
      sentimentAnalysis?: any;
      topicsDiscussed?: string[];
      aiFrameworksUsed?: string[];
    }
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({
          sentiment_analysis: analysis.sentimentAnalysis,
          topics_discussed: analysis.topicsDiscussed,
          ai_frameworks_used: analysis.aiFrameworksUsed
        })
        .eq('id', sessionId);

      if (error) {
        console.error('Error updating session analysis:', error);
      }
    } catch (error) {
      console.error('Error in updateSessionAnalysis:', error);
    }
  }

  // Get current session ID
  getCurrentSessionId(): string | null {
    return this.currentSessionId;
  }

  // Set current session ID
  setCurrentSessionId(sessionId: string): void {
    this.currentSessionId = sessionId;
  }
}

export const chatService = new ChatService();