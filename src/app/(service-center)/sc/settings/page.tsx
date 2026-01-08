"use client";
import { useState, useEffect } from "react";
import { Building, Clock, Calendar, Save, Loader2, AlertCircle } from "lucide-react";
import { getServiceCenterContext } from "@/shared/lib/serviceCenter";
import { serviceCenterService } from "@/features/service-centers/services/service-center.service";
import { apiClient } from "@/core/api/client";
import { useToast } from "@/contexts/ToastContext";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { ServiceCenter } from "@/shared/types/service-center.types";

export default function Settings() {
  const { showSuccess, showError } = useToast();
  const context = getServiceCenterContext();
  const serviceCenterId = context.serviceCenterId;
  const serviceCenterName = context.serviceCenterName || "Service Center";

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [serviceCenter, setServiceCenter] = useState<ServiceCenter | null>(null);
  const [maxAppointmentsPerDay, setMaxAppointmentsPerDay] = useState<number>(20);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (serviceCenterId) {
      fetchServiceCenterData();
    } else {
      setIsLoading(false);
    }
  }, [serviceCenterId]);

  const fetchServiceCenterData = async () => {
    try {
      setIsLoading(true);
      const sc = await serviceCenterService.getById(serviceCenterId!);
      setServiceCenter(sc);
      setMaxAppointmentsPerDay(sc.maxAppointmentsPerDay || 20);
    } catch (error: any) {
      console.error("Error fetching service center data:", error);
      showError(error?.message || "Failed to load service center settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMaxAppointmentsChange = (value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue > 0) {
      setMaxAppointmentsPerDay(numValue);
      setHasChanges(numValue !== (serviceCenter?.maxAppointmentsPerDay || 20));
    } else if (value === "") {
      setMaxAppointmentsPerDay(0);
      setHasChanges(true);
    }
  };

  const handleSaveAppointmentSettings = async () => {
    if (!serviceCenterId) {
      showError("Service center information not available");
      return;
    }

    if (maxAppointmentsPerDay <= 0) {
      showError("Maximum appointments per day must be greater than 0");
      return;
    }

    try {
      setIsSaving(true);
      
      // Use the new appointment-settings endpoint
      await apiClient.patch(`/service-centers/${serviceCenterId}/appointment-settings`, {
        maxAppointmentsPerDay: maxAppointmentsPerDay,
      });

      // Refresh service center data
      await fetchServiceCenterData();
      setHasChanges(false);
      showSuccess("Appointment settings saved successfully!");
    } catch (error: any) {
      console.error("Error saving appointment settings:", error);
      showError(error?.message || "Failed to save appointment settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-[#f9f9fb] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-blue-600 w-8 h-8 mx-auto mb-4" />
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!serviceCenterId) {
    return (
      <div className="bg-[#f9f9fb] min-h-screen">
        <div className="pt-6 pb-10 px-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-2">
            <AlertCircle className="text-yellow-600" size={20} />
            <p className="text-yellow-800">Service center information not available. Please ensure you are logged in as a service center manager.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f9f9fb] min-h-screen">
      <div className="pt-6 pb-10 px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">Settings</h1>
          <p className="text-gray-500">Configure service center settings for {serviceCenterName}</p>
        </div>

        <div className="space-y-6">
          {/* Service Center Information */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <Building className="text-blue-600" size={24} />
                Service Center Information
              </h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service Center Name</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50" 
                    value={serviceCenter?.name || ""}
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service Center Code</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50" 
                    value={serviceCenter?.code || ""}
                    disabled
                  />
                </div>
                {serviceCenter?.address && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <textarea 
                      rows={3} 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50" 
                      value={serviceCenter.address}
                      disabled
                    />
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Appointment Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <Calendar className="text-purple-600" size={24} />
                  Appointment Settings
                </h2>
                {hasChanges && (
                  <Badge variant="warning" className="bg-yellow-100 text-yellow-800">
                    Unsaved changes
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Appointments Per Day
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={maxAppointmentsPerDay || ""}
                      onChange={(e) => handleMaxAppointmentsChange(e.target.value)}
                      className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="20"
                    />
                    <span className="text-sm text-gray-600">
                      appointments per day
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Set the maximum number of appointments that can be scheduled per day for this service center.
                    This limit helps manage capacity and prevents overbooking.
                  </p>
                  {serviceCenter?.maxAppointmentsPerDay && (
                    <p className="text-xs text-blue-600 mt-1">
                      Current limit: {serviceCenter.maxAppointmentsPerDay} appointments per day
                    </p>
                  )}
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    onClick={handleSaveAppointmentSettings}
                    disabled={isSaving || !hasChanges}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="animate-spin mr-2" size={16} />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2" size={16} />
                        Save Appointment Settings
                      </>
                    )}
                  </Button>
                  {hasChanges && (
                    <Button
                      onClick={() => {
                        setMaxAppointmentsPerDay(serviceCenter?.maxAppointmentsPerDay || 20);
                        setHasChanges(false);
                      }}
                      disabled={isSaving}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-800"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Operating Hours (Read-only for now) */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <Clock className="text-purple-600" size={24} />
                Operating Hours
              </h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Opening Time</label>
                    <input 
                      type="time" 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50" 
                      defaultValue="09:00"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Closing Time</label>
                    <input 
                      type="time" 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50" 
                      defaultValue="18:00"
                      disabled
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Operating hours configuration coming soon.
                </p>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
