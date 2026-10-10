import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { getGoogleOAuthState } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './GoogleSignInButton.css';

const GoogleSignInButton = ({ onError }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { googleLogin } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSuccess = async (codeResponse) => {
    try {
      const code = codeResponse.code;
      // State is bound implicitly if we use implicit flow, but we are using auth-code flow.
      // Wait, @react-oauth/google handles state internally if provided to useGoogleLogin
      // However, we need to manually pass it to the backend.
      // We retrieve it from sessionStorage where we temporarily parked it before calling login()
      const state = sessionStorage.getItem('google_oauth_state');
      if (!state) {
        throw new Error("OAuth state is missing. Please try again.");
      }
      
      const payload = {
        code,
        redirectUri: window.location.origin,
        state
      };
      
      await googleLogin(payload);
      navigate("/");
    } catch (err) {
      let msg = "Google Sign-In failed.";
      if (err.status === 409) {
        msg = "An account with this email already exists. Please log in with your password to link your Google account.";
      } else if (err.status === 503) {
        msg = "Google Sign-In is temporarily unavailable or not configured.";
      } else if (err.status === 400 || err.status === 401) {
        msg = "Google authentication could not be verified. Please try again.";
      } else if (err.message) {
        msg = err.message;
      }
      if (onError) onError(msg);
    } finally {
      setIsLoading(false);
      sessionStorage.removeItem('google_oauth_state');
    }
  };

  const login = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: (error) => {
      setIsLoading(false);
      if (onError) onError("Google Sign-In was cancelled or failed.");
    },
    flow: 'auth-code',
    redirect_uri: window.location.origin
  });

  const handleAuthClick = async () => {
    if (isLoading) return;
    try {
      setIsLoading(true);
      // Fetch fresh state from backend
      const { state } = await getGoogleOAuthState();
      sessionStorage.setItem('google_oauth_state', state);
      login({ state });
    } catch (err) {
      setIsLoading(false);
      if (onError) onError("Unable to initialize Google Sign-In. Please try again later.");
    }
  };

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId || clientId === 'not-configured') {
    return (
      <button type="button" className="google-auth-button" disabled title="Google Sign-In is not configured">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chrome"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="21.17" x2="12" y1="8" y2="8"/><line x1="3.95" x2="8.54" y1="6.06" y2="14"/><line x1="10.88" x2="15.46" y1="21.94" y2="14"/></svg>
        Continue with Google
      </button>
    );
  }

  return (
    <button 
      type="button" 
      className="google-auth-button" 
      onClick={handleAuthClick} 
      disabled={isLoading}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chrome"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="21.17" x2="12" y1="8" y2="8"/><line x1="3.95" x2="8.54" y1="6.06" y2="14"/><line x1="10.88" x2="15.46" y1="21.94" y2="14"/></svg>
      {isLoading ? "Connecting..." : "Continue with Google"}
    </button>
  );
};

export default GoogleSignInButton;
