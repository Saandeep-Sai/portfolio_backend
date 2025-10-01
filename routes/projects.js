const express = require('express');
const { Project } = require('../models');
const auth = require('../middleware/auth');
const { cache } = require('../config/database');
const aiService = require('../services/aiService');
const notificationService = require('../services/notifications');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// Get all projects (no cache for testing)
router.get('/', async (req, res) => {
  try {
    const { featured, category, limit } = req.query;
    
    let query = { orderBy: { field: 'createdAt', direction: 'desc' } };
    if (featured === 'true') query.featured = true;
    if (category) query.category = category;
    if (limit) query.limit = parseInt(limit);
    
    const projects = await Project.find(query);
    
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single project
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create project (admin only)
router.post('/', auth, [
  body('title').trim().isLength({ min: 3, max: 100 }).escape(),
  body('description').trim().isLength({ min: 10, max: 1000 }).escape(),
  body('technologies').isArray({ min: 1 }),
  body('liveUrl').optional().isURL(),
  body('githubUrl').optional().isURL()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const projectData = req.body;
    
    // Generate AI description if not provided
    if (!projectData.description && projectData.title && projectData.technologies) {
      try {
        projectData.description = await aiService.generateProjectDescription(
          projectData.title, 
          projectData.technologies
        );
      } catch (error) {
        console.error('AI description generation failed:', error);
      }
    }
    
    const project = await Project.create(projectData);
    
    // Clear cache
    await cache.del('projects:all:all:all');
    await cache.del('projects:true:all:all');
    
    // Send notification
    const io = req.app.get('io');
    io.to('admin').emit('project-created', project);
    
    res.status(201).json(project);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update project (admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    const project = await Project.update(req.params.id, req.body);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Clear cache
    await cache.del('projects:all:all:all');
    await cache.del('projects:true:all:all');
    
    res.json(project);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete project (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    await Project.delete(req.params.id);
    
    // Clear cache
    await cache.del('projects:all:all:all');
    await cache.del('projects:true:all:all');
    
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Track project click
router.post('/:id/click', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const updatedProject = await Project.update(req.params.id, {
      clicks: (project.clicks || 0) + 1
    });
    
    // Send notification for milestone clicks
    if (updatedProject.clicks % 10 === 0) {
      await notificationService.sendProjectClickNotification(
        updatedProject.title, 
        updatedProject.clicks
      );
    }
    
    // Clear cache
    await cache.del('projects:all:all:all');
    
    res.json({ clicks: updatedProject.clicks });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get project statistics (admin only)
router.get('/stats', auth, async (req, res) => {
  try {
    const totalProjects = await Project.count();
    const featuredProjects = await Project.count({ featured: true });
    
    res.json({
      totalProjects,
      featuredProjects
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;