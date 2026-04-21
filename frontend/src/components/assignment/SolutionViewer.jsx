import React from "react";
import { Copy, Download, Check, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

export default function SolutionViewer({ solution, loading }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(solution);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([solution], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = "Assignment_Solution.txt";
    document.body.appendChild(element);
    element.click();
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-4 bg-white/10 rounded w-3/4"></div>
        <div className="h-4 bg-white/10 rounded w-1/2"></div>
        <div className="h-4 bg-white/10 rounded w-5/6"></div>
        <div className="h-32 bg-white/10 rounded w-full"></div>
        <div className="h-4 bg-white/10 rounded w-2/3"></div>
      </div>
    );
  }

  if (!solution) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 border-2 border-dashed border-white/5 rounded-2xl bg-white/[0.02]">
        <div className="p-4 rounded-full bg-white/5 text-muted/40 mb-4">
           <FileText size={48} />
        </div>
        <h3 className="text-xl font-medium text-white/50">No Solution Generated</h3>
        <p className="text-muted text-sm mt-2 max-w-sm">
          Upload an assignment and click "Generate Solution" to see the AI-powered step-by-step breakdown here.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass premium-border rounded-2xl flex flex-col h-full overflow-hidden"
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
          <span className="text-sm font-semibold tracking-wide uppercase text-white/80">AI Solution</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-muted hover:text-white transition-all border border-white/5"
            title="Copy Solution"
          >
            {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
          </button>
          <button
            onClick={handleDownload}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-muted hover:text-white transition-all border border-white/5"
            title="Download PDF"
          >
            <Download size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
        <article className="prose prose-invert max-w-none prose-p:text-gray-300 prose-headings:text-white prose-strong:text-blue-400 prose-ul:list-disc prose-li:text-gray-300">
          <ReactMarkdown>{solution}</ReactMarkdown>
        </article>
      </div>
    </motion.div>
  );
}
