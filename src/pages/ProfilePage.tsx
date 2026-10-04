import React, { useState } from 'react';
import { Edit2, Mail } from 'lucide-react';
import { UserProfile } from '../types/user';
import { INITIAL_CHALLENGES } from '../data/mockChallenges';
import { soundService } from '../services/sound';
import { computeCurriculumMastery } from '../utils/curriculum';

interface ProfilePageProps {
  user: UserProfile;
  onUpdateUsername: (name: string, callsign: string) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  user,
  onUpdateUsername,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user.name || user.username);
  const [editCallsign, setEditCallsign] = useState(user.callsign);
  const curriculumMastery = user.curriculumMastery || computeCurriculumMastery(user);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    soundService.playSuccess();
    onUpdateUsername(editName, editCallsign);
    setIsEditing(false);
  };

  const displayName = (!user.name || user.name === 'Alex Morgan' || user.username === 'Alex Morgan')
    ? (user.role === 'ADMIN' ? (user.name || 'Pardhiv') : 'User / Learner')
    : user.name || user.username || 'User / Learner';
  const displayEmail = user.email && user.email !== 'alex@prestige.edu'
    ? user.email
    : (user.role === 'ADMIN' ? 'itzpardhiv@gmail.com' : 'learner@prestige.local');
  const initials = displayName
    .split(' ')
    .filter((w) => w !== '/')
    .map((w) => w.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2) || (user.role === 'ADMIN' ? 'PA' : 'UL');

  return (
    <div className="max-w-4xl mx-auto space-y-8 font-sans py-4">
      {/* Profile Overview Card */}
      <div className="surface-card p-6 sm:p-8 space-y-6 rounded-xl border border-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-border-subtle">
          <div className="flex items-center gap-4">
            {/* Circular Avatar with graceful fallback */}
            <div className="w-16 h-16 rounded-full overflow-hidden bg-brand-500 text-white flex items-center justify-center text-xl font-medium shrink-0 ring-2 ring-border shadow-sm">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={displayName}
                  className="w-full h-full object-cover rounded-full"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <span>{initials}</span>
              )}
            </div>

            <div className="space-y-1">
              {isEditing ? (
                <form onSubmit={handleSave} className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="bg-surface-secondary border border-border px-2.5 py-1 text-xs text-content-primary rounded focus:outline-none focus:border-brand-500"
                      placeholder="Learner Name"
                      required
                    />
                    <input
                      type="text"
                      value={editCallsign}
                      onChange={(e) => setEditCallsign(e.target.value.toUpperCase())}
                      className="bg-surface-secondary border border-border px-2.5 py-1 text-xs text-content-primary rounded font-technical uppercase focus:outline-none focus:border-brand-500"
                      placeholder="Learner Handle"
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="px-2.5 py-1 bg-brand-500 text-white font-medium text-xs rounded hover:bg-brand-600 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-2 py-1 text-xs text-content-secondary hover:text-content-primary"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold text-content-primary">
                      {displayName}
                    </h2>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-content-tertiary hover:text-content-primary p-1 rounded hover:bg-surface-secondary transition-colors"
                      title="Edit Learner Profile"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-content-secondary">
                    <span className="font-technical text-content-secondary">{user.callsign}</span>
                    <span className="text-content-tertiary">·</span>
                    <span className="text-content-tertiary flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {displayEmail}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Account Status Badge */}
          <div className="w-full sm:w-auto flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-secondary/60 border border-border-subtle text-xs text-content-secondary">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-mono text-content-primary">Local Workspace Active</span>
          </div>
        </div>

        {/* Four Key Learning Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3 rounded-lg bg-surface-secondary/40 border border-border-subtle">
            <span className="text-content-tertiary block mb-1">Ciphers solved</span>
            <span className="text-xl font-semibold text-content-primary font-technical">{user.stats.codesDecoded}</span>
          </div>
          <div className="p-3 rounded-lg bg-surface-secondary/40 border border-border-subtle">
            <span className="text-content-tertiary block mb-1">Analysis accuracy</span>
            <span className="text-xl font-semibold text-content-primary font-technical">{user.stats.accuracy}%</span>
          </div>
          <div className="p-3 rounded-lg bg-surface-secondary/40 border border-border-subtle">
            <span className="text-content-tertiary block mb-1">Average solve time</span>
            <span className="text-xl font-semibold text-content-primary font-technical">
              {user.stats.fastestSolveSeconds > 0 ? `${user.stats.fastestSolveSeconds}s` : '2m 15s'}
            </span>
          </div>
          <div className="p-3 rounded-lg bg-surface-secondary/40 border border-border-subtle">
            <span className="text-content-tertiary block mb-1">Cipher specialty</span>
            <span className="text-sm font-semibold text-brand-600 dark:text-brand-400">Classical Rotational</span>
          </div>
        </div>
      </div>

      {/* Cipher Competency Curriculum Progress */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold text-content-secondary uppercase tracking-wider">
          Cipher Curriculum Mastery
        </h3>

        <div className="surface-card p-5 space-y-3.5 text-xs rounded-xl border border-border">
          {curriculumMastery.map((item) => (
            <div key={item.name} className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-content-primary">{item.name}</span>
                <span className="font-technical text-content-secondary font-medium">{item.percent}%</span>
              </div>
              <div className="w-full bg-surface-secondary h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-brand-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${item.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Completed Challenges History */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold text-content-secondary uppercase tracking-wider">
          Completed Practice Challenges
        </h3>

        <div className="surface-card divide-y divide-border-subtle rounded-xl border border-border">
          {INITIAL_CHALLENGES.filter((c) => user.completedChallengeIds.includes(c.id)).map((ch) => (
            <div key={ch.id} className="p-4 flex items-center justify-between gap-4 text-xs">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-brand-500 uppercase">{ch.missionNumber}</span>
                  <span className="text-content-tertiary">·</span>
                  <span className="font-medium text-content-primary">{ch.title}</span>
                  <span className="text-content-tertiary">·</span>
                  <span className="text-content-secondary capitalize">{ch.cipherType}</span>
                </div>
              </div>
              <span className="font-medium text-emerald-600 dark:text-emerald-400 font-mono text-[11px]">
                Solved
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
