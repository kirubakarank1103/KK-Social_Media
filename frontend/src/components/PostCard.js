import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './PostCard.css';
import CommentsSheet from './CommentsSheet';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function PostCard({ post, onUpdate }) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(post.likes?.includes(user?._id));
  const [likeCount, setLikeCount] = useState(post.likes?.length || 0);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState(post.comments || []);
  const [showComments, setShowComments] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [heartAnim, setHeartAnim] = useState(false);
  const [saved, setSaved] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const menuRef = useRef();
  const videoRef = useRef();

  const isOwner = user?._id === post.author?._id;

  const isVideo =
    post.mediaType === 'video' ||
    (post.image &&
      (post.image.endsWith('.mp4') ||
        post.image.endsWith('.webm') ||
        post.image.endsWith('.mov') ||
        post.image.includes('/video')));

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLike = async () => {
    try {
      const res = await axios.put(`${API}/posts/${post._id}/like`);
      setLiked(res.data.liked);
      setLikeCount(res.data.likeCount);
      if (res.data.liked) {
        setHeartAnim(true);
        setTimeout(() => setHeartAnim(false), 800);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDoubleClick = () => {
    if (!liked) handleLike();
    setHeartAnim(true);
    setTimeout(() => setHeartAnim(false), 800);
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      const res = await axios.post(`${API}/posts/${post._id}/comment`, { text: comment });
      setComments(res.data.comments);
      setComment('');
      setShowComments(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await axios.delete(`${API}/posts/${post._id}`);
      setDeleted(true);
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error(err);
    }
    setShowMenu(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/post/${post._id}`);
    setShowMenu(false);
  };

  const toggleVideo = () => {
    if (!videoRef.current) return;
    if (videoPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setVideoPlaying(!videoPlaying);
  };

  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (deleted) return null;

  // ✅ CHANGE 1: return (<> instead of return (
  return (
    <>
      <article className="post-card">
        {/* ── HEADER ── */}
        <div className="post-header">
          <Link to={`/profile/${post.author?.username}`} className="post-author-link">
            <div className="post-avatar-ring">
              <div className="post-avatar">
                {post.author?.profilePicture ? (
                  <img src={post.author.profilePicture} alt={post.author.username} />
                ) : (
                  <span>{post.author?.username?.[0]?.toUpperCase()}</span>
                )}
              </div>
            </div>
            <div className="post-author-info">
              <div className="post-username-row">
                <span className="post-username">{post.author?.username}</span>
                {post.author?.isVerified && (
                  <svg className="verified-badge" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="12" fill="#3B82F6" />
                    <path d="M7 13l3 3 7-7" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <div className="post-meta-row">
                {post.location && (
                  <span className="post-location">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="10" height="10">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/>
                    </svg>
                    {post.location}
                  </span>
                )}
                <span className="post-time">{timeAgo(post.createdAt)}</span>
              </div>
            </div>
          </Link>

          {/* 3-dot menu */}
          <div className="post-menu-wrap" ref={menuRef}>
            <button className="post-more-btn" onClick={() => setShowMenu(!showMenu)} aria-label="More options">
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <circle cx="5" cy="12" r="2.2" /><circle cx="12" cy="12" r="2.2" /><circle cx="19" cy="12" r="2.2" />
              </svg>
            </button>
            {showMenu && (
              <div className="post-menu">
                {isOwner && (
                  <button className="post-menu-item danger" onClick={handleDelete}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                      <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                    </svg>
                    Delete post
                  </button>
                )}
                <button className="post-menu-item" onClick={handleCopyLink}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                  </svg>
                  Copy link
                </button>
                {!isOwner && (
                  <button className="post-menu-item danger" onClick={() => setShowMenu(false)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
                      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>
                    </svg>
                    Report
                  </button>
                )}
                <button className="post-menu-item cancel" onClick={() => setShowMenu(false)}>Cancel</button>
              </div>
            )}
          </div>
        </div>

        {/* ── MEDIA ── */}
        {post.image && (
          <div className="post-media-wrap" onDoubleClick={handleDoubleClick}>
            {heartAnim && (
              <div className="heart-burst">
                <svg viewBox="0 0 24 24" fill="white">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </div>
            )}

            {isVideo ? (
              <div className="video-container" onClick={toggleVideo}>
                <video
                  ref={videoRef}
                  src={post.image}
                  className="post-media"
                  playsInline
                  loop
                  muted
                  onPlay={() => setVideoPlaying(true)}
                  onPause={() => setVideoPlaying(false)}
                />
                {!videoPlaying && (
                  <div className="video-play-overlay">
                    <div className="play-btn-circle">
                      <svg viewBox="0 0 24 24" fill="white" width="28" height="28">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                  </div>
                )}
                <div className="video-badge">
                  <svg viewBox="0 0 24 24" fill="white" width="12" height="12">
                    <path d="M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4z"/>
                  </svg>
                  VIDEO
                </div>
              </div>
            ) : (
              <img src={post.image} alt={post.caption || 'post'} className="post-media" loading="lazy" />
            )}
          </div>
        )}

        {/* ── ACTIONS ── */}
        <div className="post-actions">
          <div className="post-action-left">
            <button
              className={`action-btn like-btn ${liked ? 'liked' : ''}`}
              onClick={handleLike}
              aria-label={liked ? 'Unlike' : 'Like'}
            >
              {liked ? (
                <svg viewBox="0 0 24 24" fill="#FF3040" width="24" height="24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              )}
            </button>

            <button
              className="action-btn comment-btn"
              onClick={() => setShowComments(!showComments)}
              aria-label="Comment"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </button>

            <button className="action-btn share-btn" aria-label="Share">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>

          <button
            className={`action-btn save-btn ${saved ? 'saved' : ''}`}
            onClick={() => setSaved(!saved)}
            aria-label="Save"
          >
            {saved ? (
              <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
              </svg>
            )}
          </button>
        </div>

        {/* ── LIKES ── */}
        {likeCount > 0 && (
          <div className="post-likes">
            <span>{likeCount.toLocaleString()} {likeCount === 1 ? 'like' : 'likes'}</span>
          </div>
        )}

        {/* ── CAPTION ── */}
        {post.caption && (
          <div className="post-caption">
            <Link to={`/profile/${post.author?.username}`} className="caption-username">
              {post.author?.username}
            </Link>
            <span className="caption-text"> {post.caption}</span>
          </div>
        )}

        {/* ── COMMENTS preview (only when sheet is closed) ── */}
        {/* ✅ CHANGE 2: showComments இருக்கும்போது inline comments காட்டாதே */}
        {comments.length > 0 && !showComments && (
          <button className="view-comments-btn" onClick={() => setShowComments(true)}>
            View all {comments.length} comment{comments.length > 1 ? 's' : ''}
          </button>
        )}

        {/* ── COMMENT INPUT ── */}
        <form className="comment-form" onSubmit={handleComment}>
          <div className="comment-avatar-sm">
            {user?.profilePicture ? (
              <img src={user.profilePicture} alt={user.username} />
            ) : (
              <span>{user?.username?.[0]?.toUpperCase()}</span>
            )}
          </div>
          <input
            type="text"
            placeholder="Add a comment…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="comment-input"
            maxLength={300}
          />
          {comment.trim() && (
            <button type="submit" className="comment-submit" disabled={submitting}>
              {submitting ? (
                <span className="spinner-sm" />
              ) : (
                'Post'
              )}
            </button>
          )}
        </form>

      </article>

      {/* ✅ CHANGE 3: CommentsSheet — article வெளியே, Fragment உள்ளே */}
      {showComments && (
        <CommentsSheet
          post={{ ...post, comments }}
          onClose={() => setShowComments(false)}
          onCommentsUpdate={(updated) => setComments(updated)}
        />
      )}
    </>
  );
}