import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { chatAPI } from '../services/api';
import { Spinner } from '../components/common/UI';
import { PaperAirplaneIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { Message as MessageModel } from '../services/api';
import toast from 'react-hot-toast';

export default function Chat() {
  const { user } = useAuth();
  const { onEvent, sendMessage: socketSend, joinRoom, leaveRoom, emitTyping, emitStopTyping } = useSocket() || {};
  const [chatUsers, setChatUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState('');
  const messagesEndRef = useRef(null);
  const typingTimer = useRef(null);

  useEffect(() => {
    chatAPI.getUsers()
      .then((r) => setChatUsers(r.data.data.users))
      .catch(() => toast.error('Failed to load contacts'))
      .finally(() => setUsersLoading(false));
  }, []);

  const roomId = selectedUser
    ? [user._id, selectedUser._id].sort().join('_')
    : null;

  const loadMessages = useCallback(async (otherUserId) => {
    setLoading(true);
    try {
      const r = await chatAPI.getMessages(otherUserId);
      setMessages(r.data.data.messages);
    } catch { toast.error('Failed to load messages'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!selectedUser) return;
    loadMessages(selectedUser._id);
    if (joinRoom && roomId) joinRoom(roomId);
    return () => { if (leaveRoom && roomId) leaveRoom(roomId); };
  }, [selectedUser, roomId]);

  // Real-time message reception
  useEffect(() => {
    if (!onEvent || !roomId) return;
    const cleanup = onEvent('receive_message', (msg) => {
      if (msg.roomId === roomId) {
        setMessages((p) => [...p, msg]);
      }
    });
    return cleanup;
  }, [onEvent, roomId]);

  // Typing indicator
  useEffect(() => {
    if (!onEvent || !roomId) return;
    const c1 = onEvent('user_typing', (d) => { if (d.userId !== user._id) setTypingUser(d.userName); });
    const c2 = onEvent('user_stop_typing', () => setTypingUser(''));
    return () => { c1?.(); c2?.(); };
  }, [onEvent, roomId, user._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !selectedUser) return;
    const content = input.trim();
    setInput('');
    try {
      const r = await chatAPI.sendMessage({ content, receiverId: selectedUser._id });
      setMessages((p) => [...p, r.data.data.message]);
    } catch { toast.error('Failed to send message'); }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    if (emitTyping && roomId) {
      emitTyping(roomId);
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => emitStopTyping?.(roomId), 1500);
    }
  };

  const ROLE_COLORS = { student: 'bg-blue-100 text-blue-600', teacher: 'bg-emerald-100 text-emerald-600', admin: 'bg-purple-100 text-purple-600' };

  return (
    <div className="h-[calc(100vh-10rem)] flex bg-white rounded-2xl border border-surface-200 shadow-card overflow-hidden animate-fade-in">
      {/* Contacts sidebar */}
      <div className="w-72 flex-shrink-0 border-r border-surface-200 flex flex-col">
        <div className="px-4 py-4 border-b border-surface-100">
          <h1 className="font-display font-bold text-surface-900">Messages</h1>
          <p className="text-xs text-surface-400 mt-0.5">{chatUsers.length} contact{chatUsers.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {usersLoading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : chatUsers.length === 0 ? (
            <div className="text-center py-8 px-4">
              <ChatBubbleLeftRightIcon className="w-10 h-10 text-surface-300 mx-auto mb-2" />
              <p className="text-sm text-surface-400">No contacts available</p>
            </div>
          ) : (
            chatUsers.map((u) => (
              <button key={u._id} onClick={() => setSelectedUser(u)}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-50 transition-colors border-b border-surface-50 ${selectedUser?._id === u._id ? 'bg-primary-50' : ''}`}>
                <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <div className="text-left min-w-0">
                  <p className="text-sm font-medium text-surface-900 truncate">{u.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${ROLE_COLORS[u.role]}`}>{u.role}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Message area */}
      {!selectedUser ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <div className="w-16 h-16 bg-surface-100 rounded-2xl flex items-center justify-center mb-4">
            <ChatBubbleLeftRightIcon className="w-8 h-8 text-surface-400" />
          </div>
          <h3 className="font-display font-semibold text-surface-900 mb-1">Select a conversation</h3>
          <p className="text-sm text-surface-500">Choose a contact from the left to start messaging</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Chat header */}
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-surface-100">
            <div className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-sm">
              {selectedUser.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-sm text-surface-900">{selectedUser.name}</p>
              <p className="text-xs text-surface-400 capitalize">{selectedUser.role}</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="flex justify-center py-8"><Spinner /></div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <p className="text-sm text-surface-400">Start a conversation with {selectedUser.name}</p>
              </div>
            ) : (
              messages.map((msg, i) => {
                const isMe = (msg.senderId?._id || msg.senderId) === user._id;
                return (
                  <div key={msg._id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-sm px-4 py-2.5 rounded-2xl text-sm ${
                      isMe ? 'bg-primary-600 text-white rounded-tr-sm' : 'bg-surface-100 text-surface-900 rounded-tl-sm'
                    }`}>
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      <p className={`text-[10px] mt-1 ${isMe ? 'text-primary-200' : 'text-surface-400'}`}>
                        {format(new Date(msg.createdAt), 'h:mm a')}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            {typingUser && (
              <div className="flex justify-start">
                <div className="px-4 py-2 bg-surface-100 rounded-2xl text-xs text-surface-500 italic">
                  {typingUser} is typing...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-surface-100">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Message ${selectedUser.name}...`}
                rows={1}
                className="flex-1 px-4 py-2.5 text-sm border border-surface-200 rounded-xl bg-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none max-h-28 overflow-y-auto"
              />
              <button onClick={handleSend} disabled={!input.trim()}
                className="w-10 h-10 bg-primary-600 hover:bg-primary-700 disabled:opacity-40 rounded-xl flex items-center justify-center transition-colors flex-shrink-0">
                <PaperAirplaneIcon className="w-4 h-4 text-white" />
              </button>
            </div>
            <p className="text-[10px] text-surface-400 mt-1 text-center">Press Enter to send · Shift+Enter for new line</p>
          </div>
        </div>
      )}
    </div>
  );
}
