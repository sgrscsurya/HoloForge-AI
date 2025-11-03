import { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Image as ImageIcon, X, Loader2 } from 'lucide-react';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
}

export function UploadZone({ onFileSelect, isProcessing }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleFile(file);
    }
  }, []);

  const handleFile = (file: File) => {
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleGenerate = () => {
    if (selectedFile) {
      onFileSelect(selectedFile);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreview(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h2 className="text-4xl font-bold text-white mb-4">
          Upload Your Image
        </h2>
        <p className="text-gray-400 text-lg">
          Choose a 2D image to transform into a 3D holographic object
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        {!preview ? (
          <motion.div
            key="upload"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-2xl p-16 transition-all ${
              isDragging
                ? 'border-cyan-400 bg-cyan-500/10'
                : 'border-gray-600 bg-white/5 hover:border-cyan-500/50'
            } backdrop-blur-sm`}
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isProcessing}
            />

            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                <Upload className="w-10 h-10 text-cyan-400" />
              </div>

              <div className="text-center">
                <p className="text-xl text-white font-semibold mb-2">
                  Drop your image here
                </p>
                <p className="text-gray-400">
                  or click to browse
                </p>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-500">
                <ImageIcon className="w-4 h-4" />
                <span>Supports JPG, PNG</span>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="space-y-6"
          >
            <div className="relative rounded-2xl overflow-hidden bg-white/5 backdrop-blur-sm border border-cyan-500/20">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-96 object-contain"
              />

              {!isProcessing && (
                <button
                  onClick={handleClear}
                  className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              )}
            </div>

            <div className="flex justify-center">
              <motion.button
                onClick={handleGenerate}
                disabled={isProcessing}
                whileHover={!isProcessing ? { scale: 1.05 } : {}}
                whileTap={!isProcessing ? { scale: 0.95 } : {}}
                className={`group relative px-10 py-4 text-lg font-semibold text-white rounded-xl overflow-hidden ${
                  isProcessing ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600" />
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative flex items-center gap-3">
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generating 3D Model...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generate 3D Model
                    </>
                  )}
                </span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Sparkles({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}
