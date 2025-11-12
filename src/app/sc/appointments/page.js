"use client";
import { useState } from "react";
import { Calendar, Clock, User, Car, PlusCircle, Search, Filter } from "lucide-react";

export default function Appointments() {
  const [view, setView] = useState("calendar"); // calendar, list
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

  const appointments = [
    {
      id: 1,
      customerName: "Rajesh Kumar",
      vehicle: "Honda City",
      phone: "9876543210",
      serviceType: "Routine Maintenance",
      date: "2025-01-20",
      time: "10:00 AM",
      duration: "2 hours",
      status: "Confirmed",
    },
    {
      id: 2,
      customerName: "Priya Sharma",
      vehicle: "Maruti Swift",
      phone: "9876543211",
      serviceType: "AC Repair",
      date: "2025-01-20",
      time: "2:00 PM",
      duration: "3 hours",
      status: "Confirmed",
    },
  ];

  return (
    <div className="bg-[#f9f9fb] min-h-screen">
      <div className="pt-6 pb-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-blue-600 mb-2">Appointments</h1>
            <p className="text-gray-500">Schedule and manage customer appointments</p>
          </div>
          <button className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition shadow-md inline-flex items-center gap-2">
            <PlusCircle size={20} />
            New Appointment
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {appointments.map((apt) => (
              <div key={apt.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock size={16} className="text-blue-600" />
                  <span className="font-semibold text-sm">{apt.time}</span>
                </div>
                <p className="font-medium text-gray-800 text-sm">{apt.customerName}</p>
                <p className="text-xs text-gray-600">{apt.vehicle}</p>
                <p className="text-xs text-gray-500 mt-1">{apt.serviceType}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

