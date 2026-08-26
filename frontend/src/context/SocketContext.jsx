import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { SOCKET_URL } from '../utils/constants';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  
  // Real-time notification count
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  
  // Real-time call state
  const [incomingCall, setIncomingCall] = useState(null);
  
  const socketRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated || !user?._id) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const newSocket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      newSocket.emit('join', user._id);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('user-online', ({ userId, isOnline }) => {
      setOnlineUsers(prev => {
        const next = new Set(prev);
        if (isOnline) {
          next.add(userId);
        } else {
          next.delete(userId);
        }
        return next;
      });
    });

    newSocket.on('online-statuses', (statuses) => {
      const onlineSet = new Set();
      Object.entries(statuses).forEach(([id, isOnline]) => {
        if (isOnline) onlineSet.add(id);
      });
      setOnlineUsers(onlineSet);
    });

    newSocket.on('incoming-call', (data) => {
      setIncomingCall(data);
    });

    newSocket.on('call-ended', () => {
      setIncomingCall(null);
    });

    newSocket.on('call-rejected', () => {
      setIncomingCall(null);
    });

    newSocket.on('new-notification', () => {
      setUnreadNotifications(prev => prev + 1);
    });

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, user?._id]);

  const sendMessage = (receiverId, message) => {
    if (socketRef.current) {
      socketRef.current.emit('send-message', { receiverId, message });
    }
  };

  const emitTyping = (receiverId, isTyping) => {
    if (socketRef.current && user?._id) {
      socketRef.current.emit('typing', { receiverId, senderId: user._id, isTyping });
    }
  };

  const checkOnline = (userIds) => {
    if (socketRef.current && Array.isArray(userIds) && userIds.length > 0) {
      socketRef.current.emit('check-online', userIds);
    }
  };

  return (
    <SocketContext.Provider value={{
      socket,
      isConnected,
      onlineUsers,
      unreadNotifications,
      setUnreadNotifications,
      incomingCall,
      setIncomingCall,
      sendMessage,
      emitTyping,
      checkOnline
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
