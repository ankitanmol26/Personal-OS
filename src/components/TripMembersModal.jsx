import React, { useState, useEffect } from 'react';
import { getTripMembers, addTripMember, removeTripMember } from '../services/tripService';
import { X, UserPlus, UserMinus, Shield } from 'lucide-react';
import './TripMembersModal.css';

export default function TripMembersModal({ trip, currentUser, onClose }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [emailInput, setEmailInput] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  const isOwner = trip.userId === currentUser?.id;

  useEffect(() => {
    fetchMembers();
  }, [trip.id]);

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
    } catch (err) {
      setActionError(err.message || 'Failed to remove member');
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
          {!isOwner && (
            <div className="member-notice">
              You are a member of this trip. Only the owner can manage members.
            </div>
          )}

          {isOwner && (
            <form className="add-member-form" onSubmit={handleAddMember}>
              <input
                type="email"
                placeholder="Enter user email..."
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
