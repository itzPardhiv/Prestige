import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus } from 'lucide-react';
import { Folder as FolderType } from '../../../types/archive';
import { soundService } from '../../../services/sound';
import { MyAnimatedButton } from '../../ui/MyAnimatedButton';
import { modalBackdropVariants, modalDialogVariants } from '../../../lib/motion';

interface SaveInvestigationModalProps {
  isOpen: boolean;
  onClose: () => void;
  folders: FolderType[];
  onSave: (name: string, folderId: string) => void;
  onCreateFolder: (name: string) => FolderType;
  defaultName: string;
}

export const SaveInvestigationModal: React.FC<SaveInvestigationModalProps> = ({
  isOpen,
  onClose,
  folders,
  onSave,
  onCreateFolder,
  defaultName,
}) => {
  const [investigationName, setInvestigationName] = useState(defaultName);
  const [selectedFolderId, setSelectedFolderId] = useState(folders[0]?.id || 'folder-my-ciphers');
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    const created = onCreateFolder(newFolderName.trim());
    setSelectedFolderId(created.id);
    setNewFolderName('');
    setShowNewFolderInput(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!investigationName.trim()) return;
    soundService.playSuccess();
    onSave(investigationName.trim(), selectedFolderId);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="save-modal-backdrop"
          variants={modalBackdropVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm font-sans"
        >
          <motion.div
            key="save-modal-dialog"
            variants={modalDialogVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            className="surface-card max-w-md w-full p-6 space-y-5 shadow-modal border border-border"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <h3 className="text-base font-semibold text-content-primary">
                Save decoding session
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="text-content-tertiary hover:text-content-primary p-1 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="block text-content-secondary font-medium">
                  Session name
                </label>
                <input
                  type="text"
                  value={investigationName}
                  onChange={(e) => setInvestigationName(e.target.value)}
                  placeholder="e.g. Caesar Shift +3 Decoded"
                  className="w-full bg-surface-secondary text-content-primary border border-border focus:border-brand-500 rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  autoFocus
                />
              </div>

              {/* Folder Selector */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-content-secondary font-medium">
                    Save to folder
                  </label>
                  {!showNewFolderInput && (
                    <button
                      type="button"
                      onClick={() => setShowNewFolderInput(true)}
                      className="text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 text-[11px]"
                    >
                      <Plus className="w-3 h-3" />
                      <span>New folder</span>
                    </button>
                  )}
                </div>

                {showNewFolderInput ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder="Folder name..."
                      className="flex-1 bg-surface-secondary text-content-primary border border-border focus:border-brand-500 rounded-md px-2.5 py-1.5 text-xs focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleCreateFolder}
                      className="px-2.5 py-1.5 bg-brand-500 text-white rounded-md text-xs font-medium hover:bg-brand-600"
                    >
                      Create
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNewFolderInput(false)}
                      className="px-2 py-1.5 text-content-tertiary hover:text-content-primary text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                ) : null}

                <select
                  value={selectedFolderId}
                  onChange={(e) => setSelectedFolderId(e.target.value)}
                  className="w-full bg-surface-secondary text-content-primary border border-border focus:border-brand-500 rounded-md px-3 py-2 text-xs focus:outline-none"
                >
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-subtle">
                <MyAnimatedButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                >
                  Cancel
                </MyAnimatedButton>

                <MyAnimatedButton
                  type="submit"
                  variant="primary"
                  size="sm"
                >
                  Save to archive
                </MyAnimatedButton>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
