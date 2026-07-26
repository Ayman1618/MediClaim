/**
 * Upload service — document upload and retrieval URL helper.
 */
import { apiClient } from '@/lib/apiClient';

export interface UploadResult {
  storedName: string;
  originalName: string;
  mimeType: string;
  size: number;
}

export const uploadsService = {
  /**
   * Upload a supporting document file.
   * Returns the storedName (UUID-based key) to include in the create claim request.
   */
  async uploadDocument(file: File): Promise<UploadResult> {
    const formData = new FormData();
    formData.append('file', file);

    const { data } = await apiClient.post<UploadResult>('/uploads', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  /**
   * Get the URL to retrieve a stored document.
   * The backend enforces ownership checks when this URL is fetched.
   */
  getDocumentUrl(storedName: string): string {
    const base = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
    return `${base}/uploads/file/${storedName}`;
  },
};
