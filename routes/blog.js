const express = require('express');
const { Blog, Comment } = require('../models');
const auth  = require('../middleware/auth');
const { cache } = require('../config/database');
const aiService = require('../services/aiService');
const notificationService = require('../services/notifications');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// Get all published blogs (cached)
router.get('/', async (req, res) => {
  try {
    const { category, tag, limit = 10 } = req.query;
    const cacheKey = `blogs:${category || 'all'}:${tag || 'all'}:${limit}`;
    
    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }
    
    let query = { 
      published: true,
      orderBy: { field: 'createdAt', direction: 'desc' }
    };
    if (category) query.category = category;
    if (limit) query.limit = parseInt(limit);
    
    const blogs = await Blog.find(query);
    const total = await Blog.count({ published: true });
    
    const result = { blogs, total };
    await cache.set(cacheKey, result, 900);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single blog by slug
router.get('/:slug', async (req, res) => {
  try {
    const blogs = await Blog.find({ slug: req.params.slug, published: true });
    const blog = blogs[0];
    
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    
    // Increment views
    await Blog.update(blog.id, { views: (blog.views || 0) + 1 });
    
    // Get approved comments
    const comments = await Comment.find({ 
      blogId: blog.id, 
      approved: true,
      orderBy: { field: 'createdAt', direction: 'desc' }
    });
    
    res.json({ ...blog, comments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create blog (admin only)
router.post('/', auth, [
  body('title').trim().isLength({ min: 5, max: 200 }).escape(),
  body('content').trim().isLength({ min: 100 }),
  body('excerpt').optional().trim().isLength({ max: 300 }).escape(),
  body('category').trim().isLength({ min: 2, max: 50 }).escape(),
  body('tags').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const blogData = req.body;
    
    // Generate slug from title
    blogData.slug = blogData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    // Generate excerpt if not provided
    if (!blogData.excerpt) {
      blogData.excerpt = blogData.content.substring(0, 200) + '...';
    }
    
    // Generate SEO tags using AI
    try {
      const seoTags = await aiService.generateSEOTags(blogData.title, blogData.content);
      blogData.seoTitle = seoTags.title;
      blogData.seoDescription = seoTags.description;
    } catch (error) {
      console.error('SEO generation failed:', error);
    }
    
    const blog = await Blog.create(blogData);
    
    // Clear cache
    await cache.del('blogs:all:all:10');
    
    // Send notification if published
    if (blog.published) {
      await notificationService.sendBlogNotification(blog);
    }
    
    res.status(201).json(blog);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update blog (admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    const blogData = req.body;
    
    // Update slug if title changed
    if (blogData.title) {
      blogData.slug = blogData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }
    
    const blog = await Blog.update(req.params.id, blogData);
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    
    // Clear cache
    await cache.del('blogs:all:all:10');
    
    res.json(blog);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete blog (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    await Blog.delete(req.params.id);
    
    // Delete associated comments
    const comments = await Comment.find({ blogId: req.params.id });
    for (const comment of comments) {
      await Comment.delete(comment.id);
    }
    
    // Clear cache
    await cache.del('blogs:all:all:10');
    
    res.json({ message: 'Blog deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Like blog post
router.post('/:id/like', async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    
    const updatedBlog = await Blog.update(req.params.id, {
      likes: (blog.likes || 0) + 1
    });
    
    res.json({ likes: updatedBlog.likes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add comment to blog
router.post('/:id/comments', [
  body('name').trim().isLength({ min: 2, max: 100 }).escape(),
  body('email').isEmail().normalizeEmail(),
  body('comment').trim().isLength({ min: 5, max: 1000 }).escape()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { name, email, comment } = req.body;
    
    const newComment = await Comment.create({
      blogId: req.params.id,
      name,
      email,
      comment,
      approved: false
    });
    
    // Send notification to admin
    const io = req.app.get('io');
    io.to('admin').emit('new-comment', newComment);
    
    res.status(201).json({ message: 'Comment submitted for approval' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get blog statistics (admin only)
router.get('/stats', auth, async (req, res) => {
  try {
    const totalBlogs = await Blog.count();
    const publishedBlogs = await Blog.count({ published: true });
    
    res.json({
      totalBlogs,
      publishedBlogs
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;