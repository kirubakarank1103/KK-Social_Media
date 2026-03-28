import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import PostCard from '../components/PostCard';
import CreatePostModal from '../components/CreatePostModal';
import { useAuth } from '../context/AuthContext';
import './HomePage.css';
import StoriesRow from '../components/StoriesRow';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function HomePage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFeed = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      // ✅ FIX: Try feed first, fallback to explore if empty
      const res = await axios.get(`${API}/posts/feed`);
      let feedPosts = res.data;

      // If following nobody yet — show explore posts so page isn't empty
      if (feedPosts.length === 0) {
        const exploreRes = await axios.get(`${API}/posts/explore`);
        feedPosts = exploreRes.data;
      }

      setPosts(feedPosts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const handlePostCreated = (newPost) => {
    setPosts((prev) => [newPost, ...prev]);
    setShowModal(false);
  };

  const handleUpdate = () => fetchFeed(false);

  return (
    <div className="home-page">

      {/* ── CREATE BAR ── */}
      <div className="create-bar" onClick={() => setShowModal(true)}>
        <div className="create-avatar">
          {/* ✅ FIX: profilePicture not profilePic */}
          {user?.profilePicture ? (
            <img src={user.profilePicture} alt={user.username} />
          ) : (
            <span>{user?.username?.[0]?.toUpperCase()}</span>
          )}
        </div>
        
        <span className="create-placeholder">What's on your mind, {user?.username?.split('_')[0]}?</span>
        <button className="create-photo-btn" onClick={(e) => { e.stopPropagation(); setShowModal(true); }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
          Photo/Video
        </button>
      </div>

{/* ── STORIES ── */}
<StoriesRow />

      {/* ── REFRESH INDICATOR ── */}
      {refreshing && (
        <div className="refresh-bar">
          <span className="refresh-spinner" />
          <span>Updating feed…</span>
        </div>
      )}

      {/* ── FEED ── */}
      {loading ? (
        <div className="feed-loading">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton-header">
                <div className="skeleton-avatar" />
                <div className="skeleton-lines">
                  <div className="skeleton-line short" />
                  <div className="skeleton-line shorter" />
                </div>
              </div>
              <div className="skeleton-image" />
              <div className="skeleton-footer">
                <div className="skeleton-line medium" />
              </div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="empty-feed">
          <div className="empty-icon">📷</div>
          <h3>Your feed is empty</h3>
          <p>Follow people to see their posts, or create your first post!</p>
          <button className="create-first-btn" onClick={() => setShowModal(true)}>
            + Create your first post
          </button>
        </div>
      ) : (
        <div className="feed-list">
          {posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              onUpdate={handleUpdate}
            />
          ))}

          {/* End of feed */}
          <div className="feed-end">
            <div className="feed-end-line" />
            <span>You're all caught up ✓</span>
            <div className="feed-end-line" />
          </div>
        </div>
      )}

      {/* ── FAB: Create Post ── */}
      <button
        className="fab-create"
        onClick={() => setShowModal(true)}
        aria-label="Create post"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="22" height="22">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5"  y1="12" x2="19" y2="12"/>
        </svg>
      </button>

      {/* ── MODAL ── */}
      {showModal && (
        <CreatePostModal
          onClose={() => setShowModal(false)}
          onCreated={handlePostCreated}
        />
      )}
    </div>
  );
}