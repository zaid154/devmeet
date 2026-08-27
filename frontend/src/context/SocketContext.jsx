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
  
  // Global Real-time Calling State
  const [callState, setCallState] = useState({
    status: 'idle', // 'idle' | 'calling' | 'incoming' | 'connected'
    targetUser: null,
    callType: 'audio', // 'audio' | 'video'
    offer: null,
    callerId: null
  });
  
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

    // Call Signaling Events — only UI state, WebRTC handled by CallOverlay
    newSocket.on('incoming-call', ({ callerInfo, callType, offer, callerId }) => {
      setCallState({
        status: 'incoming',
        targetUser: callerInfo,
        callType: callType || 'audio',
        offer: offer || null,
        callerId: callerId || null
      });
    });

    newSocket.on('call-answered', ({ answer }) => {
      setCallState(prev => ({ ...prev, status: 'connected', answer }));
    });

    newSocket.on('call-ended', () => {
      setCallState({ status: 'idle', targetUser: null, callType: 'audio', offer: null, callerId: null });
    });

    newSocket.on('call-rejected', () => {
      setCallState({ status: 'idle', targetUser: null, callType: 'audio', offer: null, callerId: null });
    });

    newSocket.on('call-user-offline', () => {
      setCallState({ status: 'idle', targetUser: null, callType: 'audio', offer: null, callerId: null });
      alert('The user is currently offline or unreachable.');
    });

    newSocket.on('new-notification', () => {
      setUnreadNotifications(prev => prev + 1);
    });

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, user?._id]);

  // startCall: Only sets UI state. CallOverlay will handle WebRTC offer + socket emit.
  const startCall = (targetUser, callType = 'audio') => {
    if (!targetUser?._id) return;
    setCallState({ status: 'calling', targetUser, callType, callerInfo: user });
  };

  // acceptCall: Only sets UI state. CallOverlay will handle WebRTC answer + socket emit.
  const acceptCall = () => {
    setCallState(prev => ({ ...prev, status: 'connected' }));
  };

  const declineCall = () => {
    if (socketRef.current && callState.targetUser?._id) {
      socketRef.current.emit('call-reject', { targetUserId: callState.targetUser._id });
    }
    setCallState({ status: 'idle', targetUser: null, callType: 'audio', offer: null, callerId: null });
  };

  const endCall = () => {
    if (socketRef.current && callState.targetUser?._id) {
      socketRef.current.emit('call-end', { targetUserId: callState.targetUser._id });
    }
    setCallState({ status: 'idle', targetUser: null, callType: 'audio', offer: null, callerId: null });
  };

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
      callState,
      setCallState,
      startCall,
      acceptCall,
      declineCall,
      endCall,
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
