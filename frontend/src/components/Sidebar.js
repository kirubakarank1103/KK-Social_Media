import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CreatePostModal from './CreatePostModal';
import './Sidebar.css';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showCreatePost, setShowCreatePost] = useState(false);

  const getAvatar = (u) => {
    if (u?.profilePicture) return <img src={u.profilePicture} alt={u.username} className="avatar" style={{ width: 32, height: 32 }} />;
    return (
      <div className="avatar" style={{ width: 32, height: 32, fontSize: 14 }}>
        {u?.fullName?.[0]?.toUpperCase() || '?'}
      </div>
    );
  };

  const navItems = [
    { icon: '⌂', label: 'Home', path: '/' },
    { icon: '◎', label: 'Explore', path: '/explore' },
    { icon: '✦', label: 'Create', action: () => setShowCreatePost(true) },
    { icon: '◉', label: 'Profile', path: `/profile/${user?.username}` },
  ];

  return (
    <>
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="logo-icon">✦</span>
          <span className="logo-text">Vibe</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item, i) => {
            const isActive = item.path && location.pathname === item.path;
            return (
              <button
                key={i}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => item.action ? item.action() : navigate(item.path)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
                {isActive && <div className="nav-indicator" />}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-user" onClick={() => navigate(`/profile/${user?.username}`)}>
            {getAvatar(user)}
            <div className="user-info">
              <span className="user-display-name">{user?.fullName}</span>
              <span className="user-handle">@{user?.username}</span>
            </div>
          </div>
          <button className="logout-btn" onClick={logout} title="Logout">
            <span>⟵</span>
          </button>
        </div>
      </aside>

      {showCreatePost && <CreatePostModal onClose={() => setShowCreatePost(false)} />}
    </>
  );
};

export default Sidebar;