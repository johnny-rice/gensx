"use client";

import { ChevronLeft, ChevronRight, Eye, EyeOff } from "lucide-react";

import { Button } from "./button";

interface VersionControlsProps {
  currentVersion: number;
  totalVersions: number;
  onPreviousVersion: () => void;
  onNextVersion: () => void;
  showDiff: boolean;
  onToggleDiff: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
}

export function VersionControls({
  currentVersion,
  totalVersions,
  onPreviousVersion,
  onNextVersion,
  showDiff,
  onToggleDiff,
  canGoPrevious,
  canGoNext,
}: VersionControlsProps) {
  return (
    <div className="inline-flex items-center gap-4 bg-white/40 backdrop-blur-md rounded-full px-1 py-1 shadow-lg">
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={onPreviousVersion}
          disabled={!canGoPrevious}
          className="rounded-full h-8 w-8 hover:bg-white/20 text-[#333333] bg-transparent border-none shadow-none"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-sm text-[#333333] font-medium px-4">
          Version {currentVersion} of {totalVersions}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={onNextVersion}
          disabled={!canGoNext}
          className="rounded-full h-8 w-8 hover:bg-white/20 text-[#333333] bg-transparent border-none shadow-none"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      <div className="h-6 w-px" />

      <div className="flex items-center gap-1 pr-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleDiff}
          className="rounded-full px-3 h-8 hover:bg-white/20 gap-2 text-[#333333] bg-transparent border-none shadow-none"
        >
          {showDiff ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
          <span className="text-sm">{showDiff ? "Hide" : "Show"} Diff</span>
        </Button>
      </div>
    </div>
  );
}
