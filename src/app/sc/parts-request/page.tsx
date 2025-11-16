"use client";
import { Package, PlusCircle, CheckCircle } from "lucide-react";

export default function PartsRequest() {
  return (
    <div className="bg-[#f9f9fb] min-h-screen">
      <div className="pt-6 pb-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">Parts Request</h1>
          <p className="text-gray-500">Request parts for your assigned jobs</p>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6">
          <p className="text-gray-600">Request parts for your active job cards here.</p>
        </div>
      </div>
    </div>
  );
}

