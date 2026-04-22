import React from "react";
import { Flame } from "lucide-react";
import StreakGrid from "../components/streak/StreakGrid";

export default function StreakPage() {
  return (
    <div className="py-8 px-6 max-w-7xl mx-auto space-y-8 h-[calc(100vh-120px)] overflow-y-auto scrollbar-hide">
      <header className="flex flex-col items-center justify-center text-center max-w-2xl mx-auto mt-6">
         <div className="w-16 h-16 rounded-3xl bg-orange-500/10 flex items-center justify-center text-orange-400 mb-6 border border-orange-500/20 shadow-[0_0_30px_rgba(249,115,22,0.15)]">
           <Flame size={32} className="drop-shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
         </div>
         <h1 className="text-4xl font-black text-white tracking-tight mb-3">Learning Consistency</h1>
         <p className="text-muted text-lg">Track your daily learning consistency, maintain your streak, and unlock premium community features! 🔥</p>
      </header>

      <section className="mt-12">
        <StreakGrid />
      </section>
    </div>
  );
}
