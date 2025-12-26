import type { Insurer, NoteTemplate } from "@/shared/types";

export const defaultInsurers: Insurer[] = [
    {
        id: "ins-001",
        name: "Bajaj Finance",
        address: "Pune, Maharashtra",
        gstNumber: "27AABCU9603R1ZM",
        phone: "1800-123-456",
        email: "support@bajajfinance.com",
        isActive: true,
    },
    {
        id: "ins-002",
        name: "HDFC Ergo",
        address: "Mumbai, Maharashtra",
        gstNumber: "27AAACH1234R1Z5",
        phone: "1800-202-2020",
        email: "support@hdfcergo.com",
        isActive: true,
    },
    {
        id: "ins-003",
        name: "ICICI Lombard",
        address: "Mumbai, Maharashtra",
        gstNumber: "27AAACI1234R1Z6",
        phone: "1800-266-266",
        email: "support@icicilombard.com",
        isActive: true,
    },
];

export const defaultNoteTemplates: NoteTemplate[] = [
    {
        id: "template-001",
        name: "Battery Replacement",
        content: "Battery replacement service. If battery is not recoverable, you need to pay in full. Battery serial number: {batterySerialNumber}",
        category: "battery",
        isActive: true,
    },
    {
        id: "template-002",
        name: "General Service",
        content: "Regular maintenance service. All parts are subject to availability. Estimated completion time: 2-3 hours.",
        category: "general",
        isActive: true,
    },
    {
        id: "template-003",
        name: "Warranty Service",
        content: "Service covered under warranty. No charges applicable if issue is covered under warranty terms.",
        category: "warranty",
        isActive: true,
    },
];
