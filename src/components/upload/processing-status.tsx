"use client";

import React from "react";
import { Check, Image as ImageIcon, FileText, Brain, FileCheck2, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ProcessingStatusType = 'idle' | 'preprocessing' | 'ocr' | 'ai' | 'complete' | 'error';

interface ProcessingStatusProps {
  status: ProcessingStatusType;
  error?: string;
}

const STEPS = [
  { id: 'preprocessing', label: 'Image Preprocessing', icon: ImageIcon },
  { id: 'ocr', label: 'OCR Processing', icon: FileText },
  { id: 'ai', label: 'AI Analysis', icon: Brain },
  { id: 'complete', label: 'Ready for Review', icon: FileCheck2 },
];

export function ProcessingStatus({ status, error }: ProcessingStatusProps) {
  if (status === 'idle') return null;

  const getStepStatus = (stepId: string, index: number) => {
    const statusOrder = ['idle', 'preprocessing', 'ocr', 'ai', 'complete', 'error'];
    const currentStatusIndex = statusOrder.indexOf(status === 'error' ? 'idle' : status);
    
    if (status === 'error') {
      // If error, mark current and past steps appropriately based on where it failed, but let's simplify
      return 'error';
    }

    if (currentStatusIndex > index + 1) return 'complete';
    if (currentStatusIndex === index + 1) return 'active';
    return 'pending';
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-6 bg-white rounded-2xl border shadow-sm">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative gap-8 md:gap-0">
        {/* Connecting Line background */}
        <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-slate-100 -translate-y-1/2 z-0" />
        
        {STEPS.map((step, index) => {
          const stepStatus = getStepStatus(step.id, index);
          const Icon = step.icon;
          
          return (
            <div key={step.id} className="relative z-10 flex md:flex-col items-center gap-4 md:gap-3 group w-full md:w-auto">
              {/* Connector line for mobile */}
              {index !== STEPS.length - 1 && (
                <div className="md:hidden absolute left-6 top-12 bottom-[-2rem] w-0.5 bg-slate-100 z-[-1]" />
              )}
              
              <div
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 shrink-0",
                  stepStatus === 'complete' && "bg-green-500 border-green-500 text-white",
                  stepStatus === 'active' && "bg-blue-50 border-blue-500 text-blue-600 shadow-[0_0_0_4px_rgba(59,130,246,0.1)]",
                  stepStatus === 'pending' && "bg-white border-slate-200 text-slate-400",
                  stepStatus === 'error' && status === 'error' && "bg-red-50 border-red-500 text-red-600"
                )}
              >
                {stepStatus === 'complete' ? (
                  <Check className="w-6 h-6" />
                ) : stepStatus === 'active' ? (
                  <div className="relative flex items-center justify-center">
                    <Icon className="w-5 h-5 absolute" />
                    <Loader2 className="w-8 h-8 animate-spin opacity-20" />
                  </div>
                ) : status === 'error' && stepStatus === 'error' ? (
                  <AlertCircle className="w-6 h-6" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </div>
              
              <div className="flex flex-col md:items-center">
                <span className={cn(
                  "text-sm font-medium transition-colors",
                  stepStatus === 'active' ? "text-blue-700" : 
                  stepStatus === 'complete' ? "text-slate-800" : 
                  status === 'error' ? "text-red-600" : "text-slate-500"
                )}>
                  {step.label}
                </span>
                
                {stepStatus === 'active' && (
                  <span className="text-xs text-blue-500 font-medium animate-pulse hidden md:block mt-1">
                    Processing...
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {status === 'error' && error && (
        <div className="mt-8 p-4 bg-red-50 border border-red-100 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-red-800">Processing Failed</h4>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
