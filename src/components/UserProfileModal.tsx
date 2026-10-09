import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  X,
  Shield,
  Save,
  MessageSquare,
} from 'lucide-react';

interface UserProfileModalProps {
  userId?: string | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenDirectChat?: (userId: string, username: string) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  userId,
  isOpen,
  onClose,
  onOpenDirectChat,
}) => {
  const { user: currentUser, updateProfile, openVerifyModal } = useAuth();
  const [profileUser, setProfileUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const isMe = !userId || userId === currentUser?.id;
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [favoriteTeam, setFavoriteTeam] = useState('Real Madrid');
  const [avatarColor, setAvatarColor] = useState('#3B82F6');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (isMe && currentUser) {
        setProfileUser(currentUser);
        setDisplayName(currentUser.displayName);
        setBio(currentUser.bio || '');
        setFavoriteTeam(currentUser.favoriteTeam || 'Real Madrid');
        setAvatarColor(currentUser.avatarColor || '#3B82F6');
      } else if (userId) {
        setLoading(true);
        api
          .getUserProfile(userId)
          .then(res => setProfileUser(res.user))
          .catch(err => console.error(err))
          .finally(() => setLoading(false));
      }
    }
  }, [isOpen, userId, isMe, currentUser]);

  if (!isOpen) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    try {
      await updateProfile({
        displayName,
        bio,
        favoriteTeam,
        avatarColor,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  const colors = ['#3B82F6', '#2563EB', '#10B981', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-3xl border border-blue-500/30 bg-neutral-900 p-6 text-white shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-neutral-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
          </div>
        ) : profileUser ? (
          <div>
            {/* Header / Avatar */}
            <div className="flex items-center gap-4 mb-6">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-black text-white shadow-lg bg-blue-600"
                style={{ backgroundColor: (isMe ? avatarColor : profileUser.avatarColor) || '#3B82F6' }}
              >
                {(profileUser.displayName || profileUser.username).charAt(0).toUpperCase()}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-white">{profileUser.displayName}</h3>
                  {profileUser.role === 'admin' && (
                    <span className="flex items-center gap-1 rounded bg-blue-600 px-2 py-0.5 text-[10px] font-black text-white uppercase">
                      <Shield className="w-2.5 h-2.5 fill-white" />
                      Admin
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-400">@{profileUser.username}</p>
                <div className="flex items-center gap-2 text-[11px] text-neutral-500 mt-1">
                  <span>Favorite Club:</span>
                  <span className="font-bold text-blue-400">{profileUser.favoriteTeam || 'Football Fan'}</span>
                </div>
              </div>
            </div>

            {/* If viewing Self: Edit Form */}
            {isMe ? (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3.5 py-2.5 text-xs text-white focus:border-blue-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                    Analyst Bio
                  </label>
                  <textarea
                    rows={2}
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    placeholder="Describe your match analysis style or background..."
                    className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3.5 py-2.5 text-xs text-white focus:border-blue-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                    Favorite Football Club
                  </label>
                  <input
                    type="text"
                    value={favoriteTeam}
                    onChange={e => setFavoriteTeam(e.target.value)}
                    className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3.5 py-2.5 text-xs text-white focus:border-blue-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                    Avatar Theme Color
                  </label>
                  <div className="flex items-center gap-2">
                    {colors.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setAvatarColor(c)}
                        className={`h-7 w-7 rounded-xl transition-all ${
                          avatarColor === c ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-neutral-800 flex items-center justify-between">
                  {!currentUser?.isEmailVerified && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        openVerifyModal();
                      }}
                      className="text-xs font-bold text-blue-400 underline hover:text-blue-300"
                    >
                      Verify Email
                    </button>
                  )}

                  <button
                    type="submit"
                    disabled={saving}
                    className="ml-auto flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-500 transition-all disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{saving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Profile'}</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4 text-xs text-neutral-300 leading-relaxed">
                  {profileUser.bio || 'This member has not written a public bio yet.'}
                </div>

                <div className="flex items-center justify-between text-xs text-neutral-400 border-t border-neutral-800 pt-3">
                  <span>Status:</span>
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>{profileUser.isOnline ? 'Online Now' : 'Active Recently'}</span>
                  </span>
                </div>

                {onOpenDirectChat && (
                  <button
                    onClick={() => {
                      onOpenDirectChat(profileUser.id, profileUser.username);
                      onClose();
                    }}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-black text-white hover:bg-blue-500 transition-all"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Send Direct Message</span>
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-neutral-400">User profile not found.</div>
        )}
      </div>
    </div>
  );
};
