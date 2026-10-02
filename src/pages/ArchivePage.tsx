import React from 'react';
import { FolderPreview } from '../components/features/archive/FolderPreview';
import { Folder as FolderType } from '../types/archive';
import { SavedInvestigation } from '../types/investigation';

interface ArchivePageProps {
  folders: FolderType[];
  investigations: SavedInvestigation[];
  activeFolderId: string;
  onSelectFolder: (id: string) => void;
  onCreateFolder: (name: string) => void;
  onRenameFolder: (id: string, name: string) => void;
  onDeleteFolder: (id: string) => void;
  onOpenInvestigation: (inv: SavedInvestigation) => void;
  onDeleteInvestigation: (id: string) => void;
}

export const ArchivePage: React.FC<ArchivePageProps> = ({
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
  return (
    <div className="max-w-4xl mx-auto space-y-8 font-sans py-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div className="space-y-1.5">
          <span className="label-eyebrow">Personal Vault</span>
          <h1 className="text-2xl sm:text-3xl font-semibold text-content-primary tracking-tight">
            History
          </h1>
          <p className="text-sm text-content-secondary">
            Organize solved ciphers, review decoding sessions, and manage research folders.
          </p>
        </div>
      </div>

      {/* Main Folder Preview Component */}
      <FolderPreview
        folders={folders}
        investigations={investigations}
        activeFolderId={activeFolderId}
        onSelectFolder={onSelectFolder}
        onCreateFolder={onCreateFolder}
        onRenameFolder={onRenameFolder}
        onDeleteFolder={onDeleteFolder}
        onOpenInvestigation={onOpenInvestigation}
        onDeleteInvestigation={onDeleteInvestigation}
      />
    </div>
  );
};
