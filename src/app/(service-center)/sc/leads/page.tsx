"use client";
import { Users, PlusCircle } from "lucide-react";

export default function Leads() {
  return (
    <div className="bg-[#f9f9fb] min-h-screen">
      <div className="pt-6 pb-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-blue-600 mb-2">Leads</h1>
            <p className="text-gray-500">Manage customer leads and follow-ups</p>
          </div>
          <button className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition shadow-md inline-flex items-center gap-2">
            <PlusCircle size={20} />
            Add Lead
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6">
          <p className="text-gray-600">Lead management functionality will be available here.</p>
        </div>
      </div>
    </div>
  );
}

