import { useState, useEffect, useCallback } from 'react';
import { Folder } from '../types/archive';
import { SavedInvestigation } from '../types/investigation';
import { storageService, DEFAULT_FOLDERS, DEFAULT_INVESTIGATIONS } from '../services/storage';

export function useArchive() {
  const [folders, setFolders] = useState<Folder[]>(DEFAULT_FOLDERS);
  const [investigations, setInvestigations] = useState<SavedInvestigation[]>(DEFAULT_INVESTIGATIONS);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('all');

  useEffect(() => {
    const loadedFolders = storageService.getFolders();
    const loadedInvs = storageService.getInvestigations();
    setFolders(loadedFolders);
    setInvestigations(loadedInvs);
  }, []);

  const createFolder = useCallback((name: string, color?: string) => {
    const newFolder: Folder = {
      id: `folder-${Date.now().toString(36)}`,
      name: name.trim().toUpperCase(),
      color: color || '#00F0FF',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    setFolders((prev) => {
      const updated = [...prev, newFolder];
      storageService.saveFolders(updated);
      return updated;
    });

    return newFolder;
  }, []);

  const renameFolder = useCallback((folderId: string, newName: string) => {
    setFolders((prev) => {
      const updated = prev.map((f) => 
        f.id === folderId 
          ? { ...f, name: newName.trim().toUpperCase(), updatedAt: new Date().toISOString().split('T')[0] } 
          : f
      );
      storageService.saveFolders(updated);
      return updated;
    });
  }, []);

  const deleteFolder = useCallback((folderId: string) => {
    setFolders((prev) => {
      const updated = prev.filter((f) => f.id !== folderId);
      storageService.saveFolders(updated);
      return updated;
    });
    // Move investigations to fallback or delete
    setInvestigations((prev) => {
      const updated = prev.filter((inv) => inv.folderId !== folderId);
      storageService.saveInvestigations(updated);
      return updated;
    });
    if (selectedFolderId === folderId) {
      setSelectedFolderId('all');
    }
  }, [selectedFolderId]);

  const saveInvestigation = useCallback((inv: Omit<SavedInvestigation, 'id' | 'date'>) => {
    const newInv: SavedInvestigation = {
      ...inv,
      id: `inv-${Date.now().toString(36)}`,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };

    setInvestigations((prev) => {
      const updated = [newInv, ...prev];
      storageService.saveInvestigations(updated);
      return updated;
    });

    return newInv;
  }, []);

  const deleteInvestigation = useCallback((id: string) => {
    setInvestigations((prev) => {
      const updated = prev.filter((i) => i.id !== id);
      storageService.saveInvestigations(updated);
      return updated;
    });
  }, []);

  const moveInvestigation = useCallback((investigationId: string, newFolderId: string) => {
    setInvestigations((prev) => {
      const updated = prev.map((inv) =>
        inv.id === investigationId ? { ...inv, folderId: newFolderId } : inv
      );
      storageService.saveInvestigations(updated);
      return updated;
    });
  }, []);

  const filteredInvestigations = selectedFolderId === 'all'
    ? investigations
    : investigations.filter((inv) => inv.folderId === selectedFolderId);

  return {
    folders,
    investigations: filteredInvestigations,
    allInvestigations: investigations,
    selectedFolderId,
    setSelectedFolderId,
    createFolder,
    renameFolder,
    deleteFolder,
    saveInvestigation,
    deleteInvestigation,
    moveInvestigation,
  };
}
