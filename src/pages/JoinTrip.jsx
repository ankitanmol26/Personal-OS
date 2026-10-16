import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getTripByInviteCode, joinTripByInviteCode } from '../services/tripService';
import { Plane, Users, Calendar, ArrowRight, AlertCircle, CheckCircle, ShieldCheck } from 'lucide-react';

export default function JoinTrip() {
  const [searchParams] = useSearchParams();
  const codeParam = searchParams.get('code') || '';
  const [inviteCode, setInviteCode] = useState(codeParam);
  const [tripPreview, setTripPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const fetchTripPreview = async (code) => {
    if (!code) return;
    setLoading(true);
    setError('');
    try {
      const data = await getTripByInviteCode(code.trim());
      setTripPreview(data);
    } catch (err) {
      setError(err?.message || 'Invalid or expired invitation link');
      setTripPreview(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (codeParam) {
      setInviteCode(codeParam);
      fetchTripPreview(codeParam);
    }
  }, [codeParam]);

  const handleJoin = async () => {
    if (!isAuthenticated) {
      sessionStorage.setItem('pending_trip_invite', inviteCode);
      navigate('/login');
      return;
    }

    setJoining(true);
    setError('');
    try {
      const joinedTrip = await joinTripByInviteCode(inviteCode.trim());
      setSuccess(`Joined ${joinedTrip.name}! Redirecting...`);
      sessionStorage.removeItem('pending_trip_invite');
      setTimeout(() => {
        navigate('/finance');
      }, 1200);
    } catch (err) {
      setError(err?.message || 'Failed to join trip');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a0a',
      color: '#ededed',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <div style={{
        maxWidth: '480px',
        width: '100%',
        backgroundColor: '#141414',
        border: '1px solid #262626',
        borderRadius: '16px',
        padding: '32px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            backgroundColor: 'rgba(255, 74, 34, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ff4a22'
          }}>
            <Plane size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Trip Invitation</h1>
            <p style={{ fontSize: '13px', color: '#a3a3a3', margin: 0 }}>Collaborate and track shared expenses</p>
          </div>
        </div>

        {error && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: '10px',
            padding: '12px 16px',
            color: '#f87171',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '20px'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div style={{
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.25)',
            borderRadius: '10px',
            padding: '12px 16px',
            color: '#4ade80',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '20px'
          }}>
            <CheckCircle size={18} style={{ flexShrink: 0 }} />
            <span>{success}</span>
          </div>
        )}

        {!codeParam && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#a3a3a3', marginBottom: '8px', textTransform: 'uppercase' }}>
              Invitation Code
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="e.g. TRIP-ABCD1234"
                style={{
                  flex: 1,
                  backgroundColor: '#1c1c1c',
                  border: '1px solid #333',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none',
                  letterSpacing: '1px'
                }}
              />
              <button
                onClick={() => fetchTripPreview(inviteCode)}
                disabled={loading || !inviteCode.trim()}
                style={{
                  backgroundColor: '#262626',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0 16px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: loading || !inviteCode.trim() ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Finding...' : 'Preview'}
              </button>
            </div>
          </div>
        )}

        {tripPreview && (
          <div style={{
            backgroundColor: '#1a1a1a',
            border: '1px solid #2e2e2e',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '700', color: '#fff' }}>
                  {tripPreview.name}
                </h3>
                {tripPreview.destination && (
                  <p style={{ margin: 0, fontSize: '13px', color: '#ff4a22', fontWeight: '500' }}>
                    {tripPreview.destination}
                  </p>
                )}
              </div>
              <span style={{
                backgroundColor: 'rgba(255, 74, 34, 0.15)',
                color: '#ff4a22',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                {tripPreview.currency || 'INR'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#a3a3a3', borderTop: '1px solid #262626', paddingTop: '12px' }}>
              {(tripPreview.startDate || tripPreview.endDate) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={15} color="#737373" />
                  <span>
                    {tripPreview.startDate || 'TBD'} to {tripPreview.endDate || 'TBD'}
                  </span>
                </div>
              )}
              {tripPreview.ownerName && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={15} color="#737373" />
                  <span>Organized by <strong style={{ color: '#ededed' }}>{tripPreview.ownerName}</strong></span>
                </div>
              )}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {tripPreview && (
            <button
              onClick={handleJoin}
              disabled={joining}
              style={{
                backgroundColor: '#ff4a22',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                padding: '14px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: joining ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'opacity 0.2s',
                opacity: joining ? 0.7 : 1
              }}
            >
              <span>{joining ? 'Joining Trip...' : isAuthenticated ? 'Accept & Join Trip' : 'Sign in to Join Trip'}</span>
              <ArrowRight size={18} />
            </button>
          )}

          <button
            onClick={() => navigate('/finance')}
            style={{
              backgroundColor: 'transparent',
              color: '#a3a3a3',
              border: '1px solid #262626',
              borderRadius: '10px',
              padding: '12px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Cancel and Return
          </button>
        </div>
      </div>
    </div>
  );
}
