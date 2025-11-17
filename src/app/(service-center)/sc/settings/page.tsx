"use client";
import { Settings as SettingsIcon, Building, Clock, Mail } from "lucide-react";

export default function Settings() {
  return (
    <div className="bg-[#f9f9fb] min-h-screen">
      <div className="pt-6 pb-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">Settings</h1>
          <p className="text-gray-500">Configure service center settings</p>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Building className="text-blue-600" size={24} />
              Service Center Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Center Name</label>
                <input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg" defaultValue="Pune Phase 1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg" defaultValue="123 Main Street, Pune" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Clock className="text-purple-600" size={24} />
              Operating Hours
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Opening Time</label>
                  <input type="time" className="w-full px-4 py-2 border border-gray-300 rounded-lg" defaultValue="09:00" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Closing Time</label>
                  <input type="time" className="w-full px-4 py-2 border border-gray-300 rounded-lg" defaultValue="18:00" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

