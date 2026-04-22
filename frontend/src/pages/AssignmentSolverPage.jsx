import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, Loader2, AlertCircle } from "lucide-react";
import UploadBox from "../components/assignment/UploadBox";
import SolutionViewer from "../components/assignment/SolutionViewer";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function AssignmentSolverPage() {
  const [file, setFile] = useState(null);
  const [instructions, setInstructions] = useState("");
  const [loading, setLoading] = useState(false);
  const [solution, setSolution] = useState("");
  const [error, setError] = useState("");
  const [filePreview, setFilePreview] = useState(null);

  const handleFileUpload = (uploadedFile) => {
    setFile(uploadedFile);
    setError("");
    
    // Create preview for images
    if (uploadedFile.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(uploadedFile);
    } else {
      setFilePreview(null);
    }
  };

  const handleGenerate = async () => {
    if (!file && !instructions.trim()) {
      setError("Please upload a file or provide instructions.");
      return;
    }

    setLoading(true);
    setError("");
    setSolution("");

    try {
      const formData = new FormData();
      if (file) {
        formData.append("assignment", file);
      }
      if (instructions) {
        formData.append("instructions", instructions);
      }

      console.log("Status: Sending assignment to backend...");
      
      const response = await axios.post(`${API_BASE}/ai/solve-assignment`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "multipart/form-data",
        }
      });

      if (response.data.success) {
        console.log("Success: Solution received.");
        setSolution(response.data.solution);
      } else {
        const errorMsg = response.data.error || response.data.message || "Failed to generate solution.";
        console.warn("Backend Error:", errorMsg);
        setError(errorMsg);
      }
    } catch (err) {
      console.error("Assignment Solver Client Error:", err);
      const serverError = err.response?.data?.error || err.response?.data?.message || "Failed to connect to the assignment solver service.";
      setError(serverError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.15)]">
            <Sparkles size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Assignment Solver</h1>
            <p className="text-muted text-sm">Upload your homework and get expert solutions in seconds.</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left Column: Upload & Options */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <section className="glass premium-border rounded-2xl p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-white mb-3 tracking-wide uppercase opacity-70">
                1. Upload Document
              </label>
              <UploadBox onFileUpload={handleFileUpload} file={file} setFile={setFile} />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-3 tracking-wide uppercase opacity-70">
                2. Additional Instructions (Optional)
              </label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="e.g. Focus on step 2, use specific formula, or explain like I'm 5..."
                className="w-full h-32 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all resize-none"
              />
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm"
              >
                <AlertCircle size={18} />
                <span>{error}</span>
              </motion.div>
            )}

            <button
              onClick={handleGenerate}
              disabled={loading || !file}
              className={`w-full py-4 btn-premium ${
                loading || !file ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Analyzing Assignment...</span>
                </>
              ) : (
                <>
                  <Send size={20} />
                  <span>Generate AI Solution</span>
                </>
              )}
            </button>
          </section>

          {/* Preview Placeholder */}
          <AnimatePresence>
            {filePreview && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass premium-border rounded-2xl p-4"
              >
                <span className="block text-xs font-medium text-muted uppercase mb-3 px-2">Image Preview</span>
                <div className="rounded-xl overflow-hidden border border-white/10 bg-black/20 max-h-[300px]">
                  <img src={filePreview} alt="Assignment Preview" className="w-full h-full object-contain" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Right Column: Solution */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="h-full sticky top-8"
        >
          <SolutionViewer solution={solution} loading={loading} />
        </motion.div>
      </div>
    </div>
  );
}
