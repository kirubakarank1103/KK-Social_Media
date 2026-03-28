import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './StoriesRow.css';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function StoriesRow() {
  const { user } = useAuth();
  const [stories, setStories] = useState([]);   // grouped by user
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState(null); // { userStories, index }
  const [progress, setProgress] = useState(0);
  const timerRef = useRef();
  const scrollRef = useRef();

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      const res = await axios.get(`${API}/stories`);
      // Group stories by author
      const grouped = {};
      res.data.forEach((s) => {
        const uid = s.author?._id;
        if (!uid) return;
        if (!grouped[uid]) {
          grouped[uid] = { author: s.author, stories: [] };
        }
        grouped[uid].stories.push(s);
      });
      setStories(Object.values(grouped));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ── VIEWER LOGIC ──
  const openStory = (groupIndex) => {
    setViewing({ groupIndex, storyIndex: 0 });
    setProgress(0);
  };

  const closeViewer = () => {
    clearInterval(timerRef.current);
    setViewing(null);
    setProgress(0);
  };

  const nextStory = () => {
    if (!viewing) return;
    const group = stories[viewing.groupIndex];
    if (viewing.storyIndex < group.stories.length - 1) {
      setViewing((v) => ({ ...v, storyIndex: v.storyIndex + 1 }));
      setProgress(0);
    } else if (viewing.groupIndex < stories.length - 1) {
      setViewing({ groupIndex: viewing.groupIndex + 1, storyIndex: 0 });
      setProgress(0);
    } else {
      closeViewer();
    }
  };

  const prevStory = () => {
    if (!viewing) return;
    if (viewing.storyIndex > 0) {
      setViewing((v) => ({ ...v, storyIndex: v.storyIndex - 1 }));
      setProgress(0);
    } else if (viewing.groupIndex > 0) {
      const prevGroup = stories[viewing.groupIndex - 1];
      setViewing({ groupIndex: viewing.groupIndex - 1, storyIndex: prevGroup.stories.length - 1 });
      setProgress(0);
    }
  };

  // Auto-advance progress bar (5s per story)
  useEffect(() => {
    if (!viewing) return;
    clearInterval(timerRef.current);
    setProgress(0);
    const duration = 5000;
    const interval = 50;
    let elapsed = 0;
    timerRef.current = setInterval(() => {
      elapsed += interval;
      setProgress((elapsed / duration) * 100);
      if (elapsed >= duration) {
        clearInterval(timerRef.current);
        nextStory();
      }
    }, interval);
    return () => clearInterval(timerRef.current);
  }, [viewing]);

  if (loading) return <StoriesSkeleton />;
  if (stories.length === 0) return null;

  const currentGroup   = viewing ? stories[viewing.groupIndex] : null;
  const currentStory   = currentGroup?.stories[viewing?.storyIndex];
  const isCurrentVideo = currentStory?.mediaType === 'video' ||
    (currentStory?.mediaUrl && (
      currentStory.mediaUrl.endsWith('.mp4') ||
      currentStory.mediaUrl.endsWith('.webm')
    ));

  return (
    <>
      {/* ── STORIES ROW ── */}
      <div className="stories-row-wrap">
        <div className="stories-row" ref={scrollRef}>

          {/* Your story bubble */}
          <div className="story-bubble your-story" onClick={() => {}}>
            <div className="story-avatar-ring no-ring">
              <div className="story-avatar">
                {user?.profilePicture ? (
                  <img src={user.profilePicture} alt={user.username} />
                ) : (
                  <span>{user?.username?.[0]?.toUpperCase()}</span>
                )}
                <div className="story-add-btn">+</div>
              </div>
            </div>
            <span className="story-username">Your story</span>
          </div>

          {/* Other stories */}
          {stories.map((group, i) => (
            <div
              key={group.author._id}
              className="story-bubble"
              onClick={() => openStory(i)}
            >
              <div className="story-avatar-ring">
                <div className="story-avatar">
                  {group.author.profilePicture ? (
                    <img src={group.author.profilePicture} alt={group.author.username} />
                  ) : (
                    <span>{group.author.username?.[0]?.toUpperCase()}</span>
                  )}
                </div>
              </div>
              <span className="story-username">{group.author.username?.split('_')[0]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── STORY VIEWER ── */}
      {viewing && currentStory && (
        <div className="sv-backdrop" onClick={closeViewer}>
          <div className="sv-container" onClick={(e) => e.stopPropagation()}>

            {/* Progress bars */}
            <div className="sv-progress-row">
              {currentGroup.stories.map((_, i) => (
                <div key={i} className="sv-progress-track">
                  <div
                    className="sv-progress-fill"
                    style={{
                      width: i < viewing.storyIndex
                        ? '100%'
                        : i === viewing.storyIndex
                        ? `${progress}%`
                        : '0%'
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Author header */}
            <div className="sv-header">
              <div className="sv-author-avatar">
                {currentGroup.author.profilePicture ? (
                  <img src={currentGroup.author.profilePicture} alt="" />
                ) : (
                  <span>{currentGroup.author.username?.[0]?.toUpperCase()}</span>
                )}
              </div>
              <div className="sv-author-info">
                <span className="sv-author-name">{currentGroup.author.username}</span>
                <span className="sv-story-time">
                  {Math.floor((Date.now() - new Date(currentStory.createdAt)) / 3600000)}h ago
                </span>
              </div>
              <button className="sv-close" onClick={closeViewer}>
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" width="20" height="20">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Media */}
            <div className="sv-media-wrap">
              {isCurrentVideo ? (
                <video
                  key={currentStory._id}
                  src={currentStory.mediaUrl}
                  className="sv-media"
                  autoPlay
                  playsInline
                  muted
                  loop
                />
              ) : (
                <img
                  key={currentStory._id}
                  src={currentStory.mediaUrl}
                  alt="story"
                  className="sv-media"
                />
              )}
            </div>

            {/* Tap zones */}
            <div className="sv-tap-left"  onClick={prevStory} />
            <div className="sv-tap-right" onClick={nextStory} />
          </div>
        </div>
      )}
    </>
  );
}

function StoriesSkeleton() {
  return (
    <div className="stories-row-wrap">
      <div className="stories-row">
        {[1,2,3,4,5].map((i) => (
          <div key={i} className="story-bubble">
            <div className="story-skel-ring">
              <div className="story-skel-avatar" />
            </div>
            <div className="story-skel-name" />
          </div>
        ))}
      </div>
    </div>
  );
}