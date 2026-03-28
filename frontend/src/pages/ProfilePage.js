import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './ProfilePage.css';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function ProfilePage() {
  const { username } = useParams();
  const { user: currentUser, updateUser } = useAuth(); // ✅ updateUser
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);

  // ── EDIT MODAL STATE ──
  const [showEdit, setShowEdit] = useState(false);
  const [editData, setEditData] = useState({ fullName: '', bio: '', profilePicture: '' });
  const [editFile, setEditFile] = useState(null);
  const [editPreview, setEditPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/users/${username}`);
      setProfile(res.data.user);
      setPosts(res.data.posts);
      setFollowing(res.data.user.followers?.includes(currentUser?._id));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [username, currentUser]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleFollow = async () => {
    try {
      const res = await axios.put(`${API}/users/${profile._id}/follow`);
      setFollowing(res.data.following);
      setProfile((prev) => ({
        ...prev,
        followers: res.data.following
          ? [...(prev.followers || []), currentUser._id]
          : (prev.followers || []).filter((id) => id !== currentUser._id)
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const openEdit = () => {
    setEditData({
      fullName: profile.fullName || '',
      bio: profile.bio || '',
      profilePicture: profile.profilePicture || '',
    });
    setEditFile(null);
    setEditPreview(null);
    setSaveMsg('');
    setShowEdit(true);
  };

  const handleFilePick = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setEditFile(file);
    setEditPreview(URL.createObjectURL(file));
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveMsg('');
    try {
      const formData = new FormData();
      formData.append('fullName', editData.fullName);
      formData.append('bio', editData.bio);
      if (editFile) formData.append('profilePicture', editFile);

      const res = await axios.put(`${API}/users/profile`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setProfile((prev) => ({ ...prev, ...res.data.user }));
      updateUser({ ...currentUser, ...res.data.user }); // ✅ updateUser
      setSaveMsg('Profile updated!');
      setTimeout(() => setShowEdit(false), 800);
    } catch (err) {
      console.error(err);
      setSaveMsg('Failed to save. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const isOwn = currentUser?.username === username;

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-header-skeleton">
          <div className="skel-avatar" />
          <div className="skel-info">
            <div className="skel-line long" />
            <div className="skel-line medium" />
            <div className="skel-line short" />
          </div>
        </div>
        <div className="skel-grid">
          {[1,2,3,4,5,6].map(i => <div key={i} className="skel-post" />)}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-page">
        <div className="profile-not-found">
          <h2>User not found</h2>
          <p>This account doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">

      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-avatar-wrap">
          <div className="profile-avatar-ring">
            <div className="profile-avatar-inner">
              {profile.profilePicture ? (
                <img src={profile.profilePicture} alt={profile.username} />
              ) : (
                <span>{profile.username?.[0]?.toUpperCase()}</span>
              )}
            </div>
          </div>
        </div>

        <div className="profile-info">
          <div className="profile-username-row">
            <h2 className="profile-username">{profile.username}</h2>
            {isOwn ? (
              <button className="profile-edit-btn" onClick={openEdit}>Edit Profile</button>
            ) : (
              <button
                className={`profile-follow-btn ${following ? 'following' : ''}`}
                onClick={handleFollow}
              >
                {following ? 'Following' : 'Follow'}
              </button>
            )}
          </div>

          <div className="profile-stats">
            <div className="stat-item">
              <span className="stat-count">{posts.length}</span>
              <span className="stat-label">posts</span>
            </div>
            <div className="stat-item">
              <span className="stat-count">{profile.followers?.length || 0}</span>
              <span className="stat-label">followers</span>
            </div>
            <div className="stat-item">
              <span className="stat-count">{profile.following?.length || 0}</span>
              <span className="stat-label">following</span>
            </div>
          </div>

          {profile.fullName && <p className="profile-fullname">{profile.fullName}</p>}
          {profile.bio && <p className="profile-bio">{profile.bio}</p>}
        </div>
      </div>

      {/* Tabs */}
      <div className="profile-tabs">
        <button className="tab-btn active">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <rect x="3" y="3" width="7" height="7" rx="1"/>
            <rect x="14" y="3" width="7" height="7" rx="1"/>
            <rect x="3" y="14" width="7" height="7" rx="1"/>
            <rect x="14" y="14" width="7" height="7" rx="1"/>
          </svg>
          POSTS
        </button>
      </div>

      {/* Posts Grid */}
      {posts.length === 0 ? (
        <div className="profile-empty">
          <div className="empty-cam">📷</div>
          <h3>No Posts Yet</h3>
          {isOwn && <p>Share your first photo!</p>}
        </div>
      ) : (
        <div className="profile-grid">
          {posts.map((post) => (
            <div key={post._id} className="grid-post" onClick={() => setSelectedPost(post)}>
              {post.image ? (
                <img src={post.image} alt="post" />
              ) : (
                <div className="grid-post-no-img">
                  <span>{post.caption?.slice(0, 40)}</span>
                </div>
              )}
              <div className="grid-overlay">
                <span>❤️ {post.likes?.length || 0}</span>
                <span>💬 {post.comments?.length || 0}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Post Detail Modal */}
      {selectedPost && (
        <div className="post-modal-backdrop" onClick={() => setSelectedPost(null)}>
          <div className="post-modal" onClick={(e) => e.stopPropagation()}>
            <button className="post-modal-close" onClick={() => setSelectedPost(null)}>✕</button>
            {selectedPost.image && (
              <div className="post-modal-img">
                <img src={selectedPost.image} alt="post" />
              </div>
            )}
            <div className="post-modal-info">
              <p className="post-modal-caption">
                <strong>{profile.username}</strong> {selectedPost.caption}
              </p>
              <div className="post-modal-stats">
                <span>❤️ {selectedPost.likes?.length || 0} likes</span>
                <span>💬 {selectedPost.comments?.length || 0} comments</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT PROFILE MODAL ── */}
      {showEdit && (
        <div className="edit-modal-backdrop" onClick={() => setShowEdit(false)}>
          <div className="edit-modal" onClick={(e) => e.stopPropagation()}>

            <div className="edit-modal-header">
              <button className="edit-modal-cancel" onClick={() => setShowEdit(false)}>Cancel</button>
              <span className="edit-modal-title">Edit Profile</span>
              <button className="edit-modal-save" onClick={handleSaveEdit} disabled={saving}>
                {saving ? '...' : 'Save'}
              </button>
            </div>

            <div className="edit-avatar-section">
              <div className="edit-avatar-preview">
                {editPreview || editData.profilePicture ? (
                  <img src={editPreview || editData.profilePicture} alt="preview" />
                ) : (
                  <span>{profile.username?.[0]?.toUpperCase()}</span>
                )}
              </div>
              <label className="edit-change-photo-btn">
                Change Profile Photo
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFilePick} />
              </label>
            </div>

            <div className="edit-fields">
              <div className="edit-field">
                <label>Name</label>
                <input
                  type="text"
                  value={editData.fullName}
                  onChange={(e) => setEditData((p) => ({ ...p, fullName: e.target.value }))}
                  placeholder="Full name"
                  maxLength={50}
                />
              </div>
              <div className="edit-field">
                <label>Bio</label>
                <textarea
                  value={editData.bio}
                  onChange={(e) => setEditData((p) => ({ ...p, bio: e.target.value }))}
                  placeholder="Write a short bio..."
                  maxLength={150}
                  rows={3}
                />
                <span className="edit-char-count">{editData.bio.length}/150</span>
              </div>
            </div>

            {saveMsg && (
              <p className={`edit-save-msg ${saveMsg.includes('Failed') ? 'error' : 'success'}`}>
                {saveMsg}
              </p>
            )}
          </div>
        </div>
      )}

    </div>
  );
}