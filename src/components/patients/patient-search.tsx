"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function PatientSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  
  const [search, setSearch] = useState(initialSearch);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (search) {
        params.set("search", search);
      } else {
        params.delete("search");
      }
      router.push(`/patients?${params.toString()}`);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [search, router, searchParams]);

  return (
    <div className="relative max-w-md w-full">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <Input
        type="text"
        placeholder="Search patients by name or phone..."
        className="pl-10 h-11 bg-white border-slate-200/60 shadow-sm focus-visible:ring-blue-500 rounded-lg"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
    </div>
  );
}
