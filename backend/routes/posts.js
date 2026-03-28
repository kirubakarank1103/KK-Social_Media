const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Post = require('../models/Post');
const User = require('../models/User');
const protect = require('../middleware/auth');

// ✅ Storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

// ✅ File filter — image + video both allow
const fileFilter = (req, file, cb) => {
  const imageTypes = /jpeg|jpg|png|gif|webp/;
  const videoTypes = /mp4|mov|avi|mkv|webm/;
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  if (imageTypes.test(ext) || videoTypes.test(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only images and videos are allowed!'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter
});

// ─── GET /api/posts/feed ───────────────────────────────────────
router.get('/feed', protect, async (req, res) => {
  try {
    const me = await User.findById(req.user._id);
    const userIds = [...(me.following || []), me._id];
    const posts = await Post.find({ author: { $in: userIds } })
      .sort({ createdAt: -1 })
      .limit(40)
      .populate('author', 'username fullName profilePicture isVerified')
      .populate('comments.user', 'username fullName profilePicture');
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── GET /api/posts/explore ────────────────────────────────────
router.get('/explore', protect, async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('author', 'username fullName profilePicture isVerified');
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── POST /api/posts ───────────────────────────────────────────
router.post('/', protect, upload.single('media'), async (req, res) => {
  try {
    const { caption, location } = req.body;

    if (!caption && !req.file) {
      return res.status(400).json({ message: 'Post must have a caption or media' });
    }

    // ✅ Detect mediaType from mimetype
    let mediaUrl  = null;
    let mediaType = 'image';

    if (req.file) {
      mediaUrl  = `/uploads/${req.file.filename}`;
      mediaType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';
    }

    const post = await Post.create({
      author:    req.user._id,
      caption:   caption || '',
      image:     mediaUrl,
      mediaType,            // ✅ Save mediaType
      location:  location || ''
    });

    await post.populate('author', 'username fullName profilePicture isVerified');
    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── PUT /api/posts/:id/like ───────────────────────────────────
router.put('/:id/like', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const idx = post.likes.findIndex(id => id.toString() === req.user._id.toString());
    if (idx === -1) {
      post.likes.push(req.user._id);
    } else {
      post.likes.splice(idx, 1);
    }
    await post.save();
    res.json({ liked: idx === -1, likeCount: post.likes.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── POST /api/posts/:id/comment ──────────────────────────────
router.post('/:id/comment', protect, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Comment cannot be empty' });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    post.comments.push({ user: req.user._id, text });
    await post.save();
    await post.populate('comments.user', 'username fullName profilePicture');
    res.json({ comments: post.comments });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── DELETE /api/posts/:id ─────────────────────────────────────
router.delete('/:id', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await post.deleteOne();
    res.json({ message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;