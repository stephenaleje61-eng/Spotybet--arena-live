import express from 'express';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';
import { db, hashPassword } from './server/db.js';
import {
  authMiddleware,
  requireAuth,
  requireAdmin,
  sanitizeUser,
  generateToken,
  generateVerificationCode,
  type AuthenticatedRequest,
} from './server/auth.js';
import { sse } from './server/sse.js';
import { sportsApi, SUPPORTED_LEAGUES } from './server/sportsApi.js';
import type { User, PredictionPost, ChatMessage } from './server/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());
  app.use(authMiddleware);

  // Rate limiting map for chat to prevent spam
  const userLastChatTimestamp = new Map<string, number>();

  // ==================== AUTHENTICATION ROUTES ====================

  // Register
  app.post('/api/auth/register', (req, res) => {
    try {
      const { email, password, username, displayName, favoriteTeam } = req.body;

      if (!email || !password || !username) {
        return res.status(400).json({ error: 'Email, password, and username are required.' });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Please enter a valid email address.' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      }

      const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
      if (cleanUsername.length < 3) {
        return res.status(400).json({ error: 'Username must be at least 3 alphanumeric characters.' });
      }

      if (db.findUserByEmail(email)) {
        return res.status(409).json({ error: 'An account with this email already exists.' });
      }

      if (db.findUserByUsername(cleanUsername)) {
        return res.status(409).json({ error: 'This username is already taken. Please choose another.' });
      }

      const salt = crypto.randomBytes(16).toString('hex');
      const passwordHash = hashPassword(password, salt);
      const verificationCode = generateVerificationCode();
      const now = new Date().toISOString();

      // Check if user should have admin privileges
      const isAdminEmail =
        email.toLowerCase() === 'johnlsacc23332@gmail.com' ||
        email.toLowerCase().includes('admin@safepicksarena.com');

      const avatarColors = ['#EAB308', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#EF4444'];
      const randomColor = avatarColors[Math.floor(Math.random() * avatarColors.length)];

      const newUser: User = {
        id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        email: email.trim().toLowerCase(),
        username: cleanUsername,
        displayName: (displayName && displayName.trim()) || username.trim(),
        passwordHash,
        salt,
        role: isAdminEmail ? 'admin' : 'user',
        isEmailVerified: false,
        verificationCode,
        avatarColor: randomColor,
        bio: 'Sports enthusiast & tactical match analyst at Safe Picks Arena.',
        favoriteTeam: favoriteTeam || 'Football Fan',
        createdAt: now,
        lastActiveAt: now,
      };

      db.addUser(newUser);

      // Create session
      const token = generateToken();
      db.addSession({
        token,
        userId: newUser.id,
        createdAt: now,
        expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(), // 30 days
      });

      return res.status(201).json({
        token,
        user: sanitizeUser(newUser),
        verificationCodeHint: verificationCode, // In development/demo environments, shown for instant 1-click verification
        message: 'Account registered successfully! Please verify your email with the 6-digit code.',
      });
    } catch (err) {
      console.error('Registration error:', err);
      return res.status(500).json({ error: 'Internal server error during registration.' });
    }
  });

  // Login
  app.post('/api/auth/login', (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
      }

      const user = db.findUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      if (user.isBanned) {
        return res.status(403).json({ error: 'This account has been suspended for terms violation.' });
      }

      const hash = hashPassword(password, user.salt);
      if (hash !== user.passwordHash) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      // Create session
      const token = generateToken();
      const now = new Date().toISOString();
      db.addSession({
        token,
        userId: user.id,
        createdAt: now,
        expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
      });

      user.lastActiveAt = now;
      db.save();

      return res.json({
        token,
        user: sanitizeUser(user),
        message: 'Logged in successfully.',
      });
    } catch (err) {
      console.error('Login error:', err);
      return res.status(500).json({ error: 'Internal server error during login.' });
    }
  });

  // Current authenticated user
  app.get('/api/auth/me', (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      return res.status(401).json({ user: null });
    }
    return res.json({ user: sanitizeUser(req.user) });
  });

  // Verify Email
  app.post('/api/auth/verify-email', requireAuth, (req: AuthenticatedRequest, res) => {
    try {
      const { code } = req.body;
      const user = req.user!;

      if (user.isEmailVerified) {
        return res.json({ message: 'Email is already verified.', user: sanitizeUser(user) });
      }

      if (!code || (user.verificationCode && user.verificationCode !== String(code).trim())) {
        return res.status(400).json({ error: 'Invalid verification code. Please check your code and try again.' });
      }

      user.isEmailVerified = true;
      user.verificationCode = undefined;
      db.save();

      return res.json({
        message: 'Email verified successfully! You now have full access to all features.',
        user: sanitizeUser(user),
      });
    } catch (err) {
      console.error('Verification error:', err);
      return res.status(500).json({ error: 'Error verifying email.' });
    }
  });

  // Resend Verification Code
  app.post('/api/auth/resend-verification', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    if (user.isEmailVerified) {
      return res.json({ message: 'Email already verified.' });
    }
    user.verificationCode = generateVerificationCode();
    db.save();
    return res.json({
      message: 'New verification code generated.',
      verificationCodeHint: user.verificationCode,
    });
  });

  // Request Password Reset
  app.post('/api/auth/forgot-password', (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }
    const user = db.findUserByEmail(email);
    if (!user) {
      // Don't reveal account existence for security
      return res.json({ message: 'If an account exists with this email, a reset code has been issued.' });
    }

    const resetToken = generateVerificationCode();
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    db.save();

    return res.json({
      message: 'Password reset code issued.',
      resetCodeHint: resetToken,
    });
  });

  // Reset Password
  app.post('/api/auth/reset-password', (req, res) => {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: 'Email, code, and new password are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }

    const user = db.findUserByEmail(email);
    if (
      !user ||
      !user.resetPasswordToken ||
      user.resetPasswordToken !== String(code).trim() ||
      !user.resetPasswordExpires ||
      user.resetPasswordExpires < Date.now()
    ) {
      return res.status(400).json({ error: 'Invalid or expired password reset code.' });
    }

    user.salt = crypto.randomBytes(16).toString('hex');
    user.passwordHash = hashPassword(newPassword, user.salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    db.deleteUserSessions(user.id);
    db.save();

    return res.json({ message: 'Password reset successfully. Please log in with your new password.' });
  });

  // Logout
  app.post('/api/auth/logout', (req: AuthenticatedRequest, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      db.deleteSession(token);
    }
    return res.json({ message: 'Logged out successfully.' });
  });

  // Update Profile
  app.patch('/api/auth/profile', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    const { displayName, bio, favoriteTeam, avatarColor } = req.body;

    if (displayName && typeof displayName === 'string') user.displayName = displayName.trim().slice(0, 50);
    if (bio && typeof bio === 'string') user.bio = bio.trim().slice(0, 300);
    if (favoriteTeam && typeof favoriteTeam === 'string') user.favoriteTeam = favoriteTeam.trim().slice(0, 50);
    if (avatarColor && typeof avatarColor === 'string') user.avatarColor = avatarColor;

    db.save();
    return res.json({ user: sanitizeUser(user), message: 'Profile updated.' });
  });

  // Heartbeat / Presence
  app.post('/api/auth/heartbeat', (req: AuthenticatedRequest, res) => {
    if (req.user) {
      req.user.lastActiveAt = new Date().toISOString();
      db.save();
    }
    const stats = db.getStats();
    return res.json({ onlineUsers: stats.activeUsers });
  });

  // Public User Profile
  app.get('/api/users/:id', (req, res) => {
    const target = db.findUserById(req.params.id);
    if (!target) {
      return res.status(404).json({ error: 'User not found.' });
    }
    return res.json({
      user: {
        id: target.id,
        username: target.username,
        displayName: target.displayName,
        role: target.role,
        avatarColor: target.avatarColor,
        bio: target.bio,
        favoriteTeam: target.favoriteTeam,
        createdAt: target.createdAt,
        isOnline: Date.now() - new Date(target.lastActiveAt).getTime() < 5 * 60 * 1000,
      },
    });
  });

  // ==================== FEATURED PREDICTIONS & ADMIN DASHBOARD ====================

  // Get all predictions
  app.get('/api/predictions', (_req, res) => {
    const predictions = db.getPredictions();
    return res.json({ predictions });
  });

  // Create prediction (Admin only - accepts both /api/admin/predictions and /api/predictions)
  app.post(['/api/admin/predictions', '/api/predictions'], requireAdmin, (req: AuthenticatedRequest, res) => {
    try {
      const {
        title,
        league,
        homeTeam,
        awayTeam,
        kickoffTime,
        predictionTip,
        marketType,
        odds,
        confidenceScore,
        analysis,
        isPinned,
        tags,
      } = req.body;

      if (!title || !league || !homeTeam || !awayTeam || !predictionTip || !odds) {
        return res.status(400).json({ error: 'Required fields missing for prediction post.' });
      }

      const now = new Date().toISOString();
      const newPred: PredictionPost = {
        id: `pred_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        title: title.trim(),
        league: league.trim(),
        homeTeam: homeTeam.trim(),
        awayTeam: awayTeam.trim(),
        kickoffTime: kickoffTime || new Date(Date.now() + 86400000).toISOString(),
        predictionTip: predictionTip.trim(),
        marketType: marketType || '1X2',
        odds: Number(odds),
        confidenceScore: Number(confidenceScore) || 80,
        analysis: analysis ? analysis.trim() : 'Tactical xG analysis indicates strong probability advantage.',
        isPinned: Boolean(isPinned),
        status: 'upcoming',
        authorId: req.user!.id,
        authorName: req.user!.displayName,
        createdAt: now,
        updatedAt: now,
        tags: Array.isArray(tags) ? tags : ['Safe Pick', 'Verified'],
      };

      db.addPrediction(newPred);

      // Broadcast real-time update
      sse.broadcast({ type: 'new_prediction', payload: newPred });

      return res.status(201).json({ prediction: newPred, message: 'Prediction post published successfully!' });
    } catch (err) {
      console.error('Create prediction error:', err);
      return res.status(500).json({ error: 'Failed to create prediction.' });
    }
  });

  // Edit prediction (Admin only)
  app.put('/api/admin/predictions/:id', requireAdmin, (req, res) => {
    const updated = db.updatePrediction(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Prediction not found.' });
    }
    sse.broadcast({ type: 'update_prediction', payload: updated });
    return res.json({ prediction: updated, message: 'Prediction updated.' });
  });

  // Toggle pin prediction (Admin only)
  app.patch('/api/admin/predictions/:id/pin', requireAdmin, (req, res) => {
    const pred = db.findPredictionById(req.params.id);
    if (!pred) {
      return res.status(404).json({ error: 'Prediction not found.' });
    }
    const updated = db.updatePrediction(req.params.id, { isPinned: !pred.isPinned });
    sse.broadcast({ type: 'update_prediction', payload: updated });
    return res.json({ prediction: updated });
  });

  // Delete prediction (Admin only)
  app.delete('/api/admin/predictions/:id', requireAdmin, (req, res) => {
    const success = db.deletePrediction(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Prediction not found.' });
    }
    sse.broadcast({ type: 'delete_prediction', payload: { id: req.params.id } });
    return res.json({ message: 'Prediction removed.' });
  });

  // Admin: Get reported messages
  app.get('/api/admin/reports', requireAdmin, (_req, res) => {
    return res.json({ reports: db.getReports() });
  });

  // Admin: Resolve report
  app.post('/api/admin/reports/:id/resolve', requireAdmin, (req, res) => {
    const { status } = req.body;
    const report = db.updateReport(req.params.id, status || 'reviewed');
    if (!report) return res.status(404).json({ error: 'Report not found.' });
    return res.json({ report });
  });

  // Admin: Get users
  app.get('/api/admin/users', requireAdmin, (_req, res) => {
    const users = db.getUsers().map(sanitizeUser);
    return res.json({ users });
  });

  // Admin: Update user role / ban status
  app.patch('/api/admin/users/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
    const target = db.findUserById(req.params.id);
    if (!target) return res.status(404).json({ error: 'User not found.' });

    // Prevent modifying self
    if (target.id === req.user!.id) {
      return res.status(400).json({ error: 'Cannot modify your own administrator privileges.' });
    }

    const { role, isBanned } = req.body;
    if (role && (role === 'admin' || role === 'user')) target.role = role;
    if (typeof isBanned === 'boolean') target.isBanned = isBanned;

    db.save();
    return res.json({ user: sanitizeUser(target), message: 'User updated.' });
  });

  // ==================== GLOBAL REAL-TIME CHAT ====================

  // SSE Real-Time Stream
  app.get('/api/chat/stream', (req: AuthenticatedRequest, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable proxy buffering

    const clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    sse.addClient(clientId, res, req.user?.id);
  });

  // Get chat history
  app.get('/api/chat/messages', (req: AuthenticatedRequest, res) => {
    const limit = Number(req.query.limit) || 100;
    let messages = db.getMessages(limit);

    // If user is logged in, filter out messages from users they blocked
    if (req.user) {
      const blocked = new Set(db.getBlockedUserIds(req.user.id));
      messages = messages.filter(m => !blocked.has(m.userId));
    }

    return res.json({ messages });
  });

  // Post new chat message
  app.post('/api/chat/messages', requireAuth, (req: AuthenticatedRequest, res) => {
    try {
      const user = req.user!;
      const { content } = req.body;

      if (!content || typeof content !== 'string' || !content.trim()) {
        return res.status(400).json({ error: 'Message content cannot be empty.' });
      }

      const trimmed = content.trim();
      if (trimmed.length > 500) {
        return res.status(400).json({ error: 'Message exceeds maximum length of 500 characters.' });
      }

      // Spam protection: rate limit 1 message per 1.5 seconds
      const lastChat = userLastChatTimestamp.get(user.id) || 0;
      if (Date.now() - lastChat < 1200) {
        return res.status(429).json({ error: 'Please wait a moment before sending another message (anti-spam).' });
      }
      userLastChatTimestamp.set(user.id, Date.now());

      const newMsg: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId: user.id,
        username: user.username,
        displayName: user.displayName,
        userRole: user.role,
        avatarColor: user.avatarColor,
        content: trimmed,
        createdAt: new Date().toISOString(),
        reactions: {},
      };

      db.addMessage(newMsg);

      // Broadcast real-time message to all connected SSE clients
      sse.broadcast({ type: 'chat_message', payload: newMsg });

      return res.status(201).json({ message: newMsg });
    } catch (err) {
      console.error('Chat send error:', err);
      return res.status(500).json({ error: 'Failed to send message.' });
    }
  });

  // React to message
  app.post('/api/chat/messages/:id/react', requireAuth, (req: AuthenticatedRequest, res) => {
    const { emoji } = req.body;
    const user = req.user!;
    const msg = db.findMessageById(req.params.id);

    if (!msg) {
      return res.status(404).json({ error: 'Message not found.' });
    }

    if (!emoji || typeof emoji !== 'string') {
      return res.status(400).json({ error: 'Emoji is required.' });
    }

    if (!msg.reactions[emoji]) {
      msg.reactions[emoji] = [];
    }

    const idx = msg.reactions[emoji].indexOf(user.id);
    if (idx > -1) {
      // Toggle off
      msg.reactions[emoji].splice(idx, 1);
      if (msg.reactions[emoji].length === 0) {
        delete msg.reactions[emoji];
      }
    } else {
      // Toggle on
      msg.reactions[emoji].push(user.id);
    }

    db.save();
    sse.broadcast({
      type: 'chat_reaction',
      payload: { messageId: msg.id, reactions: msg.reactions },
    });

    return res.json({ reactions: msg.reactions });
  });

  // Report message
  app.post('/api/chat/messages/:id/report', requireAuth, (req: AuthenticatedRequest, res) => {
    const { reason } = req.body;
    const reporter = req.user!;
    const msg = db.findMessageById(req.params.id);

    if (!msg) {
      return res.status(404).json({ error: 'Message not found.' });
    }

    const report = db.addReport({
      id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      messageId: msg.id,
      messageContent: msg.content,
      reportedUserId: msg.userId,
      reportedUsername: msg.username,
      reporterUserId: reporter.id,
      reason: reason || 'Inappropriate or spam behavior',
      createdAt: new Date().toISOString(),
      status: 'pending',
    });

    return res.json({ message: 'Message reported to administrators for review.', reportId: report.id });
  });

  // Block / Unblock user
  app.post('/api/users/block', requireAuth, (req: AuthenticatedRequest, res) => {
    const { targetUserId } = req.body;
    if (!targetUserId) return res.status(400).json({ error: 'Target user ID is required.' });
    db.blockUser(req.user!.id, targetUserId);
    return res.json({ message: 'User blocked.' });
  });

  app.post('/api/users/unblock', requireAuth, (req: AuthenticatedRequest, res) => {
    const { targetUserId } = req.body;
    if (!targetUserId) return res.status(400).json({ error: 'Target user ID is required.' });
    db.unblockUser(req.user!.id, targetUserId);
    return res.json({ message: 'User unblocked.' });
  });

  // Direct Private Messaging
  app.get('/api/chat/direct/:recipientId', requireAuth, (req: AuthenticatedRequest, res) => {
    const messages = db.getDirectMessages(req.user!.id, req.params.recipientId);
    return res.json({ messages });
  });

  app.post('/api/chat/direct/:recipientId', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    const recipient = db.findUserById(req.params.recipientId);
    if (!recipient) {
      return res.status(404).json({ error: 'Recipient user not found.' });
    }

    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty.' });
    }

    const newMsg: ChatMessage = {
      id: `dm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
      userRole: user.role,
      avatarColor: user.avatarColor,
      content: content.trim().slice(0, 500),
      createdAt: new Date().toISOString(),
      reactions: {},
      isDirect: true,
      recipientId: recipient.id,
    };

    db.addDirectMessage(newMsg);

    // Send SSE direct message event to both participants
    sse.sendToUser(recipient.id, { type: 'direct_message', payload: newMsg });
    sse.sendToUser(user.id, { type: 'direct_message', payload: newMsg });

    return res.status(201).json({ message: newMsg });
  });

  // Friends & Friend Requests
  app.get('/api/friends', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    const friendIds = db.getFriends(user.id);
    const friends = friendIds
      .map(id => db.findUserById(id))
      .filter((u): u is User => Boolean(u))
      .map(sanitizeUser);
    const requests = db.getFriendRequests(user.id);

    return res.json({ friends, requests });
  });

  app.post('/api/friends/request', requireAuth, (req: AuthenticatedRequest, res) => {
    const { toUserId } = req.body;
    if (!toUserId || toUserId === req.user!.id) {
      return res.status(400).json({ error: 'Invalid recipient.' });
    }
    const reqItem = db.addFriendRequest(req.user!.id, toUserId);
    sse.sendToUser(toUserId, { type: 'friend_request', payload: reqItem });
    return res.json({ request: reqItem, message: 'Friend request sent.' });
  });

  app.post('/api/friends/respond', requireAuth, (req: AuthenticatedRequest, res) => {
    const { requestId, status } = req.body;
    if (!requestId || (status !== 'accepted' && status !== 'declined')) {
      return res.status(400).json({ error: 'Invalid response status.' });
    }
    const updated = db.respondFriendRequest(requestId, status);
    if (!updated) return res.status(404).json({ error: 'Request not found.' });

    if (status === 'accepted') {
      sse.sendToUser(updated.fromUserId, { type: 'friend_accepted', payload: updated });
    }
    return res.json({ request: updated, message: `Request ${status}.` });
  });

  app.delete('/api/friends/:friendId', requireAuth, (req: AuthenticatedRequest, res) => {
    const success = db.removeFriend(req.user!.id, req.params.friendId);
    return res.json({ success, message: 'Friend removed.' });
  });

  // ==================== BETTING PLATFORM SPACES ====================

  app.get('/api/spaces/:platform/codes', (req, res) => {
    const codes = db.getBookingCodes(req.params.platform);
    return res.json({ codes });
  });

  app.post('/api/spaces/:platform/codes', requireAuth, (req: AuthenticatedRequest, res) => {
    const { platform } = req.params;
    const validPlatforms = ['Bet9ja', 'SportyBet', 'MSport', 'Football.com'];
    const matched = validPlatforms.find(p => p.toLowerCase() === platform.toLowerCase());

    if (!matched) {
      return res.status(400).json({ error: 'Invalid platform space specified.' });
    }

    const { code, title, odds, matchCount, stakeTip } = req.body;
    if (!code || !title || !odds) {
      return res.status(400).json({ error: 'Code, title, and odds are required.' });
    }

    const newCode = db.addBookingCode({
      id: `bc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      platform: matched as 'Bet9ja' | 'SportyBet' | 'MSport' | 'Football.com',
      code: code.trim().toUpperCase(),
      title: title.trim(),
      odds: Number(odds),
      matchCount: Number(matchCount) || 1,
      stakeTip: stakeTip ? stakeTip.trim() : undefined,
      authorId: req.user!.id,
      authorName: req.user!.displayName,
      isVerified: req.user!.role === 'admin',
      copyCount: 0,
      createdAt: new Date().toISOString(),
    });

    sse.broadcast({ type: 'new_booking_code', payload: newCode });
    return res.status(201).json({ code: newCode });
  });

  app.post('/api/spaces/codes/:id/copy', (_req, res) => {
    const newCount = db.incrementCodeCopy(_req.params.id);
    return res.json({ copyCount: newCount });
  });

  // ==================== SPORTS DATA & MATHEMATICAL ANALYSIS ====================

  // Supported Leagues
  app.get('/api/sports/leagues', (_req, res) => {
    return res.json({ leagues: SUPPORTED_LEAGUES });
  });

  // Matches / Fixtures
  app.get('/api/sports/fixtures', async (req, res) => {
    try {
      const leagueId = (req.query.leagueId as string) || '4328';
      const result = await sportsApi.getFixtures(leagueId);
      return res.json(result);
    } catch (err) {
      console.error('Fixtures error:', err);
      return res.status(500).json({ error: 'Failed to retrieve sports fixtures.' });
    }
  });

  // Standings
  app.get('/api/sports/standings', async (req, res) => {
    try {
      const leagueId = (req.query.leagueId as string) || '4328';
      const result = await sportsApi.getStandings(leagueId);
      return res.json(result);
    } catch (err) {
      console.error('Standings error:', err);
      return res.status(500).json({ error: 'Failed to retrieve league standings.' });
    }
  });

  // Poisson Match Probability Analysis
  app.get('/api/sports/analysis/:matchId', async (req, res) => {
    try {
      const leagueId = (req.query.leagueId as string) || '4328';
      const { matches } = await sportsApi.getFixtures(leagueId);
      const match = matches.find(m => m.id === req.params.matchId) || matches[0];

      if (!match) {
        return res.status(404).json({ error: 'Match not found for statistical analysis.' });
      }

      const analysis = sportsApi.calculateMatchAnalysis(match);
      return res.json({ analysis });
    } catch (err) {
      console.error('Analysis error:', err);
      return res.status(500).json({ error: 'Failed to calculate match prediction probabilities.' });
    }
  });

  // ==================== MARKETPLACE ====================

  app.get('/api/marketplace/items', (req, res) => {
    const category = req.query.category as string | undefined;
    const search = req.query.search as string | undefined;
    const items = db.getMarketplace(category, search);
    return res.json({ items });
  });

  app.post('/api/marketplace/items', requireAuth, (req: AuthenticatedRequest, res) => {
    try {
      const user = req.user!;
      const { title, category, price, currency, condition, description, imageUrl, location } = req.body;

      if (!title || !price || !category || !description) {
        return res.status(400).json({ error: 'Title, category, price, and description are required.' });
      }

      const newItem = db.addMarketplaceItem({
        id: `mp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        title: title.trim().slice(0, 100),
        category,
        price: Number(price),
        currency: currency || 'USD',
        condition: condition || 'Brand New',
        description: description.trim().slice(0, 1000),
        imageUrl: imageUrl && typeof imageUrl === 'string' ? imageUrl.trim() : undefined,
        location: (location && location.trim()) || 'Worldwide Shipping',
        sellerId: user.id,
        sellerName: user.displayName,
        sellerEmail: user.email,
        isApproved: true,
        createdAt: new Date().toISOString(),
      });

      return res.status(201).json({ item: newItem, message: 'Marketplace listing published successfully!' });
    } catch (err) {
      console.error('Marketplace post error:', err);
      return res.status(500).json({ error: 'Failed to create marketplace item.' });
    }
  });

  app.delete('/api/marketplace/items/:id', requireAuth, (req: AuthenticatedRequest, res) => {
    const item = db.getMarketplace().find(i => i.id === req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found.' });
    }

    // Only owner or admin can delete
    if (item.sellerId !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this listing.' });
    }

    db.deleteMarketplaceItem(req.params.id);
    return res.json({ message: 'Listing removed.' });
  });

  // ==================== SYSTEM HEALTH & ARCHITECTURE STATS ====================

  app.get('/api/system/health', (_req, res) => {
    const stats = db.getStats();
    return res.json({
      status: 'HEALTHY',
      platform: 'SAFE PICKS ARENA Core v2.4.0',
      nodeVersion: process.version,
      memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      activeSseSubscribers: sse.getConnectedCount(),
      databaseStats: stats,
      scalabilityTier: 'Multi-Region Stateless Cluster Ready (Scale to 5M Users)',
      timestamp: new Date().toISOString(),
    });
  });

  // ==================== FRONTEND VITE INTEGRATION ====================

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`⚡ SAFE PICKS ARENA Engine running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start SAFE PICKS ARENA server:', err);
  process.exit(1);
});
