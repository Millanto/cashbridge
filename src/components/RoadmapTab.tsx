import { useState } from "react";
import { CheckSquare, Calendar, Award, CheckCircle2, TrendingUp, AlertCircle } from "lucide-react";
import { roadmapData } from "../data/architectureData";
import { RoadmapPhase, RoadmapTask } from "../types";

export default function RoadmapTab() {
  const [phases, setPhases] = useState<RoadmapPhase[]>(roadmapData);
  const [expandedPhases, setExpandedPhases] = useState<Record<number, boolean>>({
    1: true,
    2: true,
  });

  const togglePhase = (phaseNumber: number) => {
    setExpandedPhases(prev => ({
      ...prev,
      [phaseNumber]: !prev[phaseNumber]
    }));
  };

  const toggleTaskStatus = (phaseNumber: number, taskId: string) => {
    setPhases(prevPhases => 
      prevPhases.map(phase => {
        if (phase.phaseNumber !== phaseNumber) return phase;
        return {
          ...phase,
          tasks: phase.tasks.map(task => {
            if (task.id !== taskId) return task;
            return {
              ...task,
              status: task.status === "completed" ? "pending" : "completed"
            };
          })
        };
      })
    );
  };

  // Calculate global percentage completion
  const allTasks: RoadmapTask[] = phases.flatMap(p => p.tasks);
  const completedTasks = allTasks.filter(t => t.status === "completed").length;
  const totalTasks = allTasks.length;
  const progressPercent = Math.round((completedTasks / totalTasks) * 100);

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case "Low":
        return "bg-slate-100 text-slate-700 border-slate-200";
      case "Medium":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "High":
        return "bg-orange-100 text-orange-850 border-orange-200";
      case "Critical":
        return "bg-red-100 text-red-800 border-red-200 animate-pulse";
      default:
        return "bg-slate-100 text-slate-750";
    }
  };

  return (
    <div className="space-y-6">
      {/* Global progress tracker scorecard */}
      <div className="bg-slate-900 rounded-xl p-6 text-white grid grid-cols-1 md:grid-cols-3 gap-6 items-center shadow-md">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Blueprint Delivery Progress</span>
          <h3 className="text-2xl font-black flex items-center space-x-2">
            <TrendingUp className="h-6 w-6 text-blue-500" />
            <span>{progressPercent}% Complete</span>
          </h3>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            {completedTasks} of {totalTasks} tasks matched as complete. Phase 1 ready for initial build staging.
          </p>
        </div>

        {/* Dynamic progress bar container */}
        <div className="md:col-span-2">
          <div className="h-4 bg-slate-800 rounded-full overflow-hidden border border-slate-750">
            <div 
              style={{ width: `${progressPercent}%` }} 
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
            />
          </div>
          <div className="grid grid-cols-5 text-[9.5px] font-mono text-slate-400 mt-2.5">
            <span className="text-left font-bold text-blue-400">P1: Setup</span>
            <span className="text-center">P2: Offline</span>
            <span className="text-center">P3: Banking</span>
            <span className="text-center">P4: Webhook</span>
            <span className="text-right">P5: Audits</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Development Lifecycle Roadmap</h2>
            <p className="text-xs text-slate-500">Interactive roadmap checklist tracking setup through final container audits</p>
          </div>
          <span className="px-2.5 py-0.5 rounded bg-blue-105 text-blue-750 font-semibold text-xs flex items-center">
            <Award className="h-3.5 w-3.5 mr-1 text-blue-600" />
            Milestone Checklist
          </span>
        </div>

        <div className="p-6 space-y-8">
          {phases.map((phase) => {
            const isExpanded = expandedPhases[phase.phaseNumber];
            const phaseCompleted = phase.tasks.every(t => t.status === "completed");
            const phaseProgress = phase.tasks.filter(t => t.status === "completed").length;

            return (
              <div 
                key={phase.phaseNumber}
                className={`border rounded-xl transition-all ${
                  phaseCompleted 
                    ? "border-emerald-110 bg-emerald-50/10" 
                    : "border-slate-200 bg-white"
                }`}
              >
                {/* Header Phase Banner */}
                <div 
                  onClick={() => togglePhase(phase.phaseNumber)}
                  className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between cursor-pointer select-none"
                >
                  <div className="flex items-center space-x-3.5">
                    <span className={`h-6 w-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                      phaseCompleted 
                        ? "bg-emerald-600 text-white" 
                        : "bg-blue-600 text-white"
                    }`}>
                      {phase.phaseNumber}
                    </span>
                    <div>
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-tight flex items-center space-x-2">
                        <span>Phase {phase.phaseNumber}: {phase.title}</span>
                        {phaseCompleted && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 rounded-full block border border-emerald-200 normal-case">
                            Phase Ready
                          </span>
                        )}
                      </h3>
                      <p className="text-[10.5px] text-slate-500 mt-1 leading-relaxed max-w-2xl">{phase.objective}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 shrink-0">
                    <span className="text-[10.5px] font-mono font-bold text-slate-400">
                      ({phaseProgress}/{phase.tasks.length} Completed)
                    </span>
                  </div>
                </div>

                {/* Tasks lists */}
                {isExpanded && (
                  <div className="p-4 divide-y divide-slate-100">
                    {phase.tasks.map((task) => (
                      <div 
                        key={task.id} 
                        className={`py-3 flex items-start justify-between gap-4 transition-colors ${
                          task.status === "completed" ? "opacity-60" : ""
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <button
                            type="button"
                            onClick={() => toggleTaskStatus(phase.phaseNumber, task.id)}
                            className="mt-0.5 h-4.5 w-4.5 border border-slate-300 rounded focus:outline-none flex items-center justify-center bg-white cursor-pointer hover:border-blue-500"
                          >
                            {task.status === "completed" && (
                              <div className="h-3 w-3 bg-blue-600 rounded-sm" />
                            )}
                          </button>
                          <div>
                            <span className={`text-xs font-bold block ${
                              task.status === "completed" ? "line-through text-slate-400" : "text-slate-800"
                            }`}>
                              {task.title}
                            </span>
                            <p className="text-[10.5px] text-slate-500 mt-1 leading-relaxed max-w-xl">{task.description}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 shrink-0">
                          <span className="text-[10px] text-slate-400 font-mono flex items-center">
                            <Calendar className="h-3.5 w-3.5 mr-1" />
                            {task.estimatedTime}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${getDifficultyColor(task.difficulty)}`}>
                            {task.difficulty}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
