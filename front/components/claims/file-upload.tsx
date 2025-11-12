// components/claims/file-upload.tsx
'use client';

import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Upload, FileText, ImageIcon, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FileUploadProps {
  claimId: string;
  type: 'documents' | 'photos';
  onUploadSuccess: () => void; // Function to re-fetch claim data
  existingFiles: string[];
}

export function FileUpload({ claimId, type, onUploadSuccess, existingFiles }: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      setFiles(prev => [...prev, ...acceptedFiles]);
    },
    accept: type === 'documents' 
      ? { 'application/pdf': ['.pdf'] } 
      : { 'image/*': ['.jpeg', '.jpg', '.png'] },
  });

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