import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getProfile, updateProfile, changePassword } from "../services/profileService";
import {
  User,
  Mail,
  Phone,
  FileText,
  Calendar,
  ShieldCheck,
  LogOut,
  Edit3,
  Save,
  X,
  Lock,
  CheckCircle2,
  AlertCircle,
  Moon,
  Sparkles,
  ExternalLink,
  Camera,
  RefreshCw
} from "lucide-react";
import "./Profile.css";

export default function Profile() {
  const { user, updateUser, logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    id: null,
    name: "",
    email: "",
    avatarUrl: "",
    phone: "",
    bio: "",
    createdAt: null,
    authProvider: "EMAIL"
  });

  const [editForm, setEditForm] = useState({
    name: "",
    avatarUrl: "",
    phone: "",
    bio: ""
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");

  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      setProfileError("");
      const data = await getProfile();
      setProfileData({
        id: data.id,
        name: data.name || "",
        email: data.email || "",
        avatarUrl: data.avatarUrl || "",
        phone: data.phone || "",
        bio: data.bio || "",
        createdAt: data.createdAt || null,
        authProvider: data.authProvider || (data.password == null ? "GOOGLE" : "EMAIL")
      });
      setEditForm({
        name: data.name || "",
        avatarUrl: data.avatarUrl || "",
        phone: data.phone || "",
        bio: data.bio || ""
      });
      updateUser(data);
    } catch (err) {
      setProfileError(err.message || "Failed to load account profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const handleStartEdit = () => {
    setEditForm({
      name: profileData.name || "",
      avatarUrl: profileData.avatarUrl || "",
      phone: profileData.phone || "",
      bio: profileData.bio || ""
    });
    setProfileError("");
    setProfileSuccess("");
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setProfileError("");
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) {
      setProfileError("Display name cannot be blank");
      return;
    }

    setProfileError("");
    setProfileSuccess("");
    setProfileLoading(true);

    try {
      const updated = await updateProfile({
        name: editForm.name.trim(),
        avatarUrl: editForm.avatarUrl ? editForm.avatarUrl.trim() : null,
        phone: editForm.phone ? editForm.phone.trim() : null,
        bio: editForm.bio ? editForm.bio.trim() : null
      });

      const newProfile = {
        ...profileData,
        name: updated.name,
        avatarUrl: updated.avatarUrl || "",
        phone: updated.phone || "",
        bio: updated.bio || ""
      };

      setProfileData(newProfile);
      updateUser(newProfile);
      setIsEditing(false);
      setProfileSuccess("Profile updated successfully");

      setTimeout(() => setProfileSuccess(""), 4000);
    } catch (err) {
      setProfileError(err.message || "Failed to update profile");
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError("All password fields are required");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    setPasswordError("");
    setPasswordSuccess("");
    setPasswordLoading(true);

    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setPasswordSuccess("Password changed successfully");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => setPasswordSuccess(""), 4000);
    } catch (err) {
      setPasswordError(err.message || "Failed to change password");
    } finally {
      setPasswordLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const formatDate = (isoString) => {
    if (!isoString) return "Recently";
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric"
      });
    } catch {
      return "Recently";
    }
  };

  const isGoogleUser = profileData.authProvider === "GOOGLE";

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-loading-state">
          <div className="profile-spinner"></div>
          <p>Loading profile information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* Top Header */}
      <div className="profile-header">
        <div>
          <h1>Profile & Account</h1>
          <p>Manage your personal details, connected authentication, and workspace settings.</p>
        </div>
        {!isEditing && (
          <button onClick={handleStartEdit} className="btn-primary edit-profile-btn">
            <Edit3 size={16} />
            <span>Edit Profile</span>
          </button>
        )}
      </div>

      {profileSuccess && (
        <div className="action-feedback success">
          <CheckCircle2 size={18} />
          <span>{profileSuccess}</span>
        </div>
      )}

      {profileError && (
        <div className="action-feedback error">
          <AlertCircle size={18} />
          <span>{profileError}</span>
        </div>
      )}

      {/* Main Hero Card */}
      <div className="profile-hero-card card">
        <div className="profile-hero-left">
          <div className="profile-hero-avatar-wrapper">
            {profileData.avatarUrl ? (
              <img
                src={profileData.avatarUrl}
                alt={profileData.name || "User"}
                className="profile-hero-avatar-img"
              />
            ) : (
              <div className="profile-hero-avatar-fallback">
                {getInitials(profileData.name)}
              </div>
            )}
            <div className="avatar-badge-status" title="Active Account"></div>
          </div>

          <div className="profile-hero-info">
            <div className="profile-hero-title-row">
              <h2>{profileData.name || "PersonalOS User"}</h2>
              <span className={`auth-badge ${isGoogleUser ? "google" : "email"}`}>
                {isGoogleUser ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    Google Account
                  </>
                ) : (
                  <>
                    <Mail size={12} /> Email & Password
                  </>
                )}
              </span>
            </div>
            <p className="profile-hero-email">{profileData.email}</p>
            {profileData.bio && <p className="profile-hero-bio">“{profileData.bio}”</p>}
          </div>
        </div>

        <div className="profile-hero-meta">
          <div className="meta-item">
            <span className="meta-label">Member Since</span>
            <span className="meta-val">
              <Calendar size={14} />
              {formatDate(profileData.createdAt)}
            </span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Account Status</span>
            <span className="meta-val verified">
              <ShieldCheck size={14} />
              Verified & Active
            </span>
          </div>
        </div>
      </div>

      {/* Profile Details (View or Edit Mode) */}
      <div className="profile-grid">
        <div className="profile-main-col">
          {isEditing ? (
            /* Editable Form */
            <section className="profile-card card">
              <div className="card-header">
                <div className="header-icon-box">
                  <Edit3 size={18} />
                </div>
                <div>
                  <h3>Edit Profile Details</h3>
                  <p>Update your display name, phone, bio, or custom avatar.</p>
                </div>
              </div>

              <form onSubmit={handleProfileSubmit} className="profile-edit-form">
                <div className="form-group">
                  <label htmlFor="displayName">
                    Display Name <span className="required">*</span>
                  </label>
                  <input
                    id="displayName"
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    required
                    maxLength={255}
                    placeholder="Your name"
                    className="finance-input"
                  />
                  <span className="form-hint">Shown in the navigation bar and workspace views.</span>
                </div>

                <div className="form-group">
                  <label htmlFor="emailDisabled">Email Address</label>
                  <input
                    id="emailDisabled"
                    type="email"
                    value={profileData.email}
                    disabled
                    className="finance-input disabled"
                  />
                  <span className="form-hint">Email is managed by your primary authentication provider.</span>
                </div>

                <div className="form-group">
                  <label htmlFor="phoneInput">Phone Number (Optional)</label>
                  <input
                    id="phoneInput"
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    maxLength={32}
                    placeholder="+1 (555) 000-0000"
                    className="finance-input"
                  />
                  <span className="form-hint">Used for optional notifications and account verification.</span>
                </div>

                <div className="form-group">
                  <label htmlFor="bioInput">Bio / About (Optional)</label>
                  <textarea
                    id="bioInput"
                    rows={3}
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    maxLength={500}
                    placeholder="Brief description about yourself or what you are building..."
                    className="finance-input finance-textarea"
                  />
                  <div className="char-counter">
                    {editForm.bio.length} / 500 characters
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="avatarUrlInput">Avatar URL (Optional)</label>
                  <input
                    id="avatarUrlInput"
                    type="url"
                    value={editForm.avatarUrl}
                    onChange={(e) => setEditForm({ ...editForm, avatarUrl: e.target.value })}
                    maxLength={2048}
                    placeholder="https://images.example.com/photo.jpg"
                    className="finance-input"
                  />
                  <span className="form-hint">Leave blank to use default Google/initials avatar.</span>
                </div>

                <div className="form-button-row">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={profileLoading}
                    className="btn-secondary"
                  >
                    <X size={16} /> Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={profileLoading}
                    className="btn-primary"
                  >
                    {profileLoading ? (
                      <>
                        <RefreshCw size={16} className="spin-icon" /> Saving...
                      </>
                    ) : (
                      <>
                        <Save size={16} /> Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </section>
          ) : (
            /* View Mode */
            <section className="profile-card card">
              <div className="card-header">
                <div className="header-icon-box">
                  <User size={18} />
                </div>
                <div>
                  <h3>Account Information</h3>
                  <p>Detailed view of your current PersonalOS account records.</p>
                </div>
              </div>

              <div className="info-grid">
                <div className="info-tile">
                  <div className="info-tile-icon">
                    <User size={16} />
                  </div>
                  <div className="info-tile-content">
                    <span className="info-tile-label">Display Name</span>
                    <span className="info-tile-value">{profileData.name || "Not set"}</span>
                  </div>
                </div>

                <div className="info-tile">
                  <div className="info-tile-icon">
                    <Mail size={16} />
                  </div>
                  <div className="info-tile-content">
                    <span className="info-tile-label">Email Address</span>
                    <span className="info-tile-value">{profileData.email}</span>
                  </div>
                </div>

                <div className="info-tile">
                  <div className="info-tile-icon">
                    <Phone size={16} />
                  </div>
                  <div className="info-tile-content">
                    <span className="info-tile-label">Phone Number</span>
                    <span className="info-tile-value">
                      {profileData.phone || <em className="text-muted">Not provided</em>}
                    </span>
                  </div>
                </div>

                <div className="info-tile">
                  <div className="info-tile-icon">
                    <Calendar size={16} />
                  </div>
                  <div className="info-tile-content">
                    <span className="info-tile-label">Created At</span>
                    <span className="info-tile-value">{formatDate(profileData.createdAt)}</span>
                  </div>
                </div>

                <div className="info-tile full-width">
                  <div className="info-tile-icon">
                    <FileText size={16} />
                  </div>
                  <div className="info-tile-content">
                    <span className="info-tile-label">Bio / About</span>
                    <span className="info-tile-value">
                      {profileData.bio || <em className="text-muted">No bio provided yet. Click "Edit Profile" to add one.</em>}
                    </span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Account Security Section */}
          <section className="profile-card card">
            <div className="card-header">
              <div className="header-icon-box">
                <Lock size={18} />
              </div>
              <div>
                <h3>Account Security</h3>
                <p>Authentication credentials and session protection.</p>
              </div>
            </div>

            {isGoogleUser ? (
              <div className="google-security-card">
                <div className="google-security-top">
                  <div className="google-icon-wrapper">
                    <svg width="22" height="22" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4>Google Single Sign-On Active</h4>
                    <p>
                      Your account authentication is federated through Google OAuth 2.0. Password updates,
                      multi-factor authentication (2FA), and identity safeguards are managed via your Google Account.
                    </p>
                  </div>
                </div>
                <div className="google-security-bottom">
                  <a
                    href="https://myaccount.google.com/security"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="google-manage-link"
                  >
                    <span>Manage Google Security</span>
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            ) : (
              <form onSubmit={handlePasswordSubmit} className="password-form">
                {passwordSuccess && (
                  <div className="action-feedback success">
                    <CheckCircle2 size={16} />
                    <span>{passwordSuccess}</span>
                  </div>
                )}
                {passwordError && (
                  <div className="action-feedback error">
                    <AlertCircle size={16} />
                    <span>{passwordError}</span>
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="currentPassword">Current Password</label>
                  <input
                    id="currentPassword"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    required
                    className="finance-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="newPassword">New Password</label>
                  <input
                    id="newPassword"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    required
                    minLength={6}
                    className="finance-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm New Password</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    required
                    minLength={6}
                    className="finance-input"
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" disabled={passwordLoading} className="btn-primary">
                    {passwordLoading ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>

        {/* Sidebar Column: Settings & Actions */}
        <div className="profile-side-col">
          {/* Workspace & Appearance Settings */}
          <section className="profile-card card">
            <div className="card-header">
              <div className="header-icon-box">
                <Moon size={18} />
              </div>
              <div>
                <h3>Appearance & Theme</h3>
                <p>Visual theme preferences.</p>
              </div>
            </div>

            <div className="appearance-status-box">
              <div className="appearance-row">
                <div className="theme-pill active">
                  <span className="dot"></span>
                  Dark Fintech Theme (Default)
                </div>
              </div>
              <p className="appearance-hint">
                PersonalOS uses an optimized high-contrast dark aesthetic tailored for productivity and financial clarity.
              </p>
            </div>
          </section>

          {/* Session & Sign Out */}
          <section className="profile-card card">
            <div className="card-header">
              <div className="header-icon-box danger">
                <LogOut size={18} />
              </div>
              <div>
                <h3>Account Session</h3>
                <p>Sign out of this browser or manage active tokens.</p>
              </div>
            </div>

            <div className="session-card-content">
              <p className="session-text">
                Signing out clears your local access token and ends your authenticated session on this device.
              </p>
              <button onClick={logout} className="btn-danger signout-btn">
                <LogOut size={16} />
                <span>Sign Out of PersonalOS</span>
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
