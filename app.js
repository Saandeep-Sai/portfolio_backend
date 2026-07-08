const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const session = require('express-session');
const winston = require('winston');
const expressWinston = require('express-winston');
const fs = require('fs');
const path = require('path');

const { db } = require('./config/database');
require('dotenv').config();

const isServerless = Boolean(process.env.VERCEL);

const allowedOrigins = [
  'http://localhost:3000',
  'https://portfolio-lyart-nu-sc7l5tytkt.vercel.app',
  process.env.FRONTEND_URL,
  process.env.FRONTEND_PROD_URL
].filter(Boolean);

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;

  return /^https:\/\/portfolio-[a-z0-9-]+\.vercel\.app$/i.test(origin);
};

const corsOptions = {
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
};

const loggerTransports = [];

if (!isServerless) {
  const logsDir = path.join(__dirname, 'logs');
  fs.mkdirSync(logsDir, { recursive: true });
  loggerTransports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error'
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log')
    })
  );
}

loggerTransports.push(
  new winston.transports.Console({
    format:
      process.env.NODE_ENV !== 'production'
        ? winston.format.simple()
        : winston.format.json()
  })
);

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: loggerTransports
});

const app = express();
app.set('trust proxy', 1);
app.set('io', {
  to: () => ({ emit: () => {} })
});

app.use(helmet());
app.use(compression());
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000
    }
  })
);

app.use(
  expressWinston.logger({
    winstonInstance: logger,
    meta: true,
    msg: 'HTTP {{req.method}} {{req.url}}',
    expressFormat: true,
    colorize: false
  })
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5
});

app.use(async (req, res, next) => {
  req.startTime = Date.now();

  if (req.method === 'GET' && !req.url.startsWith('/api/')) {
    try {
      const geoip = require('geoip-lite');
      const ip = req.ip || req.connection.remoteAddress;
      const geo = geoip.lookup(ip);

      const { Analytics } = require('./models');
      await Analytics.create({
        page: req.url,
        ip,
        userAgent: req.get('User-Agent'),
        country: geo?.country || 'Unknown',
        city: geo?.city || 'Unknown',
        sessionId: req.sessionID,
        referrer: req.get('Referrer') || 'Direct'
      });
    } catch (error) {
      logger.error('Analytics tracking error', { message: error.message });
    }
  }

  next();
});

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

app.post('/api/chatbot', async (req, res) => {
  try {
    const aiService = require('./services/aiService');
    const response = await aiService.getChatbotResponse(req.body.message);
    res.json({ response });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

app.use(
  expressWinston.errorLogger({
    winstonInstance: logger
  })
);

app.use((err, req, res, next) => {
  logger.error('Unhandled application error', {
    message: err.message,
    stack: err.stack,
    origin: req.get('origin') || null,
    path: req.originalUrl
  });

  if (!res.headersSent) {
    res.status(500).json({ error: 'Something went wrong!' });
  }
});

app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

module.exports = { app, corsOptions, logger, db, isServerless };
