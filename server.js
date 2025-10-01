const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const session = require('express-session');

const { createServer } = require('http');
const { Server } = require('socket.io');
const cron = require('node-cron');
const winston = require('winston');
const expressWinston = require('express-winston');

const { db, cache } = require('./config/database');
require('dotenv').config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 5000;

// Firebase initialized

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Request logging
app.use(expressWinston.logger({
  winstonInstance: logger,
  meta: true,
  msg: 'HTTP {{req.method}} {{req.url}}',
  expressFormat: true,
  colorize: false
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Contact form rate limiting
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5 // limit each IP to 5 contact form submissions per hour
});

// Analytics middleware
app.use(async (req, res, next) => {
  req.startTime = Date.now();
  
  // Track page views
  if (req.method === 'GET' && !req.url.startsWith('/api/')) {
    try {
      const geoip = require('geoip-lite');
      const ip = req.ip || req.connection.remoteAddress;
      const geo = geoip.lookup(ip);
      
      const { Analytics } = require('./models');
      await Analytics.create({
        page: req.url,
        ip: ip,
        userAgent: req.get('User-Agent'),
        country: geo?.country || 'Unknown',
        city: geo?.city || 'Unknown',
        sessionId: req.sessionID,
        referrer: req.get('Referrer') || 'Direct'
      });
    } catch (error) {
      logger.error('Analytics tracking error:', error);
    }
  }
  
  next();
});

// Routes
app.use('/api/contact', contactLimiter, require('./routes/contact'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/blog', require('./routes/blog'));
app.use('/api/skills', require('./routes/skills'));
app.use('/api/achievements', require('./routes/achievements'));
app.use('/api/testimonials', require('./routes/testimonials'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/upload', require('./routes/upload'));

// AI Chatbot endpoint
app.post('/api/chatbot', async (req, res) => {
  try {
    const aiService = require('./services/aiService');
    const response = await aiService.getChatbotResponse(req.body.message);
    res.json({ response });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Error logging
app.use(expressWinston.errorLogger({
  winstonInstance: logger
}));

// Error handling
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Socket.IO for real-time features
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join-admin', () => {
    socket.join('admin');
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Cron jobs
cron.schedule('0 0 * * *', async () => {
  // Daily cache cleanup
  try {
    const snapshot = await db.collection('cache').get();
    const batch = db.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    logger.info('Cache cleaned up');
  } catch (error) {
    logger.error('Cache cleanup error:', error);
  }
});

// Export io for use in routes
app.set('io', io);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Server started on port ${PORT}`);
});