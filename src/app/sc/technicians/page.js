"use client";
import { useState } from "react";
import { Users, UserPlus, TrendingUp, Clock, CheckCircle } from "lucide-react";

export default function Technicians() {
  const technicians = [
    {
      id: 1,
      name: "Engineer 1",
      status: "Busy",
      currentJobs: 2,
      completedToday: 3,
      utilization: 85,
      skills: ["Engine", "AC", "General"],
    },
    {
      id: 2,
      name: "Engineer 2",
      status: "Available",
      currentJobs: 1,
      completedToday: 2,
      utilization: 65,
      skills: ["Brakes", "Suspension"],
    },
  ];

  return (
    <div className="bg-[#f9f9fb] min-h-screen">
      <div className="pt-6 pb-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-blue-600 mb-2">Technicians</h1>
            <p className="text-gray-500">Manage service engineers and their assignments</p>
          </div>
          <button className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition shadow-md inline-flex items-center gap-2">
            <UserPlus size={20} />
            Add Technician
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {technicians.map((tech) => (
            <div key={tech.id} className="bg-white rounded-2xl shadow-md p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xl">
                  {tech.name.split(" ")[1] || "E"}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{tech.name}</p>
                  <p className="text-sm text-gray-600">{tech.status}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Current Jobs</span>
                  <span className="font-medium">{tech.currentJobs}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Completed Today</span>
                  <span className="font-medium">{tech.completedToday}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Utilization</span>
                  <span className="font-medium">{tech.utilization}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

