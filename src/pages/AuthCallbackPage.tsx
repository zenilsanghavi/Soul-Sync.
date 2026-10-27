import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Leaf } from 'lucide-react';

export const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔄 Auth callback page loaded');
        console.log('🔗 Current URL:', window.location.href);
        console.log('🔗 Hash:', window.location.hash);
        console.log('🔗 Search:', window.location.search);
        
        // First try to get session from URL
        const { data: sessionData } = await supabase.auth.getSession();
        console.log('📊 Current session:', sessionData);
        
        // If no session, try to exchange the code/token from URL
        if (!sessionData.session) {
          console.log('🔄 No session found, checking URL for auth data...');
          
          // Check if we have auth data in the URL
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const searchParams = new URLSearchParams(window.location.search);
          
          const accessToken = hashParams.get('access_token') || searchParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token');
          const code = searchParams.get('code');
          
          console.log('🔑 Found tokens:', { accessToken: !!accessToken, refreshToken: !!refreshToken, code: !!code });
          
          if (code) {
            // Exchange code for session
            const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
            if (exchangeError) {
              console.error('❌ Code exchange error:', exchangeError);
              navigate('/login?error=auth_failed');
              return;
            }
            console.log('✅ Code exchange successful:', exchangeData);
          }
        }
        
        // Get the final session
        const { data: finalSession, error: finalError } = await supabase.auth.getSession();
        
        if (finalError) {
          console.error('❌ Auth callback error:', finalError);
          navigate('/login?error=auth_failed');
          return;
        }

        if (finalSession.session) {
          console.log('✅ Session found, redirecting to dashboard');
          // User is authenticated, redirect to dashboard
          // Clear the URL hash/search params
          window.history.replaceState({}, document.title, '/dashboard');
          navigate('/dashboard');
        } else {
          console.log('❌ No session found, redirecting to login');
          // No session, redirect to login
          navigate('/login');
        }
      } catch (error) {
        console.error('💥 Unexpected error in auth callback:', error);
        navigate('/login?error=callback_failed');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center">
      <div className="text-center">
        <div className="flex justify-center items-center space-x-2 mb-6">
          <Leaf className="h-12 w-12 text-brand-600 animate-pulse" />
          <span className="text-2xl font-semibold text-ink">Soul Sync</span>
        </div>
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-brand-100 border-t-brand-600 mx-auto mb-4"></div>
        <p className="text-ink-muted">Processing authentication...</p>
        <p className="text-sm text-ink-subtle mt-2">Please wait while we complete your sign-in</p>
      </div>
    </div>
  );
};