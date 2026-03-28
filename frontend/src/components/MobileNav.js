import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CreatePostModal from './CreatePostModal';
import './MobileNav.css';

const MobileNav = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);

  const items = [
    { icon: '⌂', path: '/' },
    { icon: '◎', path: '/explore' },
    { icon: '✦', action: () => setShowCreate(true) },
    { icon: '◉', path: `/profile/${user?.username}` },
  ];

  return (
    <>
      <nav className="mobile-nav">
        {items.map((item, i) => {
          const isActive = item.path && location.pathname === item.path;
          return (
            <button
              key={i}
              className={`mobile-nav-btn ${isActive ? 'active' : ''} ${item.icon === '✦' ? 'create' : ''}`}
              onClick={() => item.action ? item.action() : navigate(item.path)}
            >
              {item.icon}
            </button>
          );
        })}
      </nav>
      {showCreate && <CreatePostModal onClose={() => setShowCreate(false)} />}
    </>
  );
};

export default MobileNav;