const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const Post = require('../models/Post');
const User = require('../models/User');
const protect = require('../middleware/auth');

// ✅ Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Multer — Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isVideo = file.mimetype.startsWith('video/');
    return {
      folder: 'kk-social',
      resource_type: isVideo ? 'video' : 'image',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'mov', 'webm'],
    };
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
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

    let mediaUrl  = null;
    let mediaType = 'image';

     if (req.file) {
      const isVid = req.file.mimetype.startsWith('video/');
      mediaType = isVid ? 'video' : 'image';
      // ✅ Cloudinary auto optimize URL
      if (!isVid) {
        mediaUrl = req.file.path.replace('/upload/', '/upload/f_auto,q_auto,w_1080/');
      } else {
        mediaUrl = req.file.path;
      }
    }

    const post = await Post.create({
      author:   req.user._id,
      caption:  caption || '',
      image:    mediaUrl,
      mediaType,
      location: location || ''
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
    // ✅ Delete from Cloudinary too
    if (post.image) {
      const publicId = post.image.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`kk-social/${publicId}`).catch(() => {});
    }
    await post.deleteOne();
    res.json({ message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;