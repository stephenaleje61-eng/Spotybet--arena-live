import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { ChatMessage, User, FriendRequest } from '../types';
import {
  MessageSquare,
  Send,
  Shield,
  Flag,
  UserX,
  UserPlus,
  Lock,
  Globe,
  MoreVertical,
  X,
  AlertCircle,
} from 'lucide-react';

interface GlobalChatArenaProps {
  onOpenUserProfile?: (userId: string) => void;
}

export const GlobalChatArena: React.FC<GlobalChatArenaProps> = ({ onOpenUserProfile }) => {
  const { user, openAuthModal } = useAuth();
  const [activeChatTab, setActiveChatTab] = useState<'public' | 'direct' | 'friends'>('public');

  // Messages & Public chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputContent, setInputContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [spamNotice, setSpamNotice] = useState<string | null>(null);

  // Direct messaging state
  const [activeDmUser, setActiveDmUser] = useState<User | null>(null);
  const [dmConversations, setDmConversations] = useState<ChatMessage[]>([]);
  const [dmInput, setDmInput] = useState('');

  // Friends state
  const [friends, setFriends] = useState<User[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [friendUsernameInput, setFriendUsernameInput] = useState('');
  const [friendActionMsg, setFriendActionMsg] = useState<string | null>(null);

  // Report modal
  const [reportModalMessage, setReportModalMessage] = useState<ChatMessage | null>(null);
  const [reportReason, setReportReason] = useState('Inappropriate or spam behavior');

  // Active message menu dropdown
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const fetchChat = async () => {
      try {
        const res = await api.getMessages(100);
        setMessages(res.messages);
      } catch (err) {
        console.error('Error fetching chat messages:', err);
      }
    };

    fetchChat();

    // Listen to real-time events via Server-Sent Events (SSE)
    const es = new EventSource('/api/chat/stream');
    es.onmessage = event => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'chat_message') {
          const newMsg = data.payload as ChatMessage;
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        } else if (data.type === 'chat_reaction') {
          const { messageId, reactions } = data.payload;
          setMessages(prev =>
            prev.map(m => (m.id === messageId ? { ...m, reactions } : m))
          );
        } else if (data.type === 'direct_message') {
          const dm = data.payload as ChatMessage;
          setDmConversations(prev => [...prev, dm]);
        } else if (data.type === 'friend_request' || data.type === 'friend_accepted') {
          fetchFriends();
        }
      } catch {
        // silent
      }
    };

    return () => {
      es.close();
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, dmConversations]);

  const fetchFriends = async () => {
    if (!user) return;
    try {
      const res = await api.getFriends();
      setFriends(res.friends);
      setFriendRequests(res.requests);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    if (user) {
      fetchFriends();
    }
  }, [user, activeChatTab]);

  useEffect(() => {
    if (activeDmUser && user) {
      const loadDm = async () => {
        try {
          const res = await api.getDirectMessages(activeDmUser.id);
          setDmConversations(res.messages);
        } catch (err) {
          console.error('Error loading DM:', err);
        }
      };
      loadDm();
    }
  }, [activeDmUser, user]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal('login');
      return;
    }

    if (!inputContent.trim()) return;

    setIsSending(true);
    setSpamNotice(null);
    try {
      await api.sendMessage(inputContent);
      setInputContent('');
    } catch (err: unknown) {
      setSpamNotice(err instanceof Error ? err.message : 'Failed to send message.');
    } finally {
      setIsSending(false);
    }
  };

  const handleSendDm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeDmUser || !dmInput.trim()) return;
    try {
      await api.sendDirectMessage(activeDmUser.id, dmInput);
      setDmInput('');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to send DM');
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    try {
      await api.reactToMessage(messageId, emoji);
    } catch (err) {
      console.error('Reaction error:', err);
    }
  };

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportModalMessage) return;
    try {
      await api.reportMessage(reportModalMessage.id, reportReason);
      alert('Message reported to moderators for review.');
      setReportModalMessage(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error reporting message');
    }
  };

  const handleBlockUser = async (targetUserId: string) => {
    if (!user) return;
    try {
      await api.blockUser(targetUserId);
      setBlockedUsers(prev => [...prev, targetUserId]);
      setMessages(prev => prev.filter(m => m.userId !== targetUserId));
      setActiveMenuId(null);
      alert('User has been blocked. Their messages are now hidden.');
    } catch (err) {
      console.error('Block error:', err);
    }
  };

  const handleRespondFriend = async (requestId: string, status: 'accepted' | 'declined') => {
    try {
      await api.respondFriendRequest(requestId, status);
      fetchFriends();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error responding to friend request');
    }
  };

  const openDmWithUser = (target: { id: string; username: string; displayName: string }) => {
    setActiveDmUser({
      id: target.id,
      username: target.username,
      displayName: target.displayName,
      email: '',
      role: 'user',
      isEmailVerified: true,
      avatarColor: '#3B82F6',
      createdAt: '',
      lastActiveAt: '',
    });
    setActiveChatTab('direct');
    setActiveMenuId(null);
  };

  const emojis = ['⚽', '🔥', '👏', '🎯'];

  return (
    <div className="rounded-3xl border border-neutral-800 bg-neutral-900/90 shadow-2xl backdrop-blur-sm overflow-hidden flex flex-col h-[750px]">
      {/* Chat Navigation Header */}
      <div className="border-b border-neutral-800 bg-neutral-950 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white font-black shadow-md shadow-blue-500/25">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white">GLOBAL CHAT ARENA</h2>
              <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Live Worldwide</span>
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Real-time tactical discussions, odds insights, and verified community analyst network.
            </p>
          </div>
        </div>

        {/* View Switchers */}
        <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-xl border border-neutral-800">
          <button
            onClick={() => setActiveChatTab('public')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              activeChatTab === 'public'
                ? 'bg-blue-600 text-white shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Public Arena</span>
          </button>

          <button
            onClick={() => {
              if (!user) openAuthModal('login');
              else setActiveChatTab('direct');
            }}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              activeChatTab === 'direct'
                ? 'bg-blue-600 text-white shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Direct DMs</span>
          </button>

          <button
            onClick={() => {
              if (!user) openAuthModal('login');
              else setActiveChatTab('friends');
            }}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all relative ${
              activeChatTab === 'friends'
                ? 'bg-blue-600 text-white shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Friends</span>
            {friendRequests.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[10px] font-black text-white">
                {friendRequests.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* VIEW 1: PUBLIC CHAT */}
      {activeChatTab === 'public' && (
        <div className="flex-1 flex flex-col justify-between overflow-hidden">
          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-neutral-500">
                Connecting to global real-time stream...
              </div>
            ) : (
              messages.map(msg => {
                const isMe = user?.id === msg.userId;
                const isAdmin = msg.userRole === 'admin';

                return (
                  <div
                    key={msg.id}
                    className={`group relative flex items-start gap-3 rounded-2xl p-3 transition-colors ${
                      isMe ? 'bg-blue-500/5 border border-blue-500/10' : 'hover:bg-neutral-800/40'
                    }`}
                  >
                    {/* User Avatar */}
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black text-white shadow-sm"
                      style={{ backgroundColor: msg.avatarColor || '#3B82F6' }}
                    >
                      {msg.displayName.charAt(0).toUpperCase()}
                    </div>

                    {/* Content Body */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onOpenUserProfile && onOpenUserProfile(msg.userId)}
                            className="text-xs font-black text-white hover:text-blue-400 transition-colors truncate"
                          >
                            {msg.displayName}
                          </button>
                          <span className="text-[11px] text-neutral-500 truncate">@{msg.username}</span>

                          {isAdmin && (
                            <span className="flex items-center gap-1 rounded bg-blue-600 px-1.5 py-0.2 text-[9px] font-black text-white uppercase tracking-wider">
                              <Shield className="w-2.5 h-2.5 fill-white" />
                              Admin
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-neutral-500">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>

                          {/* Message Actions Dropdown */}
                          <div className="relative">
                            <button
                              onClick={() => setActiveMenuId(activeMenuId === msg.id ? null : msg.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-white transition-opacity"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>

                            {activeMenuId === msg.id && (
                              <div className="absolute right-0 top-6 z-20 w-44 rounded-xl border border-neutral-800 bg-neutral-900 p-1.5 shadow-xl text-xs">
                                {!isMe && (
                                  <>
                                    <button
                                      onClick={() => openDmWithUser(msg)}
                                      className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-neutral-300 hover:bg-neutral-800 hover:text-white"
                                    >
                                      <Lock className="w-3.5 h-3.5" />
                                      <span>Send Private DM</span>
                                    </button>

                                    <button
                                      onClick={() => {
                                        setReportModalMessage(msg);
                                        setActiveMenuId(null);
                                      }}
                                      className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-blue-400 hover:bg-neutral-800"
                                    >
                                      <Flag className="w-3.5 h-3.5" />
                                      <span>Report Message</span>
                                    </button>

                                    <button
                                      onClick={() => handleBlockUser(msg.userId)}
                                      className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-red-400 hover:bg-red-500/10"
                                    >
                                      <UserX className="w-3.5 h-3.5" />
                                      <span>Block @{msg.username}</span>
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Message text */}
                      <p className="mt-1 text-xs text-neutral-200 leading-relaxed break-words">
                        {msg.content}
                      </p>

                      {/* Emoji Reactions Row */}
                      <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                        {emojis.map(emoji => {
                          const userList = msg.reactions?.[emoji] || [];
                          const hasReacted = user ? userList.includes(user.id) : false;
                          const count = userList.length;

                          return (
                            <button
                              key={emoji}
                              onClick={() => handleReaction(msg.id, emoji)}
                              className={`flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs transition-all ${
                                hasReacted
                                  ? 'bg-blue-500/20 border border-blue-500/50 text-blue-300 font-bold'
                                  : count > 0
                                  ? 'bg-neutral-800 text-neutral-300 border border-neutral-700'
                                  : 'opacity-0 group-hover:opacity-60 hover:opacity-100 bg-neutral-800/50 text-neutral-400'
                              }`}
                            >
                              <span>{emoji}</span>
                              {count > 0 && <span className="text-[10px]">{count}</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <div className="border-t border-neutral-800 bg-neutral-950 p-4">
            {spamNotice && (
              <div className="mb-2 text-xs text-blue-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{spamNotice}</span>
              </div>
            )}

            {user ? (
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    maxLength={500}
                    value={inputContent}
                    onChange={e => setInputContent(e.target.value)}
                    placeholder="Share match analysis, ask about odds, or discuss sports..."
                    className="w-full rounded-2xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-xs text-white placeholder-neutral-500 focus:border-blue-400 focus:outline-none"
                  />
                  <div className="absolute right-3 top-3 text-[10px] text-neutral-500 font-mono">
                    {500 - inputContent.length}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSending || !inputContent.trim()}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white font-black hover:bg-blue-500 transition-all disabled:opacity-40"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-3 text-center">
                <p className="text-xs text-neutral-400">
                  Please <button onClick={() => openAuthModal('login')} className="text-blue-400 font-bold underline">log in</button> or <button onClick={() => openAuthModal('register')} className="text-blue-400 font-bold underline">register free</button> to participate in the worldwide arena chat.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: DIRECT PRIVATE MESSAGES */}
      {activeChatTab === 'direct' && (
        <div className="flex-1 flex overflow-hidden">
          <div className="w-64 border-r border-neutral-800 bg-neutral-950 p-3 space-y-2 overflow-y-auto">
            <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
              Private Conversations
            </div>

            {friends.length === 0 ? (
              <p className="text-xs text-neutral-500 p-2">
                Add friends to start end-to-end direct conversations.
              </p>
            ) : (
              friends.map(f => (
                <button
                  key={f.id}
                  onClick={() => setActiveDmUser(f)}
                  className={`w-full flex items-center gap-2.5 rounded-xl p-2 text-left transition-all ${
                    activeDmUser?.id === f.id
                      ? 'bg-blue-600 text-white font-bold'
                      : 'hover:bg-neutral-900 text-neutral-300'
                  }`}
                >
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white bg-blue-600"
                  >
                    {f.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="truncate text-xs">
                    <div>{f.displayName}</div>
                    <div className="text-[10px] opacity-75">@{f.username}</div>
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="flex-1 flex flex-col justify-between">
            {activeDmUser ? (
              <>
                <div className="border-b border-neutral-800 bg-neutral-900 p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold text-white bg-blue-600"
                    >
                      {activeDmUser.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{activeDmUser.displayName}</div>
                      <div className="text-[10px] text-neutral-400">@{activeDmUser.username}</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Encrypted Direct Chat
                  </span>
                </div>

                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                  {dmConversations.length === 0 ? (
                    <div className="text-center text-xs text-neutral-500 py-12">
                      No direct messages yet. Say hello to @{activeDmUser.username}!
                    </div>
                  ) : (
                    dmConversations.map(dm => {
                      const isMe = dm.userId === user?.id;
                      return (
                        <div
                          key={dm.id}
                          className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs rounded-2xl px-3.5 py-2 text-xs ${
                              isMe
                                ? 'bg-blue-600 text-white font-medium'
                                : 'bg-neutral-800 text-white'
                            }`}
                          >
                            <p>{dm.content}</p>
                            <div
                              className={`text-[9px] mt-1 text-right ${
                                isMe ? 'text-blue-200' : 'text-neutral-400'
                              }`}
                            >
                              {new Date(dm.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <form onSubmit={handleSendDm} className="border-t border-neutral-800 p-3 flex gap-2 bg-neutral-950">
                  <input
                    type="text"
                    value={dmInput}
                    onChange={e => setDmInput(e.target.value)}
                    placeholder={`Message ${activeDmUser.displayName}...`}
                    className="flex-1 rounded-xl border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs text-white focus:border-blue-400 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-blue-600 px-4 py-2 font-black text-white text-xs hover:bg-blue-500"
                  >
                    Send
                  </button>
                </form>
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-neutral-500">
                Select a friend from the left sidebar to open a private 1-on-1 direct conversation.
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 3: FRIENDS & REQUESTS */}
      {activeChatTab === 'friends' && (
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-3">
              Pending Incoming Friend Requests ({friendRequests.length})
            </h3>
            {friendRequests.length === 0 ? (
              <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4 text-xs text-neutral-500">
                No pending friend requests.
              </div>
            ) : (
              <div className="space-y-2">
                {friendRequests.map(req => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between rounded-2xl border border-neutral-800 bg-neutral-950 p-3"
                  >
                    <span className="text-xs text-neutral-300">
                      User requested connection with you
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRespondFriend(req.id, 'accepted')}
                        className="rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-500"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleRespondFriend(req.id, 'declined')}
                        className="rounded-xl border border-neutral-700 px-3 py-1.5 text-xs font-bold text-neutral-400 hover:text-white"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">
              Your Friends ({friends.length})
            </h3>
            {friends.length === 0 ? (
              <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4 text-xs text-neutral-500">
                You haven't added any friends yet. Connect with fellow match analysts in the public arena!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {friends.map(f => (
                  <div
                    key={f.id}
                    className="flex items-center justify-between rounded-2xl border border-neutral-800 bg-neutral-950 p-3"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold text-white bg-blue-600"
                      >
                        {f.displayName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">{f.displayName}</div>
                        <div className="text-[10px] text-neutral-400">@{f.username}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => openDmWithUser(f)}
                      className="rounded-xl bg-neutral-800 px-3 py-1.5 text-xs font-bold text-blue-400 hover:bg-blue-600 hover:text-white transition-all"
                    >
                      Message
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* REPORT MODAL */}
      {reportModalMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-2xl border border-blue-500/30 bg-neutral-900 p-6 text-white shadow-2xl">
            <button
              onClick={() => setReportModalMessage(null)}
              className="absolute right-4 top-4 text-neutral-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-white mb-1">Report Message to Moderators</h3>
            <p className="text-xs text-neutral-400 mb-4">
              Help maintain a constructive and respectful sports analysis arena.
            </p>

            <div className="rounded-xl bg-neutral-950 border border-neutral-800 p-3 mb-4 text-xs text-neutral-300 italic">
              "{reportModalMessage.content}"
            </div>

            <form onSubmit={handleReport} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                  Reason for Report
                </label>
                <select
                  value={reportReason}
                  onChange={e => setReportReason(e.target.value)}
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-blue-400 focus:outline-none"
                >
                  <option value="Inappropriate or spam behavior">Spam / Excessive Advertising</option>
                  <option value="Hate speech or harassment">Harassment / Insults</option>
                  <option value="False odds / Misinformation">Misinformation / False Claim</option>
                  <option value="Other terms violation">Other Terms Violation</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-blue-600 py-2.5 font-bold text-white text-xs hover:bg-blue-500 transition-all"
              >
                Submit Report to Admins
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
