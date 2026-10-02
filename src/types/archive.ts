import { SavedInvestigation } from './investigation';

export interface Folder {
  id: string;
  name: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
  investigationCount?: number;
}

export interface ArchiveState {
  folders: Folder[];
  investigations: SavedInvestigation[];
  activeFolderId: string;
}
