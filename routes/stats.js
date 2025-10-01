const express = require('express');
const router = express.Router();
const { db } = require('../config/database');

// Get real-time stats
async function getRealTimeStats() {
  try {
    const [projectsSnap, achievementsSnap, analyticsSnap] = await Promise.all([
      db.collection('projects').get(),
      db.collection('achievements').get(),
      db.collection('stats').doc('daily').get()
    ]);

    // Count deployed projects
    const deployedProjects = projectsSnap.docs.filter(doc => doc.data().isDeployed).length;
    const totalProjects = projectsSnap.size;

    // Get unique clients from projects
    const clients = new Set(projectsSnap.docs.map(doc => doc.data().client).filter(Boolean));

    // Calculate years of experience (from earliest project/achievement)
    const dates = [
      ...projectsSnap.docs.map(doc => doc.data().startDate),
      ...achievementsSnap.docs.map(doc => doc.data().date)
    ].filter(Boolean);
    const earliestDate = dates.length > 0 ? new Date(Math.min(...dates.map(d => new Date(d)))) : new Date();
    const experienceYears = Math.ceil((new Date() - earliestDate) / (1000 * 60 * 60 * 24 * 365));

    // Count hackathons and certifications from achievements
    const hackathons = achievementsSnap.docs.filter(doc => doc.data().type === 'hackathon').length;
    const certifications = achievementsSnap.docs.filter(doc => doc.data().type === 'certification').length;

    return {
      projects: totalProjects,
      clients: clients.size,
      experience: experienceYears,
      hackathons,
      certifications,
      githubStars: 500, // TODO: Integrate with GitHub API
      deployed: deployedProjects,
  achievements: await getRecentAchievements(),
      skills: await getTopSkills()
    };
  } catch (error) {
    console.error('Error generating stats:', error);
    throw error;
  }
}

// Get recent achievements
async function getRecentAchievements() {
  const achievementsSnap = await db.collection('achievements')
    .orderBy('date', 'desc')
    .limit(5)
    .get();
    
  return achievementsSnap.docs.map(doc => {
    const data = doc.data();
    return {
      title: data.title,
      prize: data.prize,
      organization: data.organization,
      year: new Date(data.date).getFullYear()
    };
  });
}

// Get top skills
async function getTopSkills() {
  const skillsSnap = await db.collection('skills')
    .orderBy('level', 'desc')
    .limit(5)
    .get();
    
  return skillsSnap.docs.map(doc => {
    const data = doc.data();
    return {
      name: data.name,
      level: data.level
    };
  });
}

// Get all stats
router.get('/', async (req, res) => {
  try {
    const stats = await getRealTimeStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get specific stat
router.get('/:type', async (req, res) => {
  try {
    const stats = await getRealTimeStats();
    const { type } = req.params;
    
    if (stats[type]) {
      res.json({ [type]: stats[type] });
    } else {
      res.status(404).json({ error: 'Stat not found' });
    }
  } catch (error) {
    console.error('Error fetching stat:', error);
    res.status(500).json({ error: 'Failed to fetch statistic' });
  }
});

module.exports = router;
;

// Get all stats
router.get('/', async (req, res) => {
  try {
    const stats = await getRealTimeStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get specific stat
router.get('/:type', async (req, res) => {
  try {
    const stats = await getRealTimeStats();
    const { type } = req.params;
  
  if (stats[type]) {
    res.json({ [type]: stats[type] });
  } else {
    res.status(404).json({ error: 'Stat type not found' });
  }
} catch (error) {
    console.error('Error fetching stat:', error);
    res.status(500).json({ error: 'Failed to fetch statistic' });
  }
});
  

// Update stats (for admin use)
router.put('/:type', (req, res) => {
  const { type } = req.params;
  const { value } = req.body;
  
  if (stats.hasOwnProperty(type) && typeof value === 'number') {
    stats[type] = value;
    res.json({ success: true, [type]: value });
  } else {
    res.status(400).json({ error: 'Invalid stat type or value' });
  }
});

module.exports = router;