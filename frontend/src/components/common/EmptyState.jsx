import React from "react";
import { FolderOpen } from "lucide-react";

export const EmptyState = ({
  title = "No records found",
  description = "There are no records to display at this time.",
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl bg-slate-900/50 border border-slate-800/80">
      <div className="p-4 mb-4 rounded-full bg-slate-800/80 text-cyan-400">
        <FolderOpen className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-semibold text-slate-200">{title}</h3>
      <p className="max-w-sm mt-1 text-sm text-slate-400">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 mt-5 text-sm font-medium text-white rounded-lg bg-cyan-600 hover:bg-cyan-500 transition-colors shadow-lg shadow-cyan-950/50"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
