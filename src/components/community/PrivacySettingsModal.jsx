import React, { useState, useEffect } from 'react';
import { X, Shield, Lock, Eye, EyeOff, MapPin, MessageSquare, Check, UserCheck } from 'lucide-react';
import ElderButton from '../common/ElderButton';
import { communityService } from '../../services/communityService';
import { playMatchSuccessSound } from '../../audio/synthAudio';

export default function PrivacySettingsModal({ isOpen, onClose, currentUser, onProfileUpdated }) {
  const [profile, setProfile] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [broadLocation, setBroadLocation] = useState('Assam / North East');
  const [visibility, setVisibility] = useState('public');
  const [localDiscovery, setLocalDiscovery] = useState(true);
  const [showLocation, setShowLocation] = useState(true);
  const [allowMessages, setAllowMessages] = useState('everyone');
  const [showOnline, setShowOnline] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const userId = currentUser?.id ? `user-${currentUser.id}` : (currentUser?.user_id || 'user-guest');

  useEffect(() => {
    if (isOpen) {
      communityService.getProfile(userId).then((p) => {
        setProfile(p);
        setDisplayName(p.display_name || currentUser?.name || 'Community Member');
        setBio(p.bio || '');
        setBroadLocation(p.broad_location || 'Assam / North East');
        setVisibility(p.visibility || 'public');
        setLocalDiscovery(p.local_discovery_enabled !== false);
        setShowLocation(p.show_broad_location !== false);
        setAllowMessages(p.allow_messages_from || 'everyone');
        setShowOnline(p.show_online_status !== false);
      });
    }
  }, [isOpen, userId]);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    const updated = await communityService.updateProfile({
      user_id: userId,
      display_name: displayName,
      role_badge: currentUser?.role === 'patient' ? 'Patient' : currentUser?.role === 'healthcare' ? 'Healthcare Professional' : 'Caregiver',
      avatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=256',
      bio,
      broad_location: broadLocation,
      visibility,
      local_discovery_enabled: localDiscovery,
      show_broad_location: showLocation,
      allow_messages_from: allowMessages,
      show_online_status: showOnline
    });

    playMatchSuccessSound();
    setSavedSuccess(true);
    if (onProfileUpdated) onProfileUpdated(updated);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const broadLocations = [
    'Assam / North East',
    'Delhi NCR',
    'Mumbai / Maharashtra',
    'Central India',
    'Bengaluru / Karnataka',
    'Kolkata / Eastern India',
    'United Kingdom',
    'California / USA',
    'International / Other'
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#131D33] rounded-3xl md:rounded-4xl max-w-xl w-full p-6 md:p-8 shadow-2xl border border-slate-200 dark:border-[#243352] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#243352]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-teal-100 dark:bg-teal-950/60 flex items-center justify-center text-teal-700 dark:text-teal-300">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white">
                Community Profile & Privacy
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Simple controls for your safety and comfort
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-[#1E293B] transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto py-5 space-y-4">
          {/* Display Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              Community Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-[#2E4166] bg-white dark:bg-[#162238] text-slate-900 dark:text-white text-sm font-semibold"
              required
            />
          </div>

          {/* Short Bio */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              A Short Welcoming Note (Optional)
            </label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="e.g. Caring for my grandmother; love sharing daily morning garden routines."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-[#2E4166] bg-white dark:bg-[#162238] text-slate-900 dark:text-white text-sm font-medium"
            />
          </div>

          {/* Broad Location (Approximate only!) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              Broad Region (No exact address is ever asked or shown)
            </label>
            <select
              value={broadLocation}
              onChange={(e) => setBroadLocation(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-[#2E4166] text-sm font-semibold bg-white dark:bg-[#162238] text-slate-900 dark:text-white"
            >
              {broadLocations.map((loc) => (
                <option key={loc} value={loc}>
                  📍 {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Privacy Toggles */}
          <div className="pt-2 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Safety & Discovery Toggles
            </h3>

            {/* Local Discovery */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-[#243352]">
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-white">Participate in Local Discovery</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Allow peers in {broadLocation} to find and connect with you.</p>
              </div>
              <button
                type="button"
                onClick={() => setLocalDiscovery(!localDiscovery)}
                className={`w-14 h-8 rounded-full transition-colors relative ${
                  localDiscovery ? 'bg-smriti-teal-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-full bg-white shadow-md absolute top-1 transition-transform ${
                    localDiscovery ? 'right-1' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* Show Location on Posts */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-[#243352]">
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-white">Show Approximate Region on Posts</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Display your broad region badge (e.g. 📍 Assam / North East).</p>
              </div>
              <button
                type="button"
                onClick={() => setShowLocation(!showLocation)}
                className={`w-14 h-8 rounded-full transition-colors relative ${
                  showLocation ? 'bg-smriti-teal-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-full bg-white shadow-md absolute top-1 transition-transform ${
                    showLocation ? 'right-1' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* Direct Messages Permissions */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-[#243352]">
              <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-2">Allow 1-to-1 Private Messages from:</h4>
              <div className="grid grid-cols-3 gap-2 text-xs font-bold">
                {[
                  { id: 'everyone', label: 'Everyone' },
                  { id: 'connections_only', label: 'Connections Only' },
                  { id: 'nobody', label: 'Nobody' }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setAllowMessages(opt.id)}
                    className={`p-2 rounded-xl border text-center transition-all ${
                      allowMessages === opt.id
                        ? 'bg-smriti-teal-600 text-white border-smriti-teal-700'
                        : 'bg-white dark:bg-[#162238] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-[#243352] hover:bg-slate-100 dark:hover:bg-[#25334D]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Online Status Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-[#243352]">
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-white">Show Online Indicator (🟢)</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Let other caregivers see when you are currently online.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowOnline(!showOnline)}
                className={`w-14 h-8 rounded-full transition-colors relative ${
                  showOnline ? 'bg-smriti-teal-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-full bg-white shadow-md absolute top-1 transition-transform ${
                    showOnline ? 'right-1' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Footer Save */}
          <div className="pt-4 flex items-center justify-between border-t border-slate-100 dark:border-[#243352]">
            {savedSuccess ? (
              <span className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700">
                <Check className="w-5 h-5 text-emerald-600" />
                Settings updated safely!
              </span>
            ) : <span />}

            <ElderButton
              type="submit"
              variant="primary"
              size="md"
              icon={Check}
            >
              Save Privacy Settings
            </ElderButton>
          </div>
        </form>
      </div>
    </div>
  );
}
