# DMS Visual Process Flow
## User-Friendly Service Journey

**Last Updated:** January 16, 2026

---

## 🎯 Complete Service Journey - Visual Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CUSTOMER SERVICE JOURNEY                         │
│                    From Call to Completion                          │
└─────────────────────────────────────────────────────────────────────┘

┌───────────┐
│  STEP 1   │  📞 CUSTOMER CALLS OR WALKS IN
└─────┬─────┘
      │
      ▼
┌──────────────────────────────────────────────────────────┐
│  APPOINTMENT BOOKING                                     │
│  ─────────────────────────────────────────────────────  │
│  👤 Who: Call Center Agent OR Service Advisor           │
│  📋 What: Book appointment, select service type         │
│  ⏱️  Time: 5 minutes                                     │
│                                                          │
│  Actions:                                                │
│  ✓ Search/Create customer                               │
│  ✓ Select vehicle                                        │
│  ✓ Choose date & time                                    │
│  ✓ Select service center (if call center)               │
│  ✓ Enter customer complaint                             │
│  ✓ Choose location (Station/Home)                       │
│                                                          │
│  Output: APPOINTMENT CREATED ✅                          │
│  Status: "Confirmed"                                     │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌───────────┐
│  STEP 2   │  🚗 CUSTOMER ARRIVES WITH VEHICLE
└─────┬─────┘
      │
      ▼
┌──────────────────────────────────────────────────────────┐
│  CUSTOMER ARRIVAL & INSPECTION                           │
│  ─────────────────────────────────────────────────────  │
│  👤 Who: Service Advisor                                 │
│  📋 What: Welcome customer, inspect vehicle              │
│  ⏱️  Time: 15-20 minutes                                 │
│                                                          │
│  Actions:                                                │
│  ✓ Choose arrival mode:                                 │
│    • Vehicle Present → Generate check-in slip           │
│    • Vehicle Absent → Schedule pickup                   │
│    • Check-in Only → Quick inspection                   │
│  ✓ Complete Service Intake Form (PART 1):               │
│    • Customer feedback/concerns (required)              │
│    • Technician observation                             │
│    • Insurance details                                   │
│    • Serial numbers (Battery, MCU, VCU)                 │
│    • Estimated delivery date                            │
│  ✓ Upload documents (ID, RC, photos)                    │
│  ✓ Print check-in slip for customer                     │
│                                                          │
│  Output: SERVICE INTAKE COMPLETE ✅                      │
│  Status: "In Progress"                                   │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌───────────┐
│  STEP 3   │  💰 CREATE QUOTATION
└─────┬─────┘
      │
      ▼
┌──────────────────────────────────────────────────────────┐
│  QUOTATION PREPARATION                                   │
│  ─────────────────────────────────────────────────────  │
│  👤 Who: Service Advisor                                 │
│  📋 What: List all parts & work needed with prices       │
│  ⏱️  Time: 10-15 minutes                                 │
│                                                          │
│  Actions:                                                │
│  ✓ Click "Create Quotation" from appointment            │
│  ✓ Add service items:                                   │
│    For Each Item:                                        │
│    • Part name                                           │
│    • Part number                                         │
│    • Quantity                                            │
│    • Unit price (before GST)                             │
│    • GST percentage                                      │
│    • Labour code (if applicable)                        │
│  ✓ Add discounts (if any)                               │
│  ✓ Add service notes & recommendations                  │
│  ✓ Review total calculation:                            │
│    • Subtotal                                            │
│    • Discount                                            │
│    • GST (CGST+SGST or IGST)                            │
│    • Total Amount                                        │
│  ✓ Save as Draft                                         │
│  ✓ Click "Send to Customer"                             │
│                                                          │
│  Output: QUOTATION SENT ✅                               │
│  Status: "Sent to Customer"                              │
│  Customer receives: WhatsApp/Email with quotation link  │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌───────────────────────────────────────────┐
│  ⏳ WAITING FOR CUSTOMER RESPONSE          │
│  Customer reviews quotation               │
│  Typically: Few hours to 1 day            │
└──────┬───────────────────┬────────────────┘
       │                   │
       │                   └─────────────────┐
       │                                     │
       ▼                                     ▼
┌─────────────────┐              ┌─────────────────────┐
│ ✅ APPROVED      │              │ ❌ REJECTED         │
│ Continue below  │              │ Service Advisor     │
└────────┬────────┘              │ follows up          │
         │                       │ Modify & Re-send    │
         │                       └─────────────────────┘
         ▼
┌───────────┐
│  STEP 4   │  ✅ QUOTATION APPROVED
└─────┬─────┘
      │
      ▼
┌──────────────────────────────────────────────────────────┐
│  AUTOMATIC JOB CARD CREATION                             │
│  ─────────────────────────────────────────────────────  │
│  🤖 What: System automatically creates job card          │
│  ⏱️  Time: Instant                                       │
│                                                          │
│  What Happens:                                           │
│  ✓ Job Card Number generated: SC001-2026-01-0001        │
│  ✓ All quotation items copied to job card               │
│  ✓ Service details linked:                              │
│    • Customer info (PART 1)                              │
│    • Parts & work list (PART 2)                         │
│    • Appointment details                                 │
│    • Quotation reference                                 │
│                                                          │
│  Output: JOB CARD CREATED ✅                             │
│  Status: "Created" (waiting manager approval)            │
│  Service Manager receives notification                   │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌───────────┐
│  STEP 5   │  👔 MANAGER REVIEWS & ASSIGNS
└─────┬─────┘
      │
      ▼
┌──────────────────────────────────────────────────────────┐
│  MANAGER APPROVAL & TECHNICIAN ASSIGNMENT                │
│  ─────────────────────────────────────────────────────  │
│  👤 Who: Service Manager                                 │
│  📋 What: Review work scope, assign technician           │
│  ⏱️  Time: 5-10 minutes                                  │
│                                                          │
│  Actions:                                                │
│  ✓ View pending job cards                               │
│  ✓ Review details:                                       │
│    • Customer complaints                                 │
│    • Approved quotation items                            │
│    • Parts needed                                        │
│    • Estimated time                                      │
│  ✓ Choose technician from list                          │
│    (Based on expertise and current workload)             │
│  ✓ Click "Assign Engineer"                              │
│                                                          │
│  Output: WORK ASSIGNED ✅                                │
│  Status: "Assigned"                                      │
│  Technician receives notification                        │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌───────────┐
│  STEP 6   │  🔧 TECHNICIAN WORKS ON VEHICLE
└─────┬─────┘
      │
      ▼
┌──────────────────────────────────────────────────────────┐
│  SERVICE WORK EXECUTION                                  │
│  ─────────────────────────────────────────────────────  │
│  👤 Who: Technician/Engineer                             │
│  📋 What: Complete service as per job card               │
│  ⏱️  Time: Varies (few hours to 2-3 days)                │
│                                                          │
│  Flow:                                                   │
│  ┌──────────────────────────────────────────┐           │
│  │ 1. View My Assigned Jobs                 │           │
│  │    Status auto-changes to "In Progress"  │           │
│  └────────────┬─────────────────────────────┘           │
│               │                                          │
│               ▼                                          │
│  ┌──────────────────────────────────────────┐           │
│  │ 2. Check Parts Needed                    │           │
│  └────────┬─────────────┬────────────────────┘          │
│           │             │                                │
│   Parts   │             │ No Parts                       │
│   Needed  │             │ Needed                         │
│           ▼             ▼                                │
│  ┌────────────┐  ┌─────────────┐                        │
│  │ Request    │  │ Start Work  │                        │
│  │ Parts      │  │ Immediately │                        │
│  └─────┬──────┘  └─────┬───────┘                        │
│        │               │                                 │
│        ▼               │                                 │
│  ┌────────────────────┬┘                                │
│  │ Wait for Parts:    │                                 │
│  │ • Manager approves │                                 │
│  │ • Inv. Mgr assigns │                                 │
│  │ Status: "Parts     │                                 │
│  │   Pending"         │                                 │
│  └────────┬───────────┘                                 │
│           │                                              │
│           ▼                                              │
│  ┌──────────────────────────────────────────┐           │
│  │ 3. Perform Service Work                  │           │
│  │    • Follow job card instructions         │          │
│  │    • Complete all approved items          │          │
│  │    • Test vehicle functionality           │          │
│  │    • Add technical notes                  │          │
│  └────────────┬─────────────────────────────┘           │
│               │                                          │
│               ▼                                          │
│  ┌──────────────────────────────────────────┐           │
│  │ 4. Mark as Complete                      │           │
│  │    • Add completion notes                 │          │
│  │    • Upload photos (if needed)            │          │
│  │    • Click "Mark as Complete"             │          │
│  └──────────────────────────────────────────┘           │
│                                                          │
│  Output: SERVICE COMPLETED ✅                            │
│  Status: "Completed"                                     │
│  Service Manager & Advisor receive notification          │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌───────────┐
│  STEP 7   │  📄 GENERATE INVOICE
└─────┬─────┘
      │
      ▼
┌──────────────────────────────────────────────────────────┐
│  INVOICE GENERATION                                      │
│  ─────────────────────────────────────────────────────  │
│  👤 Who: Service Advisor OR Finance Manager              │
│  📋 What: Create final bill for customer                 │
│  ⏱️  Time: 5-10 minutes                                  │
│                                                          │
│  Actions:                                                │
│  ✓ Open completed job card                              │
│  ✓ Click "Generate Invoice"                             │
│  ✓ System auto-creates invoice with:                    │
│    • All parts used (from quotation)                    │
│    • All work done (labour charges)                     │
│    • GST breakdown (CGST/SGST or IGST)                  │
│    • Total amount                                        │
│  ✓ Review invoice:                                       │
│    • Check items match work done                        │
│    • Verify amounts are correct                         │
│    • Add any adjustments if needed                      │
│  ✓ Save invoice                                          │
│  ✓ Click "Send to Customer"                             │
│    • Customer receives via WhatsApp/Email               │
│  ✓ Print invoice copy                                    │
│                                                          │
│  Output: INVOICE CREATED ✅                              │
│  Status: "Unpaid" (waiting payment)                      │
│  Job Card Status: "Invoiced"                             │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌───────────┐
│  STEP 8   │  💵 PAYMENT & VEHICLE DELIVERY
└─────┬─────┘
      │
      ▼
┌──────────────────────────────────────────────────────────┐
│  FINAL DELIVERY                                          │
│  ─────────────────────────────────────────────────────  │
│  👤 Who: Service Advisor OR Cashier                      │
│  📋 What: Accept payment, deliver vehicle                │
│  ⏱️  Time: 10 minutes                                    │
│                                                          │
│  Actions:                                                │
│  ✓ Customer arrives for pickup                          │
│  ✓ Accept payment:                                       │
│    • Cash / Card / UPI / Bank Transfer                  │
│  ✓ Update invoice:                                       │
│    • Mark payment method                                 │
│    • Change status to "Paid"                             │
│    • Record payment date & time                          │
│  ✓ Deliver to customer:                                  │
│    • Vehicle keys                                        │
│    • Invoice copy                                        │
│    • Warranty documents (if any)                         │
│    • Service checklist                                   │
│  ✓ Final status update:                                  │
│    • Job Card: "Delivered"                               │
│    • Vehicle service history updated                     │
│    • Customer record updated                             │
│                                                          │
│  Output: SERVICE COMPLETE! 🎉                            │
│  Happy customer drives away! 🚗✨                         │
└──────────────────────────────────────────────────────────┘
```

---

## 📊 Alternative Flows & Special Cases

### Flow A: Customer Rejects Quotation

```
Customer Rejects
       │
       ▼
┌──────────────────┐
│ Service Advisor  │
│ Calls Customer   │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────┐
│ Understand Concerns:     │
│ • Too expensive?         │
│ • Don't need all items?  │
│ • Want second opinion?   │
└────────┬─────────────────┘
         │
         ▼
    ┌───┴───┐
    │Revise?│
    └───┬───┘
        │
   ┌────┴────┐
   │         │
  Yes       No
   │         │
   ▼         ▼
Create    Convert to
Revised   "Lead" for
Quotation Future
   │      Follow-up
   │
   └─→ Send to Customer Again
```

---

### Flow B: Parts Not in Stock

```
Technician Requests Parts
          │
          ▼
┌────────────────────────┐
│ Inventory Manager      │
│ Checks Stock           │
└────────┬───────────────┘
         │
    ┌────┴────┐
    │ Stock?  │
    └────┬────┘
         │
   ┌─────┴─────┐
   │           │
  Yes         No
   │           │
   ▼           ▼
Assign    ┌─────────────────┐
Parts     │ Create Purchase  │
  │       │ Order to Central │
  │       │ Inventory        │
  │       └────────┬─────────┘
  │                │
  │                ▼
  │       ┌─────────────────┐
  │       │ Wait 1-2 Days   │
  │       │ for Parts       │
  │       └────────┬─────────┘
  │                │
  │                ▼
  │       ┌─────────────────┐
  │       │ Inform Customer │
  │       │ of Delay        │
  │       └────────┬─────────┘
  │                │
  │                ▼
  │       ┌─────────────────┐
  │       │ Parts Arrive    │
  │       └────────┬─────────┘
  │                │
  └────────────────┘
          │
          ▼
   Technician Continues Work
```

---

### Flow C: Additional Work Found

```
Technician Working
         │
         ▼
┌──────────────────────────┐
│ Found Additional Issues  │
│ (e.g., worn brake rotor) │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│ Add Notes to Job Card    │
│ Stop Work on New Item    │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│ Service Advisor Notified │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│ Create REVISED QUOTATION │
│ With Additional Items    │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│ Send to Customer         │
│ for Approval             │
└────────┬─────────────────┘
         │
    ┌────┴────┐
    │Customer?│
    └────┬────┘
         │
   ┌─────┴─────┐
   │           │
Approve     Reject
   │           │
   ▼           ▼
Continue   Complete
All Work   Original
           Work Only
```

---

### Flow D: Home Service (Pickup & Drop)

```
Customer Selects "Home Service"
          │
          ▼
┌────────────────────────────┐
│ APPOINTMENT                │
│ Location: Doorstep         │
│ Pickup Address Required    │
└────────┬───────────────────┘
         │
         ▼
┌────────────────────────────┐
│ PICKUP                     │
│ Driver goes to customer    │
│ Collects vehicle           │
│ Status: "Vehicle Picked Up"│
└────────┬───────────────────┘
         │
         ▼
┌────────────────────────────┐
│ ARRIVAL AT CENTER          │
│ Service Intake starts      │
│ (Normal flow continues)    │
└────────┬───────────────────┘
         │
         ▼
┌────────────────────────────┐
│ SERVICE PROCESS            │
│ (Steps 3-7 as normal)      │
└────────┬───────────────────┘
         │
         ▼
┌────────────────────────────┐
│ DELIVERY                   │
│ After payment confirmed:   │
│ • Driver delivers vehicle  │
│ • Customer receives at home│
│ Status: "Delivered"        │
└────────────────────────────┘
```

---

## 🔍 Status Progression Chart

### Appointment Journey
```
Pending → Confirmed → In Progress → Quotation Created → Completed
                                           ↓
                                      OR: Cancelled
```

### Job Card Journey
```
Created → Assigned → In Progress → Completed → Invoiced
                         ↓              ↑
                   Parts Pending ──────┘
```

### Quotation Journey
```
Draft → Sent to Customer → Customer Approved → (Job Card Created)
                               ↓
                          OR: Customer Rejected → (Follow up/Lead)
```

### Invoice Journey
```
Unpaid → Paid → (Service Complete!)
```

---

## ⏱️ Typical Timeline

### Quick Service (Oil Change, Minor Work)
```
Day 1:
  09:00 AM - Customer arrives
  09:15 AM - Service intake complete
  09:30 AM - Quotation created & sent
  10:00 AM - Customer approves
  10:05 AM - Work assigned to technician
  10:30 AM - Work starts
  11:30 AM - Work completed
  12:00 PM - Invoice generated
  02:00 PM - Customer picks up & pays

Total Time: ~5 hours ✅
```

### Medium Service (Battery Replacement, Multiple Parts)
```
Day 1:
  09:00 AM - Customer arrives
  09:30 AM - Service intake & inspection
  10:00 AM - Quotation created & sent
  02:00 PM - Customer approves (after thinking)
  02:30 PM - Work assigned
  03:00 PM - Parts requested
  
Day 2:
  10:00 AM - Parts approved & assigned
  10:30 AM - Work starts
  03:00 PM - Work completed & tested
  03:30 PM - Invoice generated
  05:00 PM - Customer picks up & pays

Total Time: ~2 days ✅
```

### Major Service (Multiple Components, Warranty Work)
```
Day 1:
  10:00 AM - Customer arrives
  10:45 AM - Detailed inspection & documentation
  12:00 PM - Quotation prepared
  02:00 PM - Customer approves
  02:30 PM - Manager reviews (high value)
  03:00 PM - Work assigned
  03:30 PM - Parts requested
  
Day 2:
  09:00 AM - Parts approval process
  (Waiting for central inventory)
  
Day 3:
  11:00 AM - Parts arrive & assigned
  11:30 AM - Work starts
  
Day 4:
  04:00 PM - Work completed
  04:30 PM - Manager quality check
  05:00 PM - Invoice generated
  
Day 5:
  10:00 AM - Customer picks up & pays

Total Time: ~5 days ✅
```

---

## 💡 Key Takeaways

### For Users:
1. **Each step has a clear owner** - Know whose responsibility each action is
2. **Status changes guide the flow** - Always check current status to know next action
3. **Communication is key** - Keep customer informed at every major step
4. **System auto-creates when possible** - Job cards and invoices auto-generate to save time
5. **Approvals prevent mistakes** - Manager reviews ensure quality and accuracy

### For Customers:
1. **Transparent pricing** - See detailed quotation before work begins
2. **Approval required** - Work never starts without customer approval
3. **Real-time updates** - Receive notifications at each step
4. **Clear timeline** - Know when vehicle will be ready
5. **Complete documentation** - All work is documented and tracked

---

**Document Created:** January 16, 2026  
**Purpose:** Visual guide to understand the complete DMS workflow  
**Audience:** All DMS users, trainers, and stakeholders
