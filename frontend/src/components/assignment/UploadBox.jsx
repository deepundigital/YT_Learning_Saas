import React, { useState, useRef } from "react";
import { Upload, File, X, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function UploadBox({ onFileUpload, file, setFile }) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      handleFile(droppedFile);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    const allowedTypes = ["application/pdf", "image/png", "image/jpeg", "text/plain"];
    if (allowedTypes.includes(file.type)) {
      setFile(file);
      onFileUpload(file);
    } else {
      alert("Please upload a PDF, Image, or Text file.");
    }
  };

  const clearFile = () => {
    setFile(null);
  };

  return (
    <div className="w-full">
      <div
        className={`relative group rounded-2xl border-2 border-dashed transition-all duration-300 ${
          dragActive
            ? "border-blue-500 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.2)]"
            : file
            ? "border-emerald-500/50 bg-emerald-500/5"
            : "border-white/10 bg-white/5 hover:border-white/20"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".pdf,.png,.jpg,.jpeg,.txt"
          onChange={handleChange}
        />

        <div className="flex flex-col items-center justify-center py-10 px-4 text-center cursor-pointer" onClick={() => !file && inputRef.current.click()}>
          <AnimatePresence mode="wait">
            {file ? (
              <motion.div
                key="file-ready"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="flex flex-col items-center"
              >
                <div className="relative">
                  <div className="p-4 rounded-xl bg-emerald-500/20 text-emerald-400 mb-3">
                    <File size={32} />
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      clearFile();
                    }}
                    className="absolute -top-1 -right-1 p-1 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg"
                  >
                    <X size={12} />
                  </button>
                </div>
                <p className="text-sm font-medium text-white truncate max-w-[200px]">{file.name}</p>
                <p className="text-xs text-muted mt-1">{(file.size / 1024).toFixed(1)} KB</p>
              </motion.div>
            ) : (
              <motion.div
                key="upload-prompt"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="flex flex-col items-center"
              >
                <div className={`p-4 rounded-2xl mb-4 transition-colors duration-300 ${dragActive ? 'bg-blue-500 text-white' : 'bg-white/5 text-muted group-hover:bg-white/10 group-hover:text-blue-400'}`}>
                  <Upload size={32} />
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">Upload Assignment</h3>
                <p className="text-sm text-muted">Drag and drop or click to browse</p>
                <div className="mt-4 flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted/60">
                   <span>PDF</span>
                   <span className="w-1 h-1 rounded-full bg-white/20"></span>
                   <span>Image</span>
                   <span className="w-1 h-1 rounded-full bg-white/20"></span>
                   <span>Text</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      <div className="mt-3 flex items-start gap-2 text-xs text-muted/80 bg-white/5 p-3 rounded-lg border border-white/5">
        <Info size={14} className="shrink-0 mt-0.5 text-blue-400" />
        <p>Your assignment will be analyzed step-by-step using high-performance AI.</p>
      </div>
    </div>
  );
}
