// components/claims/file-upload.tsx
'use client';

import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Upload, FileText, ImageIcon, Loader2, CheckCircle, AlertTriangle, Camera as CameraIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { checkPhotoQuality } from '@/lib/photo-quality';

// Turns a Capacitor Camera data URL into the same File type the web dropzone
// produces, so both paths feed the one upload function below unchanged.
async function dataUrlToFile(dataUrl: string, fileName: string): Promise<File> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], fileName, { type: blob.type || 'image/jpeg' });
}

// Files picked via a cloud-backed source (e.g. Google Drive through Android's
// Storage Access Framework) aren't stable local files - they're a live reference
// that Chromium re-validates right before upload. If the provider returns
// different metadata between selection and upload, Chromium aborts the request
// with net::ERR_UPLOAD_FILE_CHANGED, which surfaces to JS as an opaque network
// error indistinguishable from a real connectivity failure. Reading the file into
// memory immediately on selection and rebuilding a plain in-memory File from that
// removes the live reference entirely, so there's nothing left to change later.
async function toStableFile(file: File): Promise<File> {
  try {
    const buffer = await file.arrayBuffer();
    return new File([buffer], file.name, { type: file.type, lastModified: file.lastModified });
  } catch {
    // If even reading it fails, fall back to the original - the upload will
    // surface whatever the real problem is instead of silently losing the file.
    return file;
  }
}

interface FileUploadProps {
  claimId: string;
  type: 'documents' | 'photos';
  onUploadSuccess: () => void; // Function to re-fetch claim data
  existingFiles: string[];
}

export function FileUpload({ claimId, type, onUploadSuccess, existingFiles }: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Runs the blur/darkness pre-check for photo uploads only (not documents), and
  // only adds the file to the upload list if it passes - otherwise it just warns
  // and drops it, which is the "retake photo" prompt: nothing more elaborate than
  // that is needed for a simple client-side quality gate.
  const addFileIfQualityOk = async (file: File) => {
    if (type !== 'photos') {
      setFiles((prev) => [...prev, file]);
      return;
    }
    const result = await checkPhotoQuality(file);
    if (!result.ok) {
      toast.warning(result.reason ?? 'Photo quality check failed. Please retake it.');
      return;
    }
    setFiles((prev) => [...prev, file]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: async (acceptedFiles) => {
      const stableFiles = await Promise.all(acceptedFiles.map(toStableFile));
      for (const file of stableFiles) {
        await addFileIfQualityOk(file);
      }
    },
    accept: type === 'documents'
      ? { 'application/pdf': ['.pdf'] }
      : { 'image/*': ['.jpeg', '.jpg', '.png'] },
  });

  const handleCameraCapture = async () => {
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        quality: 85,
      });
      if (!photo.dataUrl) return;
      const file = await dataUrlToFile(photo.dataUrl, `photo_${Date.now()}.jpeg`);
      await addFileIfQualityOk(file);
    } catch (error: any) {
      // User cancelling the camera also lands here (message contains "cancelled") - not an error.
      if (!String(error?.message).toLowerCase().includes('cancel')) {
        toast.error('Could not open the camera.');
      }
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('Please select files to upload.');
      return;
    }

    setIsUploading(true);
    toast.loading(`Uploading ${files.length} file(s)...`);

    try {
      await api.uploadFiles(claimId, files, type);
      toast.dismiss();
      toast.success('Files uploaded successfully!');
      setFiles([]);
      onUploadSuccess(); // This calls 'mutate' from the parent page
    } catch (error: any) {
      toast.dismiss();
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-blue-600 bg-blue-50' : 'border-slate-300 hover:border-slate-400'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-slate-400" />
        {isDragActive ? (
          <p className="mt-2">Drop the files here ...</p>
        ) : (
          <p className="mt-2">Drag 'n' drop {type} here, or click to select files</p>
        )}
        <p className="text-xs text-slate-500 mt-1">
          {type === 'documents' ? 'PDF files only' : 'Images only (JPG, PNG)'}
        </p>
      </div>

      {type === 'photos' && Capacitor.isNativePlatform() && (
        <Button type="button" variant="outline" className="w-full" onClick={handleCameraCapture}>
          <CameraIcon className="mr-2 h-4 w-4" />
          Take Photo
        </Button>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">Files to upload:</h4>
          <ul className="list-disc list-inside space-y-1">
            {files.map((file, i) => (
              <li key={i} className="text-sm">{file.name}</li>
            ))}
          </ul>
          <Button onClick={handleUpload} disabled={isUploading}>
            {isUploading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</>
            ) : (
              `Upload ${files.length} ${type}`
            )}
          </Button>
        </div>
      )}

      {existingFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">Uploaded {type}:</h4>
          <ul className="list-disc list-inside space-y-1">
            {existingFiles.map((url, i) => (
              <li key={i} className="text-sm">
                <a 
                  href={url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-blue-600 hover:underline"
                >
                  {url.split('/').pop()?.split('?')[0].substring(14) || 'View File'}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}