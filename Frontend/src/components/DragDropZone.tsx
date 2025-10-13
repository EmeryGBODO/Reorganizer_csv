import React, { useRef, useState } from 'react';
import { Upload, AlertCircle } from 'lucide-react';

interface DragDropZoneProps {
  onFileDrop: (file: File) => void;
  accept?: string;
  disabled?: boolean;
  className?: string;
}

const DragDropZone: React.FC<DragDropZoneProps> = ({
  onFileDrop,
  accept = '.csv,.xlsx,.xls', // Mise à jour pour accepter les fichiers Excel
  disabled = false,
  className = '',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedExtensions = accept.split(',').map(ext => ext.trim());

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const validateFile = (file: File) => {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedExtensions.includes(extension)) {
      setError(`Type de fichier non supporté. Attendu : ${allowedExtensions.join(', ')}`);
      return false;
    }
    setError(null);
    return true;
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (disabled) return;

    const file = e.dataTransfer.files?.[0];
    if (file && validateFile(file)) {
      onFileDrop(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && validateFile(file)) {
      onFileDrop(file);
    }
  };

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'hover:bg-gray-50'}
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
          ${error ? 'border-red-500 bg-red-50' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          name='file'
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          disabled={disabled}
          className="hidden"
        />

        <div className="flex flex-col items-center space-y-4">
          {error ? (
            <AlertCircle className="h-12 w-12 text-red-500" />
          ) : (
            <Upload className={`h-12 w-12 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
          )}

          <div>
            <p className={`text-lg font-medium ${error ? 'text-red-700' : 'text-gray-700'}`}>
              {error || 'Glissez votre fichier CSV ou Excel ici'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              ou cliquez pour sélectionner un fichier
            </p>
          </div>

          {isDragging && (
            <div className="text-blue-600 font-medium">
              Relâchez pour uploader le fichier
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DragDropZone;