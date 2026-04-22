import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Target, CalendarDays, CheckSquare } from "lucide-react";
import TaskSystem from "./TaskSystem";
import TimetableSystem from "./TimetableSystem";

function SectionCard({ title, icon: Icon, children, className = "" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className={`rounded-[1.5rem] border border-white/5 bg-white/[0.015] p-6 shadow-sm flex flex-col ${className}`}
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-xl bg-white/5 p-2">
          <Icon className="text-brand" size={18} />
        </div>
        <h3 className="text-lg font-bold tracking-tight">{title}</h3>
      </div>
      <div className="flex-1 min-h-0">
        {children}
      </div>
    </motion.div>
  );
}

export default function DashboardExtras({ onUpdate }) {
  useEffect(() => {
    // Only load tasks or other relevant data if needed
  }, []);

  return (
    <div className="mt-6 flex flex-col gap-6">
      {/* Task & Timetable Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <SectionCard title="Today's Tasks" icon={CheckSquare} className="h-[400px]">
          <TaskSystem onTaskCompleted={onUpdate} />
        </SectionCard>
        
        <SectionCard title="Timetable" icon={CalendarDays} className="h-[400px]">
          <TimetableSystem />
        </SectionCard>
      </div>
    </div>
  );
}
