import React, { useState, useEffect } from 'react';
import { getTripMembers, addTripMember, removeTripMember, regenerateInviteCode, leaveTrip } from '../services/tripService';
import { X, UserPlus, UserMinus, Shield, Copy, Check, RefreshCw, LogOut, Link } from 'lucide-react';
import './TripMembersModal.css';

export default function TripMembersModal({ trip, currentUser, onClose, onTripUpdated }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [emailInput, setEmailInput] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [currentInviteCode, setCurrentInviteCode] = useState(trip.inviteCode || '');

  const isOwner = trip.userId === currentUser?.id;
  const inviteUrl = `${window.location.origin}/join-trip?code=${currentInviteCode}`;

  const fetchMembers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTripMembers(trip.id);
      setMembers(data);
    } catch (err) {
      setError(err.message || 'Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [trip.id]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentInviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleRegenerateCode = async () => {
    if (!window.confirm("Regenerating the invite code will invalidate the old link. Continue?")) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const updated = await regenerateInviteCode(trip.id);
      setCurrentInviteCode(updated.inviteCode);
      setActionSuccess('Invite code refreshed successfully!');
      onTripUpdated?.();
    } catch (err) {
      setActionError(err.message || 'Failed to regenerate invite code');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!emailInput.trim()) return;

    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      await addTripMember(trip.id, emailInput.trim());
      setEmailInput('');
      setActionSuccess('Member added successfully!');
      fetchMembers();
      onTripUpdated?.();
    } catch (err) {
      setActionError(err.message || 'Failed to add member');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveMember = async (memberUserId) => {
    if (!window.confirm("Are you sure you want to remove this member?")) return;

    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      await removeTripMember(trip.id, memberUserId);
      setActionSuccess('Member removed successfully!');
      fetchMembers();
      onTripUpdated?.();
    } catch (err) {
      setActionError(err.message || 'Failed to remove member');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveTrip = async () => {
    if (!window.confirm("Are you sure you want to leave this trip?")) return;

    setActionLoading(true);
    setActionError(null);
    try {
      await leaveTrip(trip.id);
      onTripUpdated?.();
      onClose();
    } catch (err) {
      setActionError(err.message || 'Failed to leave trip');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Members for {trip.name}</h3>
          <button className="icon-btn close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Shareable Invitation Section */}
          <div style={{
            backgroundColor: '#171717',
            border: '1px solid #2b2b2b',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ff4a22', fontSize: '13px', fontWeight: '600' }}>
                <Link size={16} />
                <span>Trip Invite Link</span>
              </div>
              {isOwner && (
                <button
                  type="button"
                  onClick={handleRegenerateCode}
                  disabled={actionLoading}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#a3a3a3',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer'
                  }}
                  title="Generate new invite link"
                >
                  <RefreshCw size={12} /> Regenerate
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                readOnly
                value={inviteUrl}
                style={{
                  flex: 1,
                  backgroundColor: '#0f0f0f',
                  border: '1px solid #333',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  color: '#ededed',
                  fontSize: '12px',
                  outline: 'none'
                }}
              />
              <button
                type="button"
                onClick={handleCopyLink}
                style={{
                  backgroundColor: copiedLink ? '#10b981' : '#ff4a22',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0 14px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                {copiedLink ? 'Copied' : 'Copy Link'}
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: '#a3a3a3', borderTop: '1px solid #262626', paddingTop: '8px' }}>
              <span>Code: <strong style={{ color: '#fff', letterSpacing: '0.5px' }}>{currentInviteCode}</strong></span>
              <button
                type="button"
                onClick={handleCopyCode}
                style={{ background: 'none', border: 'none', color: '#ff4a22', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}
              >
                {copiedCode ? 'Code Copied!' : 'Copy Code Only'}
              </button>
            </div>
          </div>

          {!isOwner && (
            <div className="member-notice" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>You are a member of this trip.</span>
              <button
                type="button"
                onClick={handleLeaveTrip}
                disabled={actionLoading}
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  color: '#f87171',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <LogOut size={13} /> Leave Trip
              </button>
            </div>
          )}

          {isOwner && (
            <form className="add-member-form" onSubmit={handleAddMember}>
              <input
                type="email"
                placeholder="Direct invite by registered email..."
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                disabled={actionLoading}
                className="finance-input"
                required
              />
              <button type="submit" disabled={actionLoading || !emailInput.trim()} className="finance-btn-submit small-btn">
                <UserPlus size={16} style={{ marginRight: '4px' }} /> Add
              </button>
            </form>
          )}

          {actionError && <div className="action-feedback error">{actionError}</div>}
          {actionSuccess && <div className="action-feedback success">{actionSuccess}</div>}

          {loading ? (
            <div className="members-loading">Loading members...</div>
          ) : error ? (
            <div className="members-error">{error}</div>
          ) : members.length === 0 ? (
            <div className="members-empty">No members found.</div>
          ) : (
            <div className="members-list">
              {members.map(member => (
                <div key={member.id || member.userId} className={`member-item ${member.role === 'OWNER' ? 'is-owner' : ''}`}>
                  <div className="member-info">
                    <div className="member-name">
                      {member.name} {member.userId === currentUser?.id && "(You)"}
                    </div>
                    <div className="member-email">{member.email}</div>
                  </div>
                  <div className="member-actions">
                    {member.role === 'OWNER' ? (
                      <span className="role-badge owner"><Shield size={12} style={{marginRight:'2px'}}/> Owner</span>
                    ) : (
                      <>
                        <span className="role-badge member">Member</span>
                        {isOwner && (
                          <button
                            type="button"
                            className="icon-btn danger remove-btn"
                            onClick={() => handleRemoveMember(member.userId)}
                            disabled={actionLoading}
                            title="Remove Member"
                          >
                            <UserMinus size={16} />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
