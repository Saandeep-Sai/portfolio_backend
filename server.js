const { createServer } = require('http');
const { Server } = require('socket.io');
const cron = require('node-cron');
const { app, corsOptions, logger, db, isServerless } = require('./app');

const server = createServer(app);
const io = new Server(server, { cors: corsOptions });

const PORT = process.env.PORT || 5000;

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

app.set('io', io);

if (!isServerless) {
  cron.schedule('0 0 * * *', async () => {
    try {
      const snapshot = await db.collection('cache').get();
      const batch = db.batch();
      snapshot.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
      logger.info('Cache cleaned up');
    } catch (error) {
      logger.error('Cache cleanup error', { message: error.message });
    }
  });

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`Server started on port ${PORT}`);
  });
}

module.exports = app;
