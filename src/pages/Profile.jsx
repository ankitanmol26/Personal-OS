import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getProfile, updateProfile, changePassword } from '../services/profileService';
import { Save, User as UserIcon, Lock, X } from 'lucide-react';
import './Profile.css';

export default function Profile() {
  const { user, updateUser } = useAuth();
  
  const [profileData, setProfileData] = useState({ name: '', email: '', avatarUrl: '' });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getProfile();
        setProfileData({
          name: data.name || '',
          email: data.email || '',
          avatarUrl: data.avatarUrl || ''
        });
        updateUser(data); // Sync just in case
      } catch (err) {
        setProfileError(err.message || 'Failed to load profile');
      }
    };
    fetchProfile();
  }, []);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (!profileData.name.trim()) {
      setProfileError('Name cannot be blank');
      return;
    }

    setProfileError('');
    setProfileSuccess('');
    setProfileLoading(true);

    try {
      const updated = await updateProfile({
        name: profileData.name,
        avatarUrl: profileData.avatarUrl
      });
      setProfileData({ ...profileData, name: updated.name, avatarUrl: updated.avatarUrl || '' });
      updateUser({ name: updated.name, avatarUrl: updated.avatarUrl || '' });
      setProfileSuccess('Profile updated successfully');
      
      setTimeout(() => setProfileSuccess(''), 3000);
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError('All fields are required');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }

    setPasswordError('');
    setPasswordSuccess('');
    setPasswordLoading(true);

    try {
      await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setPasswordSuccess('Password changed successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPasswordSuccess(''), 3000);
    } catch (err) {
      setPasswordError(err.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-header">
        <h1>Account Settings</h1>
        <p>Manage your profile and security preferences.</p>
      </div>

      <div className="profile-container">
        <section className="profile-section card">
          <div className="section-header">
            <UserIcon size={20} className="section-icon" />
            <h2>Personal Information</h2>
          </div>
          
          <form className="profile-form" onSubmit={handleProfileUpdate}>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" value={profileData.email} disabled className="finance-input disabled" />
              <small className="form-hint">Email address cannot be changed.</small>
            </div>

            <div className="form-group">
              <label>Display Name</label>
              <input 
                type="text" 
                value={profileData.name} 
                onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                required 
                maxLength="255"
                className="finance-input" 
              />
            </div>

            <div className="form-group">
              <label>Avatar URL (Optional)</label>
              <input 
                type="url" 
                placeholder="https://..."
                value={profileData.avatarUrl} 
                onChange={(e) => setProfileData({...profileData, avatarUrl: e.target.value})}
                maxLength="2048"
                className="finance-input" 
              />
              <small className="form-hint">Provide a valid HTTP/HTTPS image URL.</small>
            </div>

            {profileError && <div className="action-feedback error">{profileError}</div>}
            {profileSuccess && <div className="action-feedback success">{profileSuccess}</div>}

            <div className="form-actions">
              <button type="submit" disabled={profileLoading} className="finance-btn-submit">
                {profileLoading ? 'Saving...' : <><Save size={16} style={{marginRight: '6px'}}/> Save Changes</>}
              </button>
            </div>
          </form>
        </section>

        <section className="profile-section card">
          <div className="section-header">
            <Lock size={20} className="section-icon" />
            <h2>Change Password</h2>
          </div>
          
          <form className="profile-form" onSubmit={handlePasswordChange}>
            <div className="form-group">
              <label>Current Password</label>
              <input 
                type="password" 
                value={passwordData.currentPassword} 
                onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                required 
                className="finance-input" 
              />
            </div>

            <div className="form-group">
              <label>New Password</label>
              <input 
                type="password" 
                value={passwordData.newPassword} 
                onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                required 
                minLength="6"
                className="finance-input" 
              />
            </div>

            <div className="form-group">
              <label>Confirm New Password</label>
              <input 
                type="password" 
                value={passwordData.confirmPassword} 
                onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                required 
                className="finance-input" 
              />
            </div>

            {passwordError && <div className="action-feedback error">{passwordError}</div>}
            {passwordSuccess && <div className="action-feedback success">{passwordSuccess}</div>}

            <div className="form-actions">
              <button type="submit" disabled={passwordLoading} className="finance-btn-submit">
                {passwordLoading ? 'Updating...' : <><Save size={16} style={{marginRight: '6px'}}/> Update Password</>}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
