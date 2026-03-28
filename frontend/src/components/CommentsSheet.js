import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './CommentsSheet.css';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function CommentsSheet({ post, onClose, onCommentsUpdate }) {
  const { user } = useAuth();
  const [comments, setComments] = useState(post.comments || []);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef();
  const listRef = useRef();

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    setTimeout(() => inputRef.current?.focus(), 400);
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Scroll to bottom when comments load
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [comments]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      const res = await axios.post(`${API}/posts/${post._id}/comment`, { text });
      setComments(res.data.comments);
      setText('');
      if (onCommentsUpdate) onCommentsUpdate(res.data.comments);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const timeAgo = (date) => {
    const s = Math.floor((new Date() - new Date(date)) / 1000);
    if (s < 60) return `${s}s`;
    if (s < 3600) return `${Math.floor(s / 60)}m`;
    if (s < 86400) return `${Math.floor(s / 3600)}h`;
    return `${Math.floor(s / 86400)}d`;
  };

  return (
    <div className="cs-backdrop" onClick={onClose}>
      <div className="cs-sheet" onClick={(e) => e.stopPropagation()}>

        {/* Drag handle */}
        <div className="cs-handle" />

        {/* Header */}
        <div className="cs-header">
          <span className="cs-title">Comments</span>
          <button className="cs-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Comments list */}
        <div className="cs-list" ref={listRef}>
          {comments.length === 0 ? (
            <div className="cs-empty">
              <div className="cs-empty-icon">💬</div>
              <p>No comments yet</p>
              <span>Be the first to comment!</span>
            </div>
          ) : (
            comments.map((c, i) => (
              <div key={c._id || i} className="cs-comment">
                <Link to={`/profile/${c.user?.username}`} className="cs-avatar" onClick={onClose}>
                  {c.user?.profilePicture ? (
                    <img src={c.user.profilePicture} alt={c.user.username} />
                  ) : (
                    <span>{c.user?.username?.[0]?.toUpperCase()}</span>
                  )}
                </Link>
                <div className="cs-comment-body">
                  <div className="cs-comment-bubble">
                    <Link to={`/profile/${c.user?.username}`} className="cs-comment-user" onClick={onClose}>
                      {c.user?.username}
                    </Link>
                    <span className="cs-comment-text">{c.text}</span>
                  </div>
                  <span className="cs-comment-time">{timeAgo(c.createdAt)}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input */}
        <form className="cs-input-wrap" onSubmit={handleSubmit}>
          <div className="cs-input-avatar">
            {user?.profilePicture ? (
              <img src={user.profilePicture} alt={user.username} />
            ) : (
              <span>{user?.username?.[0]?.toUpperCase()}</span>
            )}
          </div>
          <div className="cs-input-box">
            <input
              ref={inputRef}
              type="text"
              placeholder="Add a comment…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={300}
              className="cs-input"
            />
            {text.trim() && (
              <button type="submit" className="cs-send" disabled={submitting}>
                {submitting ? (
                  <span className="cs-spinner" />
                ) : (
                  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                  </svg>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}