const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const Post = require('../models/Post');
const protect = require('../middleware/auth');

// ── MULTER SETUP ──
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error('Images only!'));
  },
});

// GET /api/users/search?q=query
router.get('/search', protect, async (req, res) => {
  try {
    const q = req.query.q;
    if (!q) return res.json([]);
    const users = await User.find({
      username: { $regex: q, $options: 'i' },
      _id: { $ne: req.user._id }
    }).select('username profilePicture bio followers').limit(10);
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users/suggestions
router.get('/suggestions', protect, async (req, res) => {
  try {
    const me = await User.findById(req.user._id);
    const users = await User.find({
      _id: { $nin: [...(me.following || []), me._id] }
    }).select('username profilePicture bio followers').limit(20);
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ PUT /api/users/profile — Edit profile (name, bio, profilePicture)
router.put('/profile', protect, upload.single('profilePicture'), async (req, res) => {
  try {
    const { fullName, bio } = req.body;

    const updateData = {};
    if (fullName !== undefined) updateData.fullName = fullName.trim();
    if (bio !== undefined) updateData.bio = bio.trim();

    // If new profile picture uploaded
    if (req.file) {
      const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
      updateData.profilePicture = `${BASE_URL}/uploads/${req.file.filename}`;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true }
    ).select('-password');

    res.json({ user: updatedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users/:username - profile + posts
router.get('/:username', protect, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    const posts = await Post.find({ author: user._id })
      .sort({ createdAt: -1 })
      .populate('author', 'username profilePicture');
    res.json({ user, posts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/users/:id/follow
router.put('/:id/follow', protect, async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: "Can't follow yourself" });
    }
    const target = await User.findById(req.params.id);
    const me = await User.findById(req.user._id);
    if (!target) return res.status(404).json({ message: 'User not found' });

    const isFollowing = target.followers?.includes(req.user._id);

    if (isFollowing) {
      target.followers = target.followers.filter(id => id.toString() !== req.user._id.toString());
      me.following = me.following.filter(id => id.toString() !== req.params.id);
    } else {
      target.followers = [...(target.followers || []), req.user._id];
      me.following = [...(me.following || []), req.params.id];
    }

    await target.save();
    await me.save();
    res.json({ following: !isFollowing });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;