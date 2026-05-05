const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production'
        ? (process.env.CLIENT_URL || 'https://smart-student-portal-6og7.onrender.com')
        : true,
      credentials: true,
    },
    pingTimeout: 60000,
  });

  // ── Auth middleware for sockets ──────────────────────────────────────────
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token ||
                    socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) return next(new Error('Authentication error: No token'));

      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      socket.userName = decoded.name;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.userId} (${socket.userRole})`);

    // Join user's personal room
    socket.join(socket.userId);

    // ── Chat events ────────────────────────────────────────────────────────
    socket.on('join_room', (roomId) => {
      socket.join(roomId);
      logger.info(`User ${socket.userId} joined room ${roomId}`);
    });

    socket.on('leave_room', (roomId) => {
      socket.leave(roomId);
    });

    socket.on('send_message', (data) => {
      // Broadcast to room participants
      io.to(data.roomId).emit('receive_message', {
        ...data,
        senderId: socket.userId,
        senderName: socket.userName,
        timestamp: new Date(),
      });
    });

    socket.on('typing', (data) => {
      socket.to(data.roomId).emit('user_typing', {
        userId: socket.userId,
        userName: socket.userName,
      });
    });

    socket.on('stop_typing', (data) => {
      socket.to(data.roomId).emit('user_stop_typing', { userId: socket.userId });
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.userId}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

// Emit notification to a specific user
const emitToUser = (userId, event, data) => {
  if (io) io.to(userId.toString()).emit(event, data);
};

module.exports = { initSocket, getIO, emitToUser };
