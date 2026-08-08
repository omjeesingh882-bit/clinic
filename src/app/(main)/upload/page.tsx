"use client";

import React, { useState, useEffect, useTransition } from "react";
import { PatientSelector, Patient } from "@/components/upload/patient-selector";
import { ImageUploader } from "@/components/upload/image-uploader";
import { ProcessingStatus, ProcessingStatusType } from "@/components/upload/processing-status";
import { ReviewPanel } from "@/components/prescription/review-panel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { getPatients } from "@/actions/patients";
import { processImage } from "@/actions/prescriptions";
import { cn } from "@/lib/utils";

export default function UploadPage({
  searchParams,
}: {
  searchParams: Promise<{ patientId?: string }>;
}) {
  const [isPending, startTransition] = useTransition();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  
  const [imageData, setImageData] = useState<string | null>(null);
  const [status, setStatus] = useState<ProcessingStatusType>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");
  
  const [results, setResults] = useState<any>(null);

  // Initialize data
  useEffect(() => {
    startTransition(async () => {
      try {
        const patientData = await getPatients();
        const formatted: Patient[] = (patientData || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          age: p.age,
          gender: p.gender,
        }));
        setPatients(formatted);
      } catch (err) {
        console.error("Failed to load patients:", err);
      }

      const params = await searchParams;
      if (params.patientId) {
        setSelectedPatientId(params.patientId);
      }
    });
  }, [searchParams]);

  const handleImageSelected = async (base64String: string) => {
    setImageData(base64String);
    setStatus("preprocessing");
    
    try {
      setStatus("ocr");
      const processed = await processImage(base64String);
      setStatus("ai");
      
      setResults(processed);
      setStatus("complete");
    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setErrorMsg(err?.message || "Failed to process image. Please try again.");
      toast.error("Processing failed");
    }
  };

  const resetFlow = () => {
    setImageData(null);
    setStatus("idle");
    setResults(null);
  };

  return (
    <div className="container mx-auto max-w-6xl py-8 px-4 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Upload Prescription</h1>
        <p className="text-slate-500 mt-2">Digitize and extract information from physical prescriptions.</p>
      </div>

      {!results ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 flex flex-col gap-6">
            <Card className="border-0 shadow-sm bg-white/50 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl flex items-center gap-2 text-slate-800">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm font-bold">1</span>
                  Select Patient
                </CardTitle>
                <CardDescription>Who is this prescription for?</CardDescription>
              </CardHeader>
              <CardContent>
                <PatientSelector 
                  patients={patients} 
                  selectedPatientId={selectedPatientId} 
                  onSelect={setSelectedPatientId} 
                />
              </CardContent>
            </Card>

            <Card className={cn(
              "border-0 shadow-sm transition-all duration-300",
              !selectedPatientId ? "opacity-50 pointer-events-none" : "bg-white"
            )}>
              <CardHeader className="pb-4">
                <CardTitle className="text-xl flex items-center gap-2 text-slate-800">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm font-bold">2</span>
                  Upload Document
                </CardTitle>
                <CardDescription>Upload a clear photo or scan of the prescription.</CardDescription>
              </CardHeader>
              <CardContent>
                <ImageUploader onImageSelected={handleImageSelected} />
              </CardContent>
            </Card>

            {status !== 'idle' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <ProcessingStatus status={status} error={errorMsg} />
              </div>
            )}
          </div>
          
          <div className="lg:col-span-4 hidden lg:block">
            <Card className="bg-blue-50/50 border-blue-100 sticky top-8">
              <CardHeader>
                <CardTitle className="text-lg text-blue-900">How it works</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-blue-800 space-y-4">
                <p>1. <strong>Select Patient:</strong> Choose an existing patient or add a new one.</p>
                <p>2. <strong>Upload:</strong> Provide a clear, well-lit photo of the prescription.</p>
                <p>3. <strong>AI Processing:</strong> Our advanced AI will automatically read and digitize the medicines, dosages, and notes.</p>
                <p>4. <strong>Review & Save:</strong> Verify the extracted information before saving it to the patient's record.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
          <Button variant="ghost" onClick={resetFlow} className="mb-6 -ml-2 text-slate-500 hover:text-slate-800">
            <ArrowLeft className="w-4 h-4 mr-2" /> Upload Another
          </Button>
          
          <ReviewPanel 
            ocrResult={results.ocrResult}
            aiResult={results.aiResult}
            imageUrl={imageData!}
            qualityCheck={results.qualityCheck}
            patientId={selectedPatientId}
          />
        </div>
      )}
    </div>
  );
}
