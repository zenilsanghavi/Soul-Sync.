import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile, LoginSession } from '../lib/supabase';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

class AuthService {
  // Sign up new user
  async signUp(email: string, password: string, fullName: string): Promise<{ user: AuthUser | null; error: string | null; needsConfirmation?: boolean }> {
    try {
      console.log('AuthService: Starting signup for', email);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      console.log('Supabase signup response:', { 
        user: data?.user?.id, 
        session: !!data?.session,
        error: error?.message 
      });

      if (error) {
        console.error('Supabase signup error:', error);
        
        // Handle specific Supabase errors
        if (error.message.includes('User already registered')) {
          return { user: null, error: 'An account with this email already exists. Please sign in instead.' };
        } else if (error.message.includes('Invalid email')) {
          return { user: null, error: 'Please enter a valid email address.' };
        } else if (error.message.includes('Password should be at least')) {
          return { user: null, error: 'Password must be at least 6 characters long.' };
        } else if (error.message.includes('signup disabled')) {
          return { user: null, error: 'New registrations are currently disabled. Please contact support.' };
        }
        
        return { user: null, error: error.message };
      }

      if (!data.user) {
        console.error('No user data returned from Supabase');
        return { user: null, error: 'Registration failed - no user data received' };
      }

      console.log('User created successfully:', data.user.id);

      // With "Confirm email" enabled in Supabase, there is no session until the user clicks the link
      if (!data.session) {
        return { user: null, error: null, needsConfirmation: true };
      }

      // Wait for database trigger to create profile
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      let profile = await this.getProfile(data.user.id);
      
      if (profile) {
        console.log('Signup process completed successfully');
        return { user: this.mapProfileToUser(profile), error: null };
      } else {
        console.log('Profile creation failed but user exists, returning basic user data');
        return { 
          user: {
            id: data.user.id,
            email: email,
            name: fullName
          },
          error: null 
        };
      }
      
    } catch (error) {
      console.error('Unexpected error in signup:', error);
      const errorMessage = (error as any)?.message || 'An unexpected error occurred during registration';
      
      // Handle network errors
      if (errorMessage.includes('fetch')) {
        return { user: null, error: 'Network error. Please check your internet connection and try again.' };
      }
      
      return { user: null, error: errorMessage };
    }
  }

  // Sign in user
  async signIn(email: string, password: string): Promise<{ user: AuthUser | null; error: string | null }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          return { user: null, error: 'Invalid email or password. Please check your credentials.' };
        }
        return { user: null, error: error.message };
      }

      if (data.user) {
        await this.createLoginSession(data.user.id);
        return { user: await this.buildUser(data.user), error: null };
      }

      return { user: null, error: 'Failed to retrieve user profile' };
    } catch (error) {
      return { user: null, error: 'An unexpected error occurred' };
    }
  }

  // Send the signup confirmation email again
  async resendConfirmation(email: string): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
    });
    return { error: error?.message || null };
  }

  // Email a password reset link that opens /reset-password
  async sendPasswordReset(email: string): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    return { error: error?.message || null };
  }

  // Set a new password for the user signed in through a reset link
  async updatePassword(password: string): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.updateUser({ password });
    return { error: error?.message || null };
  }

  // Sign out user
  async signOut(): Promise<{ error: string | null }> {
    try {
      // Get current session to update logout time
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await this.endLoginSession(session.user.id);
      }

      const { error } = await supabase.auth.signOut();
      return { error: error?.message || null };
    } catch (error) {
      return { error: 'An unexpected error occurred' };
    }
  }

  // Build the app's user from a signed-in Supabase user. A missing profile row never
  // signs the user out; we fall back to the details stored on the auth account.
  async buildUser(sessionUser: User): Promise<AuthUser> {
    const profile = await this.getProfile(sessionUser.id);
    if (profile) {
      return this.mapProfileToUser(profile);
    }

    return {
      id: sessionUser.id,
      email: sessionUser.email ?? '',
      name: sessionUser.user_metadata?.full_name || sessionUser.user_metadata?.name || sessionUser.email?.split('@')[0] || 'Friend'
    };
  }

  // Get current user
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.user ? await this.buildUser(session.user) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Full profile row for the profile page
  async getProfileDetails(userId: string): Promise<Profile | null> {
    return this.getProfile(userId);
  }

  // Get user profile
  private async getProfile(userId: string): Promise<Profile | null> {
    try {
      console.log('Fetching profile for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('Profile not found for user:', userId);
        } else {
          console.error('Error fetching profile:', error);
        }
        return null;
      }

      console.log('Profile found:', data);
      return data;
    } catch (error) {
      console.error('Error in getProfile:', error);
      return null;
    }
  }

  // Create login session
  private async createLoginSession(userId: string): Promise<void> {
    try {
      const deviceInfo = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        screenResolution: `${screen.width}x${screen.height}`
      };

      const { error } = await supabase
        .from('login_sessions')
        .insert({
          user_id: userId,
          user_agent: navigator.userAgent,
          device_info: deviceInfo,
          location_info: { timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }
        });

      if (error) {
        console.error('Error creating login session:', error);
      }
    } catch (error) {
      console.error('Error in createLoginSession:', error);
    }
  }

  // End login session
  private async endLoginSession(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('login_sessions')
        .update({ 
          logout_time: new Date().toISOString(),
          is_active: false 
        })
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) {
        console.error('Error ending login session:', error);
      }
    } catch (error) {
      console.error('Error in endLoginSession:', error);
    }
  }

  // Map profile to user object
  private mapProfileToUser(profile: Profile): AuthUser {
    return {
      id: profile.id,
      email: profile.email,
      name: profile.full_name
    };
  }

  // Update user profile
  async updateProfile(userId: string, updates: Partial<Profile>): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      return { error: error?.message || null };
    } catch (error) {
      return { error: 'An unexpected error occurred' };
    }
  }

  // Collect everything stored about the signed-in user, for download
  async exportMyData(userId: string): Promise<{ data: Record<string, unknown> | null; error: string | null }> {
    try {
      const [profile, chatSessions, chatMessages, analytics, logins, moods, journal] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
        supabase.from('chat_sessions').select('*').eq('user_id', userId).order('session_start'),
        supabase.from('chat_messages').select('*').eq('user_id', userId).order('timestamp'),
        supabase.from('user_analytics').select('*').eq('user_id', userId).order('date'),
        supabase.from('login_sessions').select('*').eq('user_id', userId).order('login_time'),
        supabase.from('mood_entries').select('*').eq('user_id', userId).order('created_at'),
        supabase.from('journal_entries').select('*').eq('user_id', userId).order('created_at')
      ]);

      const failed = [profile, chatSessions, chatMessages, analytics, logins, moods, journal].find(result => result.error);
      if (failed?.error) {
        return { data: null, error: failed.error.message };
      }

      return {
        data: {
          exported_at: new Date().toISOString(),
          profile: profile.data,
          chat_sessions: chatSessions.data,
          chat_messages: chatMessages.data,
          daily_activity: analytics.data,
          login_sessions: logins.data,
          mood_check_ins: moods.data,
          journal_entries: journal.data
        },
        error: null
      };
    } catch (error) {
      return { data: null, error: 'An unexpected error occurred' };
    }
  }

  // Delete all conversations and activity, keeping the account
  async deleteMyHistory(userId: string): Promise<{ error: string | null }> {
    try {
      // Messages are removed with their sessions (ON DELETE CASCADE)
      const sessions = await supabase.from('chat_sessions').delete().eq('user_id', userId);
      if (sessions.error) return { error: sessions.error.message };

      const analytics = await supabase.from('user_analytics').delete().eq('user_id', userId);
      if (analytics.error) return { error: analytics.error.message };

      return { error: null };
    } catch (error) {
      return { error: 'An unexpected error occurred' };
    }
  }

  // Permanently delete the account and all of its data (see delete_my_account in migrations)
  async deleteMyAccount(): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.rpc('delete_my_account');
      if (error) return { error: error.message };

      await supabase.auth.signOut();
      return { error: null };
    } catch (error) {
      return { error: 'An unexpected error occurred' };
    }
  }

  // Get user login history
  async getLoginHistory(userId: string, limit: number = 10): Promise<LoginSession[]> {
    try {
      const { data, error } = await supabase
        .from('login_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('login_time', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching login history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getLoginHistory:', error);
      return [];
    }
  }
}

export const authService = new AuthService();