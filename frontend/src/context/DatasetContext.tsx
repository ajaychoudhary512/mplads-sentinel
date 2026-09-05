import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "../services/api";

export interface DatasetVersionItem {
  version_id: string;
  dataset_name: string;
  filename: string;
  upload_id?: string;
  uploaded_at: string;
  uploaded_by: string;
  row_count: number;
  valid_row_count?: number;
  is_active: boolean;
  status: string;
  model_version?: string;
  last_analysis_at?: string;
  description?: string;
}

interface DatasetContextType {
  activeVersion: string;
  activeMetadata: DatasetVersionItem | null;
  availableVersions: DatasetVersionItem[];
  loading: boolean;
  isUploadModalOpen: boolean;
  openUploadModal: () => void;
  closeUploadModal: () => void;
  switchDatasetVersion: (versionId: string) => Promise<void>;
  refreshDatasets: () => Promise<void>;
}

const DatasetContext = createContext<DatasetContextType | undefined>(undefined);

export function DatasetProvider({ children }: { children: React.ReactNode }) {
  const [activeVersion, setActiveVersion] = useState<string>("V1");
  const [activeMetadata, setActiveMetadata] = useState<DatasetVersionItem | null>(null);
  const [availableVersions, setAvailableVersions] = useState<DatasetVersionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);

  const refreshDatasets = useCallback(async () => {
    try {
      setLoading(true);
      const [versions, active] = await Promise.all([
        api.getDatasetVersions().catch(() => []),
        api.getActiveDataset().catch(() => null),
      ]);

      if (versions && versions.length > 0) {
        setAvailableVersions(versions);
      }
      if (active) {
        setActiveMetadata(active);
        setActiveVersion(active.version_id);
        api.setCurrentDatasetVersion(active.version_id);
      }
    } catch (err) {
      console.error("Failed to fetch dataset versions:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshDatasets();
  }, [refreshDatasets]);

  const switchDatasetVersion = async (versionId: string) => {
    try {
      setLoading(true);
      const res = await api.activateDatasetVersion(versionId);
      if (res && res.success) {
        setActiveVersion(versionId);
        api.setCurrentDatasetVersion(versionId);
        await refreshDatasets();
      }
    } catch (err) {
      console.error(`Failed to switch to dataset ${versionId}:`, err);
    } finally {
      setLoading(false);
    }
  };

  const openUploadModal = () => setIsUploadModalOpen(true);
  const closeUploadModal = () => setIsUploadModalOpen(false);

  return (
    <DatasetContext.Provider
      value={{
        activeVersion,
        activeMetadata,
        availableVersions,
        loading,
        isUploadModalOpen,
        openUploadModal,
        closeUploadModal,
        switchDatasetVersion,
        refreshDatasets,
      }}
    >
      {children}
    </DatasetContext.Provider>
  );
}

export function useDataset() {
  const context = useContext(DatasetContext);
  if (!context) {
    throw new Error("useDataset must be used within a DatasetProvider");
  }
  return context;
}
