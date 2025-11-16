"use client";
import { FileText, Download, TrendingUp, BarChart3 } from "lucide-react";

interface Report {
  id: number;
  name: string;
  type: string;
}

export default function Reports() {
  const reports: Report[] = [
    { id: 1, name: "Daily Sales Summary", type: "Financial" },
    { id: 2, name: "Service Volume Report", type: "Operational" },
    { id: 3, name: "Technician Performance", type: "Performance" },
    { id: 4, name: "Inventory Report", type: "Inventory" },
  ];

  return (
    <div className="bg-[#f9f9fb] min-h-screen">
      <div className="pt-6 pb-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">Reports</h1>
          <p className="text-gray-500">Generate and view service center reports</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => (
            <div key={report.id} className="bg-white rounded-2xl shadow-md p-6">
              <FileText className="text-blue-600 mb-3" size={32} />
              <h3 className="font-semibold text-gray-800 mb-1">{report.name}</h3>
              <p className="text-sm text-gray-600 mb-4">{report.type}</p>
              <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                Generate Report
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

