"use client";

import React, { useState } from "react";
import { Plus, Trash2, Maximize2, Save, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { QualityWarning } from "@/components/upload/quality-warning";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { savePrescription } from "@/actions/prescriptions";

interface ReviewPanelProps {
  ocrResult: { text: string; confidence: number };
  aiResult: {
    correctedText: string;
    summary: string;
    medicines: { name: string; dosage: string; frequency: string; uncertain?: boolean }[];
    importantFindings: string[];
    tags: string[];
  };
  imageUrl: string;
  qualityCheck: { score: number; warnings: string[]; isAcceptable: boolean };
  patientId: string;
}

export function ReviewPanel({ ocrResult, aiResult, imageUrl, qualityCheck, patientId }: ReviewPanelProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Form State
  const [correctedText, setCorrectedText] = useState(aiResult.correctedText);
  const [summary, setSummary] = useState(aiResult.summary);
  const [medicines, setMedicines] = useState(aiResult.medicines);
  const [findings, setFindings] = useState(aiResult.importantFindings);
  const [tags, setTags] = useState(aiResult.tags);
  const [notes, setNotes] = useState("");
  const [isImportant, setIsImportant] = useState(false);

  const [newFinding, setNewFinding] = useState("");
  const [newTag, setNewTag] = useState("");

  const handleAddMedicine = () => {
    setMedicines([...medicines, { name: "", dosage: "", frequency: "" }]);
  };

  const handleRemoveMedicine = (index: number) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const handleMedicineChange = (index: number, field: string, value: string) => {
    const newMeds = [...medicines];
    newMeds[index] = { ...newMeds[index], [field]: value };
    setMedicines(newMeds);
  };

  const handleAddFinding = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ((e.type === 'keydown' && (e as React.KeyboardEvent).key === 'Enter') || e.type === 'click') {
      e.preventDefault();
      if (newFinding.trim()) {
        setFindings([...findings, newFinding.trim()]);
        setNewFinding("");
      }
    }
  };

  const handleAddTag = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ((e.type === 'keydown' && (e as React.KeyboardEvent).key === 'Enter') || e.type === 'click') {
      e.preventDefault();
      if (newTag.trim() && !tags.includes(newTag.trim())) {
        setTags([...tags, newTag.trim()]);
        setNewTag("");
      }
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const saved = await savePrescription({
        patientId,
        imageUrl,
        rawOcr: ocrResult.text,
        correctedText,
        aiSummary: summary,
        medicinesJson: medicines,
        tags,
        importantFindings: findings,
        doctorNotes: notes,
        important: isImportant,
        ocrConfidence: ocrResult.confidence,
      });
      
      toast.success("Prescription saved successfully!");
      if (saved?.id) {
        router.push(`/prescriptions/${saved.id}`);
      } else {
        router.push(`/patients/${patientId}`);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to save prescription. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Review & Edit Prescription</h2>
          <p className="text-slate-500">Please verify the AI-extracted information below.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.back()}>Discard</Button>
          <Button onClick={handleSave} disabled={isSaving} className="min-w-[120px] bg-blue-600 hover:bg-blue-700">
            {isSaving ? "Saving..." : <><Save className="w-4 h-4 mr-2" /> Save Record</>}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN - Original Image & Raw OCR */}
        <div className="xl:col-span-5 flex flex-col gap-6 sticky top-6">
          <div className="bg-white border rounded-xl overflow-hidden shadow-sm flex flex-col">
            <div className="p-4 border-b bg-slate-50 flex items-center justify-between">
              <h3 className="font-medium text-slate-800">Original Document</h3>
              <Button variant="ghost" size="sm" onClick={() => setIsFullscreen(true)} className="h-8 text-blue-600">
                <Maximize2 className="w-4 h-4 mr-2" /> View Full
              </Button>
            </div>
            <div className="relative aspect-[3/4] bg-slate-900 flex items-center justify-center p-4">
              {imageUrl && (
                <img 
                  src={imageUrl} 
                  alt="Prescription" 
                  className="max-w-full max-h-full object-contain shadow-lg"
                />
              )}
            </div>
          </div>

          <QualityWarning qualityCheck={qualityCheck} />

          <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b bg-slate-50 flex items-center justify-between">
              <h3 className="font-medium text-slate-800">Raw OCR Text</h3>
              <Badge variant="outline" className={cn(
                "text-xs",
                ocrResult.confidence > 80 ? "text-green-700 bg-green-50" : "text-amber-700 bg-amber-50"
              )}>
                {ocrResult.confidence}% Confidence
              </Badge>
            </div>
            <div className="p-4 bg-slate-900 text-slate-300 font-mono text-xs max-h-48 overflow-y-auto whitespace-pre-wrap">
              {ocrResult.text || "No text detected."}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - Editable Data */}
        <div className="xl:col-span-7 flex flex-col gap-6">
          
          {/* AI Summary */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
            <Label htmlFor="summary" className="text-blue-900 font-semibold mb-2 block text-base">AI Summary</Label>
            <Textarea 
              id="summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="bg-white/80 border-blue-200 focus-visible:ring-blue-500 min-h-[100px] resize-y"
            />
          </div>

          {/* Medicines */}
          <div className="bg-white border rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Extracted Medicines</h3>
              <Button size="sm" variant="outline" onClick={handleAddMedicine} className="text-blue-600 border-blue-200 hover:bg-blue-50">
                <Plus className="w-4 h-4 mr-1" /> Add Medicine
              </Button>
            </div>
            
            <div className="space-y-4">
              {medicines.map((med, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row gap-3 p-4 border rounded-lg bg-slate-50/50 relative group">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs text-slate-500">Medicine Name</Label>
                    <div className="relative">
                      <Input 
                        value={med.name} 
                        onChange={(e) => handleMedicineChange(idx, "name", e.target.value)}
                        className={cn("bg-white", med.uncertain && "border-amber-300 focus-visible:ring-amber-500")}
                      />
                      {med.uncertain && (
                        <Badge variant="outline" className="absolute right-2 top-2 h-5 text-[10px] bg-amber-50 text-amber-700 border-amber-200">
                          Low Confidence
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="sm:w-1/4 space-y-1">
                    <Label className="text-xs text-slate-500">Dosage</Label>
                    <Input 
                      value={med.dosage} 
                      onChange={(e) => handleMedicineChange(idx, "dosage", e.target.value)}
                      className="bg-white"
                    />
                  </div>
                  <div className="sm:w-1/4 space-y-1">
                    <Label className="text-xs text-slate-500">Frequency</Label>
                    <Input 
                      value={med.frequency} 
                      onChange={(e) => handleMedicineChange(idx, "frequency", e.target.value)}
                      className="bg-white"
                    />
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute -right-2 -top-2 h-8 w-8 rounded-full bg-white border shadow-sm text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleRemoveMedicine(idx)}
                  >
                    <XCircle className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              {medicines.length === 0 && (
                <div className="text-center p-8 text-slate-500 border border-dashed rounded-lg bg-slate-50">
                  No medicines extracted. Click "Add Medicine" to manually enter.
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Findings */}
            <div className="bg-white border rounded-xl shadow-sm p-6">
              <Label className="text-base font-semibold text-slate-900 mb-3 block">Important Findings</Label>
              <div className="flex gap-2 mb-4">
                <Input 
                  value={newFinding}
                  onChange={(e) => setNewFinding(e.target.value)}
                  onKeyDown={handleAddFinding}
                  placeholder="Add a finding..."
                  className="flex-1"
                />
                <Button variant="secondary" onClick={handleAddFinding}><Plus className="w-4 h-4" /></Button>
              </div>
              <ul className="space-y-2">
                {findings.map((finding, idx) => (
                  <li key={idx} className="flex items-center justify-between p-2.5 px-3 bg-slate-50 rounded-md border text-sm">
                    <span className="text-slate-700">{finding}</span>
                    <button onClick={() => setFindings(findings.filter((_, i) => i !== idx))} className="text-slate-400 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Tags */}
            <div className="bg-white border rounded-xl shadow-sm p-6">
              <Label className="text-base font-semibold text-slate-900 mb-3 block">Tags / Categories</Label>
              <div className="flex gap-2 mb-4">
                <Input 
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder="Add a tag (e.g. Cardiology)..."
                  className="flex-1"
                />
                <Button variant="secondary" onClick={handleAddTag}><Plus className="w-4 h-4" /></Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, idx) => (
                  <Badge key={idx} variant="secondary" className="px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center gap-1.5 cursor-pointer" onClick={() => setTags(tags.filter((_, i) => i !== idx))}>
                    {tag} <XCircle className="w-3 h-3 opacity-50 hover:opacity-100" />
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Corrected Text & Notes */}
          <div className="bg-white border rounded-xl shadow-sm p-6 space-y-6">
            <div>
              <Label htmlFor="correctedText" className="text-base font-semibold text-slate-900 mb-2 block">Corrected Full Text</Label>
              <Textarea 
                id="correctedText"
                value={correctedText}
                onChange={(e) => setCorrectedText(e.target.value)}
                className="min-h-[150px]"
              />
            </div>
            
            <div>
              <Label htmlFor="notes" className="text-base font-semibold text-slate-900 mb-2 block">Doctor's Notes (Optional)</Label>
              <Textarea 
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any personal notes about this prescription..."
                className="min-h-[100px]"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="isImportant" 
                checked={isImportant} 
                onChange={(e) => setIsImportant(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <Label htmlFor="isImportant" className="text-slate-700 cursor-pointer">Mark this prescription as high priority / important</Label>
            </div>
          </div>

        </div>
      </div>

      {/* Fullscreen Image Modal - Simple implementation */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setIsFullscreen(false)}>
          <button className="absolute top-4 right-4 text-white hover:bg-white/20 p-2 rounded-full transition-colors" onClick={() => setIsFullscreen(false)}>
            <XCircle className="w-8 h-8" />
          </button>
          <img src={imageUrl} alt="Prescription Fullscreen" className="max-w-full max-h-full object-contain" />
        </div>
      )}
    </div>
  );
}
