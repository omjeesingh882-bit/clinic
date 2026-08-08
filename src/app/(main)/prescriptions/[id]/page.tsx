import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { ChevronLeft, Star, Download, Edit, Trash, FileText, Pill, Activity, AlertCircle, CheckCircle2, Tags, Info } from "lucide-react";
import { getPrescriptionById, toggleImportant, deletePrescription } from "@/actions/prescriptions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";

export default async function PrescriptionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const prescription = await getPrescriptionById(id);

  if (!prescription) {
    return notFound();
  }

  const handleToggleImportant = async () => {
    "use server";
    await toggleImportant(id, !prescription.isImportant);
  };

  const handleDelete = async () => {
    "use server";
    await deletePrescription(id);
    redirect(`/patients/${prescription.patientId}`);
  };

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4 flex flex-col space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild className="rounded-full h-10 w-10 shrink-0">
            <Link href={`/patients/${prescription.patientId}`}>
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              Prescription Details
              {prescription.isImportant && (
                <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
              )}
            </h1>
            <p className="text-slate-500">
              For {prescription.patient?.name || "Unknown"} • {prescription.date ? format(new Date(prescription.date), "MMMM d, yyyy") : "Unknown Date"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <form action={handleToggleImportant}>
            <Button 
              type="submit"
              variant={prescription.isImportant ? "secondary" : "outline"} 
              size="sm" 
              className={cn("gap-2", prescription.isImportant && "bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200")}
            >
              <Star className={cn("h-4 w-4", prescription.isImportant && "fill-amber-500 text-amber-500")} />
              {prescription.isImportant ? "Important" : "Mark Important"}
            </Button>
          </form>

          <Button variant="outline" size="sm" asChild className="gap-2">
            <a href={`/api/prescriptions/${id}/pdf`} download>
              <Download className="h-4 w-4" />
              PDF Report
            </a>
          </Button>

          <Button variant="outline" size="sm" className="gap-2">
            <Edit className="h-4 w-4" />
            Edit
          </Button>

          <ConfirmDialog
            title="Delete Prescription"
            description="Are you sure you want to delete this prescription? This action cannot be undone and all extracted data will be lost."
            variant="destructive"
            onConfirm={handleDelete}
            triggerButton={
              <Button variant="destructive" size="sm" className="gap-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 shadow-none">
                <Trash className="h-4 w-4" />
                Delete
              </Button>
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="md:col-span-1 border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">Confidence Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-slate-900">{prescription.confidenceScore}%</span>
              <Badge variant="outline" className={cn(
                "mb-1",
                prescription.confidenceScore > 90 ? "bg-green-50 text-green-700 border-green-200" : 
                prescription.confidenceScore > 70 ? "bg-amber-50 text-amber-700 border-amber-200" : 
                "bg-red-50 text-red-700 border-red-200"
              )}>
                {prescription.confidenceScore > 90 ? "High" : prescription.confidenceScore > 70 ? "Medium" : "Low"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-1 border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">Medicines Found</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-slate-900">{prescription.medicines?.length || 0}</span>
              <Pill className="h-5 w-5 text-blue-500 mb-1" />
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 border-slate-200 shadow-sm bg-blue-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Quick Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-700 font-medium line-clamp-2">
              {prescription.summary || "No summary available for this prescription."}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl bg-slate-100/80 p-1 rounded-xl">
          <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Overview</TabsTrigger>
          <TabsTrigger value="ocr" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">OCR Text</TabsTrigger>
          <TabsTrigger value="medicines" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Medicines</TabsTrigger>
          <TabsTrigger value="notes" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Notes & Findings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-slate-200 shadow-sm overflow-hidden flex flex-col h-full min-h-[600px]">
              <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Image src="/file.svg" alt="File" width={20} height={20} className="opacity-50" />
                  Original Prescription
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex-1 relative bg-slate-100 flex items-center justify-center min-h-[500px]">
                {prescription.imageUrl ? (
                  <div className="relative w-full h-full p-4 cursor-zoom-in">
                    <img 
                      src={prescription.imageUrl} 
                      alt="Prescription" 
                      className="object-contain w-full h-full rounded-md shadow-sm bg-white"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <FileText className="h-16 w-16 mb-4 opacity-50" />
                    <p>No image available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex flex-col gap-6">
              <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Pill className="h-5 w-5 text-blue-500" />
                    Key Medicines
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {prescription.medicines && prescription.medicines.length > 0 ? (
                    <div className="space-y-4">
                      {prescription.medicines.slice(0, 4).map((med: any, i: number) => (
                        <div key={i} className="flex justify-between items-center border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                          <div>
                            <p className="font-medium text-slate-900 flex items-center gap-2">
                              {med.name.toLowerCase().startsWith('possibly') ? (
                                <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded text-xs">Uncertain</span>
                              ) : (
                                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                              )}
                              {med.name.replace('Possibly ', '')}
                            </p>
                            <p className="text-sm text-slate-500">{med.dosage}</p>
                          </div>
                          <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                            {med.frequency}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">No medicines detected.</p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                    Important Findings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {prescription.findings && prescription.findings.length > 0 ? (
                    <ul className="space-y-2">
                      {prescription.findings.map((finding: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                          {finding}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-500">No specific findings noted.</p>
                  )}
                </CardContent>
                {prescription.tags && prescription.tags.length > 0 && (
                  <CardFooter className="pt-0 flex flex-wrap gap-2">
                    {prescription.tags.map((tag: string, i: number) => (
                      <Badge key={i} variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">
                        {tag}
                      </Badge>
                    ))}
                  </CardFooter>
                )}
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="ocr" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="bg-slate-50 border-b border-slate-100">
                <CardTitle className="text-lg flex items-center gap-2 text-slate-700">
                  <FileText className="h-5 w-5" />
                  Raw OCR Output
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="p-4 bg-slate-900 text-slate-300 font-mono text-sm whitespace-pre-wrap rounded-b-lg overflow-auto max-h-[600px]">
                  {prescription.rawText || "No raw OCR text available."}
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm border-blue-100">
              <CardHeader className="bg-blue-50/50 border-b border-blue-100">
                <CardTitle className="text-lg flex items-center gap-2 text-blue-800">
                  <CheckCircle2 className="h-5 w-5" />
                  Corrected Text
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="p-4 bg-white text-slate-800 font-mono text-sm whitespace-pre-wrap rounded-b-lg overflow-auto max-h-[600px]">
                  {prescription.correctedText || "No corrected text available."}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="medicines" className="mt-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle>Extracted Medicines</CardTitle>
              <CardDescription>
                List of medications identified by the AI. Please verify any items marked as uncertain.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>Medication Name</TableHead>
                    <TableHead>Dosage</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prescription.medicines?.map((med: any, i: number) => {
                    const isUncertain = med.name.toLowerCase().startsWith('possibly');
                    const cleanName = med.name.replace(/^Possibly\s+/i, '');
                    
                    return (
                      <TableRow key={i} className={cn(isUncertain && "bg-amber-50/30")}>
                        <TableCell className="font-medium text-slate-900">
                          {cleanName}
                        </TableCell>
                        <TableCell className="text-slate-600">{med.dosage}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-white">
                            {med.frequency}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {isUncertain ? (
                            <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200 flex w-fit items-center gap-1">
                              <Info className="h-3 w-3" />
                              Verify
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex w-fit items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Confident
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {(!prescription.medicines || prescription.medicines.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                        No medicines were extracted from this prescription.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-slate-500" />
                  Doctor Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 min-h-[150px] whitespace-pre-wrap text-slate-700">
                  {prescription.notes || "No additional notes found."}
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tags className="h-5 w-5 text-slate-500" />
                  Classification Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {prescription.tags?.map((tag: string, i: number) => (
                    <Badge key={i} variant="secondary" className="px-3 py-1 text-sm bg-blue-50 text-blue-700 hover:bg-blue-100">
                      {tag}
                    </Badge>
                  ))}
                  {(!prescription.tags || prescription.tags.length === 0) && (
                    <p className="text-sm text-slate-500">No tags assigned.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
