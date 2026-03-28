import React, { useState, useRef } from 'react';
import axios from 'axios';
import './CreatePostModal.css';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function CreatePostModal({ onClose, onCreated }) {
  const [step, setStep] = useState('select'); // select | preview | caption
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isVideo, setIsVideo] = useState(false);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const handleFile = (selectedFile) => {
    if (!selectedFile) return;
    const isVid = selectedFile.type.startsWith('video/');
    const isImg = selectedFile.type.startsWith('image/');
    if (!isVid && !isImg) {
      setError('Only images or videos allowed!');
      return;
    }
    // 50MB limit check
    if (selectedFile.size > 50 * 1024 * 1024) {
      setError('File too large! Max 50MB allowed.');
      return;
    }
    setFile(selectedFile);
    setIsVideo(isVid);
    setPreview(URL.createObjectURL(selectedFile));
    setStep('preview');
    setError('');
  };

  const handleInputChange = (e) => handleFile(e.target.files[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setProgress(0);
    try {
      const formData = new FormData();
      // ✅ FIX: field name must match backend upload.single('media')
      formData.append('media', file);
      formData.append('caption', caption);
      if (location.trim()) formData.append('location', location.trim());

      const res = await axios.post(`${API}/posts`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        // ✅ Upload progress tracking
        onUploadProgress: (e) => {
          const pct = Math.round((e.loaded * 100) / e.total);
          setProgress(pct);
        },
      });
      onCreated(res.data);
      onClose();
    } catch (err) {
      console.error('Post error:', err);
      setError(err.response?.data?.message || 'Failed to post. Try again.');
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const resetFile = () => {
    setFile(null);
    setPreview(null);
    setIsVideo(false);
    setStep('select');
    setError('');
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-container">

        {/* ── HEADER ── */}
        <div className="modal-header">
          {step !== 'select' && (
            <button
              className="modal-back"
              onClick={() => {
                if (step === 'caption') setStep('preview');
                else resetFile();
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
          )}

          <h3 className="modal-title">
            {step === 'select'  && 'Create new post'}
            {step === 'preview' && 'Preview'}
            {step === 'caption' && 'New post'}
          </h3>

          <div className="modal-header-right">
            {step === 'preview' && (
              <button className="modal-next" onClick={() => setStep('caption')}>
                Next
              </button>
            )}
            {step === 'caption' && (
              <button
                className="modal-share"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? `${progress}%` : 'Share'}
              </button>
            )}
            <button className="modal-close" onClick={onClose} aria-label="Close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        {/* ── UPLOAD PROGRESS BAR ── */}
        {loading && (
          <div className="upload-progress-wrap">
            <div className="upload-progress-bar" style={{ width: `${progress}%` }} />
          </div>
        )}

        {/* ── BODY ── */}
        <div className="modal-body">

          {/* STEP 1: Select file */}
          {step === 'select' && (
            <div
              className="upload-zone"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileRef.current.click()}
            >
              <div className="upload-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48">
                  <rect x="3" y="3" width="18" height="18" rx="3"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
              </div>
              <p className="upload-text">Drag photos and videos here</p>
              <button
                className="upload-btn"
                onClick={(e) => { e.stopPropagation(); fileRef.current.click(); }}
              >
                Select from device
              </button>
              <p className="upload-hint">JPG, PNG, MP4, MOV, WEBM • Max 50MB</p>
              <input
                ref={fileRef}
                type="file"
                accept="image/*,video/*"
                hidden
                onChange={handleInputChange}
              />
            </div>
          )}

          {/* STEP 2: Preview */}
          {step === 'preview' && preview && (
            <div className="preview-zone">
              {isVideo ? (
                <video
                  src={preview}
                  className="preview-media"
                  controls
                  playsInline
                  loop
                />
              ) : (
                <img src={preview} alt="preview" className="preview-media" />
              )}
              <button className="preview-change-btn" onClick={resetFile}>
                Change file
              </button>
            </div>
          )}

          {/* STEP 3: Caption + Location */}
          {step === 'caption' && (
            <div className="caption-zone">
              <div className="caption-left">
                {isVideo ? (
                  <video src={preview} className="caption-thumb" muted playsInline />
                ) : (
                  <img src={preview} alt="preview" className="caption-thumb" />
                )}
              </div>
              <div className="caption-right">
                <textarea
                  className="caption-input"
                  placeholder="Write a caption…"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  maxLength={2200}
                  autoFocus
                />
                <div className="caption-count">{caption.length}/2,200</div>

                <div className="location-input-wrap">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14" style={{color:'#888', flexShrink:0}}>
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/>
                  </svg>
                  <input
                    type="text"
                    className="location-input"
                    placeholder="Add location…"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    maxLength={100}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="modal-error">
              <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}