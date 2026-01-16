"use client";

import { useState, useEffect } from "react";
import {
  Settings as SettingsIcon,
  Mail,
  MessageSquare,
  Shield,
  Key,
  Database,
  Bell,
  Globe,
  Lock,
  Server,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  FileText,
  Upload,
} from "lucide-react";
import { systemSettingsService, SystemSetting } from "@/services/systemSettings.service";
import { uploadFile } from "@/services/upload.service";

type SettingCategory = "general" | "whatsapp" | "invoicing" | "email" | "sms" | "security" | "notifications" | "integrations" | "billing";

export default function SettingsPage() {
  const [activeCategory, setActiveCategory] = useState<SettingCategory>("general");
  const [settings, setSettings] = useState<Record<string, SystemSetting>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
    return () => {
      if (signaturePreview) {
        URL.revokeObjectURL(signaturePreview);
      }
    };
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await systemSettingsService.getAll();
      const settingsMap: Record<string, SystemSetting> = {};
      data.forEach(s => {
        settingsMap[s.key] = s;
      });
      setSettings(settingsMap);
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (key: string, value: string, category: string, description: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: { key, value, category, description }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Ensure we don't send any settings with null/undefined values
      const settingsToSave = Object.values(settings).map(s => ({
        ...s,
        value: s.value || "" // Ensure value is never null
      }));
      await systemSettingsService.save(settingsToSave);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Failed to save settings:", error);
      alert("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create and set local preview immediately
    const objectUrl = URL.createObjectURL(file);
    setSignaturePreview(objectUrl);

    setUploading(true);
    try {
      const result: any = await uploadFile(file, { folder: 'invoicing' });
      console.log('[SignatureUpload] Upload result:', JSON.stringify(result, null, 2));

      // Extract the URL from the wrapped response
      const uploadedUrl = result.data?.url || result.url;
      console.log('[SignatureUpload] Extracted URL:', uploadedUrl);

      // Update the setting in local state
      const updatedSettings = {
        ...settings,
        "invoices.signature_url": {
          key: "invoices.signature_url",
          value: uploadedUrl,
          category: "invoicing",
          description: "Admin Signature for Invoices/Quotations"
        }
      };
      console.log('[SignatureUpload] Updated settings:', updatedSettings);
      setSettings(updatedSettings);

      // Immediately save to database
      const settingsToSave = Object.values(updatedSettings).map(s => ({
        ...s,
        value: s.value || ""
      }));

      console.log('[SignatureUpload] Saving settings to database:', settingsToSave);
      await systemSettingsService.save(settingsToSave);
      console.log('[SignatureUpload] Settings saved successfully');

      // Don't clear the preview - keep showing it so user can see the uploaded signature
      // URL.revokeObjectURL(objectUrl);
      // setSignaturePreview(null);

      alert("Signature uploaded and saved successfully!");
    } catch (error) {
      console.error("Failed to upload signature:", error);
      alert("Failed to upload signature");
      URL.revokeObjectURL(objectUrl);
      setSignaturePreview(null); // Clear preview on error
    } finally {
      setUploading(false);
    }
  };

  const categories = [
    { id: "general" as SettingCategory, label: "General", icon: Globe },
    { id: "whatsapp" as SettingCategory, label: "WhatsApp", icon: MessageSquare },
    { id: "invoicing" as SettingCategory, label: "Invoices & PDFs", icon: FileText },
  ];

  // Helper to get value safely
  const getValue = (key: string, defaultVal: string = "") => settings[key]?.value || defaultVal;

  const renderContent = () => {
    switch (activeCategory) {
      case "general":
        return (
          <div className="space-y-4">
            <div className="border-b border-gray-200 pb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Application Name
              </label>
              <input
                type="text"
                value={getValue("app.name", "DMS System")}
                onChange={(e) => handleSettingChange("app.name", e.target.value, "general", "Application Name")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        );
      case "whatsapp":
        return (
          <div className="space-y-4">
            <div className="border-b border-gray-200 pb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quotation Sharing Message Template
              </label>
              <p className="text-xs text-gray-500 mb-2">Available variables: {'{quotationNumber}'}, {'{totalAmount}'}, {'{link}'}</p>
              <textarea
                rows={6}
                value={getValue("whatsapp.quotation_template", "Quotation {quotationNumber}\nTotal: ₹{totalAmount}\n\nView and confirm: {link}")}
                onChange={(e) => handleSettingChange("whatsapp.quotation_template", e.target.value, "whatsapp", "Quotation Sharing Message Template")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono text-sm"
              />
            </div>
          </div>
        );
      case "invoicing":
        return (
          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Authorized Signature Image
              </label>
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <p className="text-sm text-gray-500 mb-2">Upload a transparent PNG signature to be displayed on Invoices and Quotations.</p>
                  <label className={`inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${uploading ? 'opacity-75 cursor-not-allowed' : ''}`}>
                    {uploading ? (
                      <RefreshCw size={16} className="animate-spin text-indigo-600" />
                    ) : (
                      <Upload size={16} className="text-gray-600" />
                    )}
                    <span className="text-gray-700 font-medium">{uploading ? "Uploading..." : "Upload Signature"}</span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/png,image/jpeg"
                      onChange={handleSignatureUpload}
                      disabled={uploading}
                    />
                  </label>
                  <p className="text-xs text-gray-400 mt-2">Recommended size: 300x150px (PNG)</p>
                </div>
                {(signaturePreview || getValue("invoices.signature_url")) && (
                  <div className="flex flex-col items-center">
                    <p className="text-xs font-medium text-gray-500 mb-2">Current Signature</p>
                    <div className="p-2 border border-gray-200 rounded-lg bg-gray-50 shadow-sm">
                      <img
                        src={signaturePreview || getValue("invoices.signature_url")}
                        alt="Signature Preview"
                        className="h-24 w-auto object-contain bg-white rounded border border-gray-100"
                      />
                    </div>
                    <button
                      onClick={() => {
                        handleSettingChange("invoices.signature_url", "", "invoicing", "Admin Signature");
                        setSignaturePreview(null);
                      }}
                      className="text-xs text-red-600 mt-2 hover:text-red-800 hover:underline transition-colors"
                    >
                      Remove Signature
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      default:
        return <p className="text-gray-500">Select a category to view settings.</p>;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-gray-50">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 mb-2">System Settings</h1>
        <p className="text-gray-600">Configure application settings and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="font-semibold text-gray-800 mb-3">Categories</h2>
            <div className="space-y-1">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${activeCategory === category.id
                      ? "bg-indigo-600 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                      }`}
                  >
                    <Icon size={18} />
                    <span>{category.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800">
                {categories.find((c) => c.id === activeCategory)?.label} Settings
              </h2>
              <button
                onClick={handleSave}
                disabled={saving || loading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Saving...
                  </>
                ) : saved ? (
                  <>
                    <CheckCircle size={16} />
                    Saved!
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Save Changes
                  </>
                )}
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="animate-spin text-gray-400" size={32} />
              </div>
            ) : (
              renderContent()
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
