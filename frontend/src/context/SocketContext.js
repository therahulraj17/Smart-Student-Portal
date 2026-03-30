import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!isAuthenticated) {
      if (socketRef.current) { socketRef.current.disconnect(); socketRef.current = null; }
      return;
    }
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    socketRef.current = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    const socket = socketRef.current;
    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    socket.on('notification', (data) => {
      setNotifications((prev) => [data, ...prev]);
      toast.custom((t) => (
        <div className={`${t.visible ? 'animate-slide-up' : 'opacity-0'} max-w-sm w-full bg-white shadow-lg rounded-xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 p-4`}>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">{data.title}</p>
            <p className="mt-1 text-sm text-gray-500 line-clamp-2">{data.message}</p>
          </div>
        </div>
      ), { duration: 4000 });
    });

    return () => { socket.disconnect(); };
  }, [isAuthenticated]);

  const joinRoom = (roomId) => socketRef.current?.emit('join_room', roomId);
  const leaveRoom = (roomId) => socketRef.current?.emit('leave_room', roomId);
  const sendMessage = (data) => socketRef.current?.emit('send_message', data);
  const emitTyping = (roomId) => socketRef.current?.emit('typing', { roomId });
  const emitStopTyping = (roomId) => socketRef.current?.emit('stop_typing', { roomId });

  const onEvent = (event, cb) => {
    socketRef.current?.on(event, cb);
    return () => socketRef.current?.off(event, cb);
  };

  return (
    <SocketContext.Provider value={{
      socket: socketRef.current, isConnected,
      notifications, setNotifications,
      joinRoom, leaveRoom, sendMessage, emitTyping, emitStopTyping, onEvent,
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
