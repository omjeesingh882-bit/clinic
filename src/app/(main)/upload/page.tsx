"use client";

import React, { useState, useEffect, useTransition } from "react";
import { PatientSelector, Patient } from "@/components/upload/patient-selector";
import { ImageUploader } from "@/components/upload/image-uploader";
import { ProcessingStatus, ProcessingStatusType } from "@/components/upload/processing-status";
import { ReviewPanel } from "@/components/prescription/review-panel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles, FileText } from "lucide-react";
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
        if (formatted.length > 0 && !selectedPatientId) {
          setSelectedPatientId(formatted[0].id);
        }
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
    setErrorMsg("");
    
    try {
      // Step 1: Preprocessing
      await new Promise(r => setTimeout(r, 400));
      setStatus("ocr");

      // Step 2: OCR & AI Processing
      const processed = await processImage(base64String);
      
      // Step 3: AI Analysis complete
      setStatus("ai");
      await new Promise(r => setTimeout(r, 400));

      setResults(processed);
      setStatus("complete");
      toast.success("Prescription processed successfully!");
    } catch (err: any) {
      console.error("Upload error:", err);
      setStatus("error");
      setErrorMsg(err?.message || "Failed to process image. Please ensure the image is clear and try again.");
      toast.error("Processing failed. Please try again.");
    }
  };

  const handleUseSample = (type: 'general' | 'respiratory' | 'cardiac') => {
    if (typeof window === 'undefined') return;

    // Ensure a patient is selected
    if (!selectedPatientId && patients.length > 0) {
      setSelectedPatientId(patients[0].id);
    }

    const canvas = document.createElement('canvas');
    canvas.width = 1000;
    canvas.height = 700;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 1000, 700);

    ctx.fillStyle = '#1e3a8a';
    ctx.font = 'bold 28px Arial, sans-serif';
    ctx.fillText('CITY HEALTH CLINIC & MULTISPECIALTY', 50, 70);

    ctx.fillStyle = '#64748b';
    ctx.font = '16px Arial, sans-serif';
    ctx.fillText('Dr. Sarah Jenkins, MD (General Medicine) | Reg No: 589201', 50, 105);

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(50, 125);
    ctx.lineTo(950, 125);
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 18px Arial, sans-serif';
    ctx.fillText('Date: 15-Nov-2025 | Patient: Alex Morgan | Age: 38 | Sex: Male', 50, 160);

    ctx.fillStyle = '#2563eb';
    ctx.font = 'bold 24px Arial, sans-serif';
    ctx.fillText('Rx:', 50, 210);

    ctx.fillStyle = '#1e293b';
    ctx.font = '19px Arial, sans-serif';

    if (type === 'general') {
      ctx.fillText('1. Tab Augmentin 625mg - 1 tablet twice daily after meals for 5 days', 80, 260);
      ctx.fillText('2. Tab Dolo 650mg - 1 tablet SOS when required for fever', 80, 310);
      ctx.fillText('3. Cap Pan-D 40mg - 1 capsule once daily before breakfast for 5 days', 80, 360);
      ctx.fillText('4. Syrup Ascoril LS - 10ml thrice daily for 5 days', 80, 410);
    } else if (type === 'respiratory') {
      ctx.fillText('1. Tab Montek-LC - 1 tablet once daily at bedtime for 7 days', 80, 260);
      ctx.fillText('2. Tab Azithromycin 500mg - 1 tablet once daily before food for 3 days', 80, 310);
      ctx.fillText('3. Syrup Benadryl - 10ml thrice daily for 5 days', 80, 360);
      ctx.fillText('4. Tab Calpol 650mg - 1 tablet SOS for headache/fever', 80, 410);
    } else {
      ctx.fillText('1. Tab Telmisartan 40mg - 1 tablet once daily in morning for 30 days', 80, 260);
      ctx.fillText('2. Tab Metformin 500mg - 1 tablet twice daily with meals for 30 days', 80, 310);
      ctx.fillText('3. Tab Atorvastatin 10mg - 1 tablet at bedtime for 30 days', 80, 360);
    }

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(50, 480);
    ctx.lineTo(950, 480);
    ctx.stroke();

    ctx.fillStyle = '#475569';
    ctx.font = '16px Arial, sans-serif';
    ctx.fillText('Advice: Drink warm water, adequate rest. Review after 5 days.', 50, 520);

    const sampleBase64 = canvas.toDataURL('image/jpeg', 0.95);
    handleImageSelected(sampleBase64);
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
        <p className="text-slate-500 mt-2">Digitize and extract medicines, dosages, and notes from physical prescriptions.</p>
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
              <CardHeader className="pb-4 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2 text-slate-800">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm font-bold">2</span>
                    Upload Document
                  </CardTitle>
                  <CardDescription>Upload a clear photo or scan of the prescription.</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ImageUploader onImageSelected={handleImageSelected} />

                {/* Quick Sample Presets */}
                <div className="pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Or try an instant sample prescription
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <Button 
                      type="button"
                      variant="outline" 
                      size="sm"
                      onClick={() => handleUseSample('general')}
                      className="text-xs justify-start h-auto py-2.5 px-3 border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 text-slate-700"
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-500 mr-2 shrink-0" />
                      <div className="text-left">
                        <div className="font-medium">General Care</div>
                        <div className="text-[10px] text-slate-400">Augmentin, Dolo, Pan-D</div>
                      </div>
                    </Button>

                    <Button 
                      type="button"
                      variant="outline" 
                      size="sm"
                      onClick={() => handleUseSample('respiratory')}
                      className="text-xs justify-start h-auto py-2.5 px-3 border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 text-slate-700"
                    >
                      <FileText className="w-3.5 h-3.5 text-purple-500 mr-2 shrink-0" />
                      <div className="text-left">
                        <div className="font-medium">Respiratory</div>
                        <div className="text-[10px] text-slate-400">Montek-LC, Azithromycin</div>
                      </div>
                    </Button>

                    <Button 
                      type="button"
                      variant="outline" 
                      size="sm"
                      onClick={() => handleUseSample('cardiac')}
                      className="text-xs justify-start h-auto py-2.5 px-3 border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 text-slate-700"
                    >
                      <FileText className="w-3.5 h-3.5 text-emerald-500 mr-2 shrink-0" />
                      <div className="text-left">
                        <div className="font-medium">Cardio & Diabetes</div>
                        <div className="text-[10px] text-slate-400">Telmisartan, Metformin</div>
                      </div>
                    </Button>
                  </div>
                </div>
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
                <p>2. <strong>Upload:</strong> Provide a clear, well-lit photo of the prescription (JPG, PNG, WEBP).</p>
                <p>3. <strong>Instant OCR & AI:</strong> Our optical character recognition and medical parser automatically extracts medicines, strengths, frequencies, and doctor's advice.</p>
                <p>4. <strong>Review & Save:</strong> Verify and edit the extracted details before saving to the electronic health record.</p>
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
