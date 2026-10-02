import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Folder as FolderIcon, Plus, Edit2, Trash2, ArrowUpRight, FileText, Check, X, Shield } from 'lucide-react';
import { Folder } from '../../../types/archive';
import { SavedInvestigation } from '../../../types/investigation';
import { soundService } from '../../../services/sound';

export interface FolderPreviewProps {
  folders: Folder[];
  investigations: SavedInvestigation[];
  activeFolderId: string;
  onSelectFolder: (id: string) => void;
  onCreateFolder: (name: string) => void;
  onRenameFolder: (id: string, newName: string) => void;
  onDeleteFolder: (id: string) => void;
  onOpenInvestigation: (inv: SavedInvestigation) => void;
  onDeleteInvestigation: (id: string) => void;
}

export const FolderPreview: React.FC<FolderPreviewProps> = ({
  folders,
  investigations,
  activeFolderId,
  onSelectFolder,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onOpenInvestigation,
  onDeleteInvestigation,
}) => {
  const [isCreatingFolder, setIsCreatingFolder] = useState<boolean>(false);
  const [newFolderName, setNewFolderName] = useState<string>('');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');
  const [hoveredFolderId, setHoveredFolderId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const activeFolder = folders.find((f) => f.id === activeFolderId) || folders[0];
  const folderInvestigations = investigations.filter((inv) => inv.folderId === activeFolder?.id);

  const handleCreate = () => {
    if (newFolderName.trim()) {
      soundService.playSuccess();
      onCreateFolder(newFolderName.trim());
      setNewFolderName('');
      setIsCreatingFolder(false);
    }
  };

  const handleRename = (id: string) => {
    if (editingName.trim()) {
      soundService.playKeyClick();
      onRenameFolder(id, editingName.trim());
      setEditingFolderId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Precision Folder Tabs Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-border">
        {folders.map((folder) => {
          const isActive = folder.id === activeFolder?.id;
          const count = investigations.filter((inv) => inv.folderId === folder.id).length;

          return (
            <button
              key={folder.id}
              onClick={() => {
                soundService.playKeyClick();
                onSelectFolder(folder.id);
              }}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all shrink-0
                ${
                  isActive
                    ? 'bg-surface-elevated border border-border text-content-primary shadow-xs font-semibold'
                    : 'bg-surface-secondary/60 hover:bg-surface-secondary text-content-secondary hover:text-content-primary border border-transparent'
                }
              `}
            >
              <FolderIcon className={`w-3.5 h-3.5 ${isActive ? 'text-brand-500' : 'text-content-tertiary'}`} />
              <span>{folder.name}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-surface-secondary text-content-tertiary font-mono">
                {count}
              </span>
            </button>
          );
        })}

        {/* New Folder Action Button */}
        {isCreatingFolder ? (
          <div className="flex items-center gap-1.5 px-2 py-1 bg-surface-secondary border border-border rounded-md text-xs">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name..."
              className="bg-transparent text-xs text-content-primary focus:outline-none w-28"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            <button
              onClick={handleCreate}
              className="text-brand-600 hover:text-brand-500 p-0.5"
              title="Save"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsCreatingFolder(false)}
              className="text-content-tertiary hover:text-content-primary p-0.5"
              title="Cancel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsCreatingFolder(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-dashed border-border hover:border-border-hover text-xs text-content-secondary hover:text-content-primary transition-colors shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Folder</span>
          </button>
        )}
      </div>

      {/* Active Folder Header with Action controls */}
      {activeFolder && (
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-3">
            {editingFolderId === activeFolder.id ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="px-2 py-1 bg-surface-secondary border border-border rounded text-sm text-content-primary focus:outline-none focus:border-brand-500"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleRename(activeFolder.id)}
                />
                <button
                  onClick={() => handleRename(activeFolder.id)}
                  className="text-brand-600 hover:text-brand-500"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setEditingFolderId(null)}
                  className="text-content-tertiary hover:text-content-primary"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-content-primary">
                  {activeFolder.name}
                </h3>
                {activeFolder.id !== 'default-1' && (
                  <button
                    onClick={() => {
                      setEditingFolderId(activeFolder.id);
                      setEditingName(activeFolder.name);
                    }}
                    className="text-content-tertiary hover:text-content-primary p-1"
                    title="Rename Folder"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
            <span className="text-xs text-content-tertiary">
              {folderInvestigations.length} session{folderInvestigations.length === 1 ? '' : 's'} saved
            </span>
          </div>

          {activeFolder.id !== 'default-1' && (
            <button
              onClick={() => {
                if (confirm(`Delete folder "${activeFolder.name}" and all contained records?`)) {
                  onDeleteFolder(activeFolder.id);
                }
              }}
              className="text-xs text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Folder</span>
            </button>
          )}
        </div>
      )}

      {/* Investigations List / Card Stack */}
      <AnimatePresence mode="popLayout">
        {folderInvestigations.length === 0 ? (
          <motion.div
            key="empty-state"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="py-16 text-center border border-dashed border-border rounded-lg bg-surface-secondary/20"
          >
            <FileText className="w-8 h-8 text-content-tertiary mx-auto mb-2 opacity-50" />
            <h4 className="text-sm font-medium text-content-primary mb-1">
              No archived decoding sessions
            </h4>
            <p className="text-xs text-content-secondary max-w-sm mx-auto">
              Solve cipher challenges in the Decoder workspace and click &ldquo;Save Session&rdquo; to file them into this folder.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key={activeFolder?.id || 'investigation-grid'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-3"
          >
            <AnimatePresence mode="popLayout">
              {folderInvestigations.map((inv) => (
                <motion.div
                  key={inv.id}
                  layout
                  initial={{ opacity: 0, scale: 0.98, y: 6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.16 } }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className="p-4 bg-surface-card border border-border rounded-lg hover:border-border-hover transition-colors group relative flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-content-primary group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                          {inv.name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-secondary text-content-secondary uppercase font-technical">
                          {inv.cipherType}
                        </span>
                      </div>
                      <span className="text-[11px] text-content-tertiary font-technical">
                        {new Date(inv.date).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Cipher preview */}
                    <div className="p-2 bg-surface-secondary/40 rounded border border-border-subtle mb-3">
                      <div className="text-[10px] text-content-tertiary font-technical uppercase mb-0.5">
                        Decoded Text:
                      </div>
                      <div className="text-xs font-technical text-content-primary truncate">
                        {inv.decodedText}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-content-secondary">
                      <span>Score: <strong className="text-content-primary">+{inv.score} XP</strong></span>
                      <span>&bull;</span>
                      <span>Time: <strong className="text-content-primary">{inv.timeTakenSeconds}s</strong></span>
                    </div>
                  </div>

                  {/* Actions row with inline deletion confirmation */}
                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-border-subtle">
                    <button
                      onClick={() => onOpenInvestigation(inv)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 dark:text-brand-400 hover:text-brand-500 transition-colors"
                    >
                      <span>Open in Workspace</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>

                    {deletingId === inv.id ? (
                      <div className="flex items-center gap-1.5 text-xs animate-in fade-in duration-150">
                        <span className="text-rose-500 font-medium text-[11px]">Delete?</span>
                        <button
                          onClick={() => {
                            soundService.playGlitch();
                            onDeleteInvestigation(inv.id);
                            setDeletingId(null);
                          }}
                          className="px-2 py-0.5 rounded bg-rose-500 hover:bg-rose-600 text-white font-medium text-[11px] transition-colors"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeletingId(null)}
                          className="px-1.5 py-0.5 rounded bg-surface-secondary hover:bg-surface-elevated text-content-secondary text-[11px] transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeletingId(inv.id)}
                        className="text-content-tertiary hover:text-rose-500 p-1 transition-colors"
                        title="Delete record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
