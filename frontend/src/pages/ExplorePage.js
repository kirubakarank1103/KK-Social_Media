import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './ExplorePage.css';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function ExplorePage() {
  const [posts, setPosts]               = useState([]);
  const [users, setUsers]               = useState([]);
  const [search, setSearch]             = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [searching, setSearching]       = useState(false);
  const [tab, setTab]                   = useState('posts');

  const fetchExplore = useCallback(async () => {
    try {
      const [postsRes, usersRes] = await Promise.all([
        axios.get(`${API}/posts/explore`),
        axios.get(`${API}/users/suggestions`),
      ]);
      setPosts(postsRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchExplore(); }, [fetchExplore]);

  // Debounced search
  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await axios.get(`${API}/users/search?q=${search}`);
        setSearchResults(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // ✅ video check using mediaType
  const isVideo = (post) =>
    post.mediaType === 'video' ||
    (post.image && (
      post.image.endsWith('.mp4') ||
      post.image.endsWith('.webm') ||
      post.image.endsWith('.mov')
    ));

  return (
    <div className="explore-page">

      {/* ── SEARCH BAR ── */}
      <div className="explore-search-wrap">
        <div className="explore-search-box">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Search people..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="explore-search-input"
          />
          {search && (
            <button className="search-clear" onClick={() => setSearch('')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ── SEARCH RESULTS ── */}
      {search.trim() ? (
        <div className="search-results">
          {searching ? (
            <div className="search-loading">
              <span className="search-spinner" />
              Searching...
            </div>
          ) : searchResults.length === 0 ? (
            <div className="search-empty">
              <div style={{fontSize:36}}>🔍</div>
              <p>No users found for <strong>"{search}"</strong></p>
            </div>
          ) : (
            searchResults.map((u) => (
              <Link key={u._id} to={`/profile/${u.username}`} className="search-user-item">
                <div className="search-user-avatar">
                  {/* ✅ FIX: profilePicture */}
                  {u.profilePicture ? (
                    <img src={u.profilePicture} alt={u.username} />
                  ) : (
                    <span>{u.username?.[0]?.toUpperCase()}</span>
                  )}
                </div>
                <div className="search-user-info">
                  <div className="search-user-name-row">
                    <span className="search-user-name">{u.username}</span>
                    {u.isVerified && (
                      <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                        <circle cx="12" cy="12" r="12" fill="#3B82F6"/>
                        <path d="M7 13l3 3 7-7" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  {u.fullName && <span className="search-user-fullname">{u.fullName}</span>}
                  {u.bio && <span className="search-user-bio">{u.bio.slice(0, 60)}</span>}
                </div>
                <span className="search-user-arrow">→</span>
              </Link>
            ))
          )}
        </div>
      ) : (
        <>
          {/* ── TABS ── */}
          <div className="explore-tabs">
            <button
              className={`explore-tab ${tab === 'posts' ? 'active' : ''}`}
              onClick={() => setTab('posts')}
            >
              Posts
            </button>
            <button
              className={`explore-tab ${tab === 'people' ? 'active' : ''}`}
              onClick={() => setTab('people')}
            >
              People
            </button>
          </div>

          {/* ── POSTS GRID ── */}
          {tab === 'posts' && (
            loading ? (
              <div className="explore-grid">
                {[1,2,3,4,5,6,7,8,9].map(i => (
                  <div key={i} className="explore-skel" />
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="explore-empty">
                <div style={{fontSize:48}}>🌍</div>
                <h3>Nothing to explore yet</h3>
                <p>Be the first to post something!</p>
              </div>
            ) : (
              <div className="explore-grid">
                {posts.map((post) => (
                  <Link
                    key={post._id}
                    to={`/profile/${post.author?.username}`}
                    className="explore-post"
                  >
                    {/* ✅ FIX: show video thumbnail or image */}
                    {isVideo(post) ? (
                      <div className="explore-video-wrap">
                        <video
                          src={post.image}
                          className="explore-media"
                          muted
                          playsInline
                          preload="metadata"
                        />
                        <div className="explore-video-badge">
                          <svg viewBox="0 0 24 24" fill="white" width="12" height="12">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        </div>
                      </div>
                    ) : post.image ? (
                      <img
                        src={post.image}
                        alt="post"
                        className="explore-media"
                        loading="lazy"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.classList.add('img-error');
                        }}
                      />
                    ) : (
                      <div className="explore-post-text">
                        <p>{post.caption?.slice(0, 80)}</p>
                      </div>
                    )}

                    {/* Hover overlay */}
                    <div className="explore-post-overlay">
                      <span>
                        <svg viewBox="0 0 24 24" fill="white" width="16" height="16">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                        {post.likes?.length || 0}
                      </span>
                      <span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" width="16" height="16">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                        </svg>
                        {post.comments?.length || 0}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )
          )}

          {/* ── PEOPLE TAB ── */}
          {tab === 'people' && (
            <div className="people-list">
              {users.length === 0 ? (
                <div className="explore-empty">
                  <div style={{fontSize:48}}>👥</div>
                  <h3>No suggestions yet</h3>
                </div>
              ) : (
                users.map((u) => (
                  <Link key={u._id} to={`/profile/${u.username}`} className="people-item">
                    <div className="people-avatar-ring">
                      <div className="people-avatar">
                        {/* ✅ FIX: profilePicture */}
                        {u.profilePicture ? (
                          <img src={u.profilePicture} alt={u.username} />
                        ) : (
                          <span>{u.username?.[0]?.toUpperCase()}</span>
                        )}
                      </div>
                    </div>
                    <div className="people-info">
                      <div className="people-name-row">
                        <span className="people-name">{u.username}</span>
                        {u.isVerified && (
                          <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                            <circle cx="12" cy="12" r="12" fill="#3B82F6"/>
                            <path d="M7 13l3 3 7-7" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                      {u.fullName && <span className="people-fullname">{u.fullName}</span>}
                      <span className="people-followers">{u.followers?.length || 0} followers</span>
                    </div>
                    <span className="people-arrow">→</span>
                  </Link>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}