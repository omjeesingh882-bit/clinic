"use client";

import { useState, useEffect } from "react";
import { Search, Calendar, User, FileText, Pill, Activity, Tags, ArrowRight, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { searchPrescriptions } from "@/actions/prescriptions";
import { format } from "date-fns";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length > 0) {
        setIsLoading(true);
        setHasSearched(true);
        try {
          const data = await searchPrescriptions(query);
          setResults(data || []);
        } catch (error) {
          console.error(error);
          setResults([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        setResults([]);
        setHasSearched(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4">
      <div className="flex flex-col space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Search Prescriptions</h1>
          <p className="text-slate-500">Find prescriptions by patient name, medication, notes, or findings.</p>
        </div>

        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          </div>
          <Input
            type="text"
            placeholder="Search by patient, medicine, notes..."
            className="pl-12 h-14 text-lg bg-white shadow-sm border-slate-200 focus-visible:ring-blue-500 rounded-xl"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {isLoading && (
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
              <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-blue-500"></div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {!hasSearched && query.length === 0 && (
            <EmptyState
              icon={Search}
              title="Search the knowledge base"
              description="Enter a patient name, medication, or keyword to start searching through all clinic prescriptions."
            />
          )}

          {hasSearched && results.length === 0 && !isLoading && (
            <EmptyState
              icon={FileText}
              title="No results found"
              description={`We couldn't find any prescriptions matching "${query}". Try adjusting your search terms.`}
            />
          )}

          {results.length > 0 && (
            <div className="grid grid-cols-1 gap-4">
              <p className="text-sm font-medium text-slate-500 mb-2">
                Found {results.length} result{results.length === 1 ? "" : "s"}
              </p>
              
              {results.map((prescription) => (
                <Link key={prescription.id} href={`/prescriptions/${prescription.id}`}>
                  <Card className="hover:shadow-md transition-all hover:border-blue-200 cursor-pointer group">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg text-slate-900 flex items-center gap-2 group-hover:text-blue-600 transition-colors">
                            {prescription.patient?.name || "Unknown Patient"}
                            {prescription.isImportant && (
                              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                            )}
                          </CardTitle>
                          <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {prescription.date ? format(new Date(prescription.date), "MMM d, yyyy") : "Unknown date"}
                            </span>
                            {prescription.patient?.phone && (
                              <span className="flex items-center gap-1">
                                <User className="h-3.5 w-3.5" />
                                {prescription.patient.phone}
                              </span>
                            )}
                          </div>
                        </div>
                        <Badge variant="outline" className={cn(
                          "bg-slate-50",
                          prescription.confidenceScore > 90 ? "text-green-600 border-green-200" : 
                          prescription.confidenceScore > 70 ? "text-amber-600 border-amber-200" : 
                          "text-red-600 border-red-200"
                        )}>
                          OCR: {prescription.confidenceScore}%
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-3">
                      <p className="text-sm text-slate-600 line-clamp-2">
                        {prescription.summary || "No summary available."}
                      </p>
                    </CardContent>
                    <CardFooter className="pt-0 flex flex-wrap items-center gap-2">
                      {prescription.medicines?.slice(0, 3).map((med: any, i: number) => (
                        <Badge key={i} variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 flex gap-1 items-center">
                          <Pill className="h-3 w-3" />
                          {med.name}
                        </Badge>
                      ))}
                      {prescription.medicines?.length > 3 && (
                        <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                          +{prescription.medicines.length - 3} more
                        </Badge>
                      )}
                      
                      {prescription.tags?.slice(0, 2).map((tag: string, i: number) => (
                        <Badge key={`tag-${i}`} variant="outline" className="border-slate-200 text-slate-500 flex gap-1 items-center">
                          <Tags className="h-3 w-3" />
                          {tag}
                        </Badge>
                      ))}
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
