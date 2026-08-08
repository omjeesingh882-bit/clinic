"use client";

import React, { useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, ShieldAlert, ShieldCheck, ShieldOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface QualityWarningProps {
  qualityCheck: {
    score: number;
    warnings: string[];
    isAcceptable: boolean;
  };
}

export function QualityWarning({ qualityCheck }: QualityWarningProps) {
  const [isExpanded, setIsExpanded] = useState(!qualityCheck.isAcceptable);
  const { score, warnings, isAcceptable } = qualityCheck;

  const isGood = score >= 70;
  const isFair = score >= 40 && score < 70;
  const isPoor = score < 40;

  if (warnings.length === 0 && isGood) return null;

  return (
    <div className={cn(
      "w-full rounded-xl border overflow-hidden transition-all",
      isAcceptable ? "bg-amber-50/50 border-amber-200" : "bg-red-50/50 border-red-200"
    )}>
      <div 
        className="p-4 flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          {isGood ? (
            <ShieldCheck className="w-5 h-5 text-green-500" />
          ) : isFair ? (
            <ShieldAlert className="w-5 h-5 text-amber-500" />
          ) : (
            <ShieldOff className="w-5 h-5 text-red-500" />
          )}
          
          <div>
            <h4 className={cn(
              "text-sm font-semibold",
              isAcceptable ? "text-amber-900" : "text-red-900"
            )}>
              {isAcceptable ? "Image Quality Notice" : "Poor Image Quality"}
            </h4>
            {!isExpanded && (
              <p className={cn(
                "text-xs mt-0.5",
                isAcceptable ? "text-amber-700" : "text-red-700"
              )}>
                {warnings.length} warning(s) detected. Click to view.
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Badge variant="outline" className={cn(
            "font-medium",
            isGood ? "border-green-200 bg-green-100 text-green-700" :
            isFair ? "border-amber-200 bg-amber-100 text-amber-700" :
            "border-red-200 bg-red-100 text-red-700"
          )}>
            Quality Score: {score}/100
          </Badge>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full shrink-0">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className={cn(
          "px-4 pb-4 border-t pt-3",
          isAcceptable ? "border-amber-200/50" : "border-red-200/50"
        )}>
          {!isAcceptable && (
            <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-lg text-sm font-medium flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <p>The image quality is too low for reliable AI analysis. We strongly recommend re-uploading a clearer image to prevent errors.</p>
            </div>
          )}
          
          <ul className="space-y-2">
            {warnings.map((warning, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-slate-700">
                <AlertTriangle className={cn(
                  "w-4 h-4 shrink-0 mt-0.5",
                  isAcceptable ? "text-amber-500" : "text-red-500"
                )} />
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
