"use client";
import { useState } from "react";
import { usePartsApproval } from "@/shared/hooks/usePartsApproval";
import { useRole } from "@/shared/hooks";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CheckCircle, XCircle, Package, AlertCircle } from "lucide-react";
import type { JobCardPartsRequest } from "@/shared/types/jobcard-inventory.types";

export default function ApprovalsPage() {
  const { pendingRequests, isLoading, approve, reject } = usePartsApproval();
  const { userInfo } = useRole();
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApprove = async (id: string) => {
    try {
      setIsProcessing(true);
      await approve(id, userInfo?.name || "Inventory Manager", notes || undefined);
      setSelectedRequest(null);
      setNotes("");
    } catch (error) {
      console.error("Failed to approve:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (id: string) => {
    try {
      setIsProcessing(true);
      await reject(id, userInfo?.name || "Inventory Manager", notes || undefined);
      setSelectedRequest(null);
      setNotes("");
    } catch (error) {
      console.error("Failed to reject:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-[#f9f9fb] min-h-screen pt-24 px-8 pb-10">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-[#f9f9fb] min-h-screen">
      <div className="pt-24 px-8 pb-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-indigo-600">Parts Approval Requests</h1>
          <p className="text-gray-500 mt-1">Review and approve parts requests from job cards</p>
        </div>

        {pendingRequests.length === 0 ? (
          <Card>
            <CardBody>
              <div className="text-center py-12">
                <CheckCircle className="mx-auto text-green-500 mb-4" size={48} />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Pending Requests</h3>
                <p className="text-gray-600">All parts requests have been processed.</p>
              </div>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-4">
            {pendingRequests.map((request) => (
              <Card key={request.id} className="border-l-4 border-l-orange-500">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Job Card: {request.jobCardId}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Vehicle: {request.vehicleNumber || request.vehicleId} | Customer: {request.customerName || "N/A"}
                      </p>
                    </div>
                    <Badge variant="warning">Pending</Badge>
                  </div>
                </CardHeader>
                <CardBody>
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Package size={16} />
                      Required Parts:
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      {request.parts.map((part, idx) => (
                        <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-0">
                          <div>
                            <p className="font-medium text-gray-900">{part.partName}</p>
                            <p className="text-sm text-gray-600">Part ID: {part.partId}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">Qty: {part.quantity}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedRequest === request.id ? (
                    <div className="border-t pt-4 mt-4">
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add notes (optional)..."
                        className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        rows={3}
                      />
                      <div className="flex gap-3">
                        <Button
                          onClick={() => handleApprove(request.id)}
                          disabled={isProcessing}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle size={16} className="mr-2" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => handleReject(request.id)}
                          disabled={isProcessing}
                          variant="outline"
                          className="border-red-500 text-red-600 hover:bg-red-50"
                        >
                          <XCircle size={16} className="mr-2" />
                          Reject
                        </Button>
                        <Button
                          onClick={() => {
                            setSelectedRequest(null);
                            setNotes("");
                          }}
                          variant="outline"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <Button
                        onClick={() => setSelectedRequest(request.id)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                      >
                        Review Request
                      </Button>
                    </div>
                  )}
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

