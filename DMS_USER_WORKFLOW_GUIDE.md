# DMS User Workflow Guide
## Complete Customer Service Journey

**Document Version:** 1.0  
**Last Updated:** January 16, 2026  
**Purpose:** User-friendly guide for all DMS users

---

## Table of Contents

1. [Overview](#overview)
2. [User Roles](#user-roles)
3. [Complete Service Journey](#complete-service-journey)
4. [Detailed User Workflows](#detailed-user-workflows)
5. [Common Scenarios](#common-scenarios)
6. [Tips & Best Practices](#tips--best-practices)

---

## Overview

The DMS (Dealer Management System) helps manage the complete customer service experience from booking an appointment to final payment. This guide explains **what users do**, **not how the system works technically**.

---

## User Roles

### 👥 Who Uses the System?

| Role | What They Do |
|------|--------------|
| **Service Advisor** | First point of contact: Creates appointments, welcomes customers, creates quotations |
| **Service Manager** | Approves quotations, assigns technicians, oversees service quality |
| **Technician/Engineer** | Works on vehicles, requests parts, completes service work |
| **Service Center Inventory Manager** | Manages parts stock, assigns parts to technicians |
| **Finance Manager** | Handles invoicing and payments |
| **Call Center Agent** | Books appointments over phone for customers |
| **Admin** | Manages users, service centers, and system settings |

---

## Complete Service Journey

### 📋 The Big Picture

```
Customer Calls → Appointment Booked → Customer Arrives → Inspection → 
Quotation Created → Customer Approves → Work Assigned → Technician Works → 
Work Completed → Invoice Generated → Payment → Customer Leaves Happy!
```

**Average Time:** 1-3 days (depending on service type)

---

## Detailed User Workflows

### 1️⃣ **BOOKING AN APPOINTMENT**

**Who:** Call Center Agent OR Service Advisor OR Customer (walk-in)

#### Step-by-Step:

1. **Open Appointments Page**
   - Click "Appointments" in the main menu

2. **Click "New Appointment" Button**
   - Blue button at the top right

3. **Search for Customer**
   - Type customer name, phone number, or vehicle number
   - If customer is new, create a new customer record

4. **Fill in Appointment Details:**
   - **Customer Information:** Name, phone, address (auto-filled if existing customer)
   - **Vehicle Selection:** Choose which vehicle needs service
   - **Service Type:** Select from dropdown (Oil Change, Battery Check, General Service, etc.)
   - **Date & Time:** When the customer wants to bring the vehicle
   - **Service Center:** Which location will handle this (Call Center selects, others auto-fill)
   - **Customer Complaint:** What's the problem or requested service?
   - **Location:** At Station OR Home Service (pickup/drop)

5. **Save Appointment**
   - Appointment status: "Confirmed"
   - Customer receives confirmation (optional SMS/WhatsApp)

**🎯 Result:** Appointment is scheduled and visible to service center team

---

### 2️⃣ **CUSTOMER ARRIVES FOR SERVICE**

**Who:** Service Advisor

#### Step-by-Step:

1. **View Today's Appointments**
   - See list of customers scheduled for today
   - Find the arriving customer

2. **Click on the Appointment**
   - Appointment details modal opens

3. **Choose Vehicle Arrival Mode:**
   - **Option A: Vehicle Present** - Customer brought the vehicle
   - **Option B: Vehicle Absent** - Vehicle will be picked up later
   - **Option C: Check-in Only** - Customer just wants initial inspection

4. **Generate Check-In Slip (if vehicle present)**
   - System automatically creates check-in document
   - Includes: Customer details, vehicle details, current condition
   - Print and give to customer

5. **Complete Service Intake Form (PART 1):**
   
   **Auto-Filled Information:**
   - Customer name, phone, vehicle details
   
   **What You Fill In:**
   - **Customer Complaint/Concerns** (required): What the customer says is wrong
   - **Technician Observation**: What you see during initial inspection
   - **Insurance Details**: If applicable (company name, start/end dates)
   - **Serial Numbers**: Battery, MCU, VCU (if relevant)
   - **Estimated Delivery Date**: When service will be complete
   
   **Upload Documents (Optional):**
   - Customer ID proof
   - Vehicle RC copy
   - Warranty card
   - Photos of vehicle condition

6. **Save Service Intake**
   - Can save as draft and complete later
   - Or complete and continue to quotation

**🎯 Result:** Customer arrival is recorded, initial inspection is documented

---

### 3️⃣ **CREATING A QUOTATION**

**Who:** Service Advisor

#### Step-by-Step:

1. **Start Quotation from Appointment**
   - Click "Create Quotation" button in appointment details
   - Or go to Quotations page → New Quotation

2. **Customer & Vehicle Info Auto-Fills**
   - All details from appointment pre-filled

3. **Add Service Items (Parts & Work):**
   
   For Each Item:
   - **Part Name**: What part or service
   - **Part Number**: If known
   - **Quantity**: How many
   - **Unit Price**: Cost per item (before GST)
   - **GST %**: Usually 18% or 28%
   - **Labour Code**: Associated work (optional)

   **Example:**
   - Part: "Front Brake Pad" | Qty: 2 | Price: ₹1,500 each | GST: 28%
   - Work: "Brake Pad Replacement" | Qty: 1 | Price: ₹500 | GST: 18%

4. **Add Discount (if applicable)**
   - Enter amount or percentage

5. **Add Notes**
   - Service recommendations
   - Warranty information
   - Special instructions

6. **Review Total:**
   - Subtotal (before GST and discount)
   - Discount
   - GST (CGST + SGST or IGST)
   - **Total Amount**

7. **Save Quotation**
   - Status: "Draft" (you can edit later)

8. **Send to Customer**
   - Click "Send to Customer" button
   - Status changes to: "Sent to Customer"
   - Customer receives via WhatsApp/Email
   - Quotation link is sent for approval

**🎯 Result:** Customer receives quotation with detailed breakdown

---

### 4️⃣ **CUSTOMER APPROVES QUOTATION**

**Who:** Customer (via phone/WhatsApp)

#### What Happens:

1. **Customer Receives Quotation**
   - Views all items, prices, and total

2. **Customer Makes Decision:**
   - **Option A: Approve** → Service work can begin
   - **Option B: Reject** → Service advisor follows up
   - **Option C: Request Changes** → Service advisor modifies quotation

3. **If Approved:**
   - Service Advisor sees notification
   - Quotation status: "Customer Approved"
   - **Job Card is automatically created**

**🎯 Result:** Job Card is created with approved scope and budget

---

### 5️⃣ **MANAGER APPROVAL & TECHNICIAN ASSIGNMENT**

**Who:** Service Manager

#### Step-by-Step:

1. **View Pending Job Cards**
   - Go to "Job Cards" page
   - Filter: "Pending Approval" or "Created"

2. **Review Job Card Details:**
   - Customer complaints
   - Approved quotation items
   - Parts needed
   - Estimated time

3. **Approve or Reject:**
   - **If Approved:**
     - Select technician from dropdown
     - Click "Assign Engineer"
     - Job Card status: "Assigned"
   - **If Rejected:**
     - Add rejection notes
     - Send back to Service Advisor

**🎯 Result:** Technician receives work assignment

---

### 6️⃣ **TECHNICIAN PERFORMS THE WORK**

**Who:** Technician/Engineer

#### Step-by-Step:

1. **View My Assigned Jobs**
   - Go to "Job Cards" page
   - Filter shows only your assignments

2. **Start Working on Job**
   - Click job card to open
   - Review what needs to be done
   - Status automatically changes to: "In Progress"

3. **If Parts Are Needed:**
   
   **Request Parts:**
   - Click "Request Parts" button
   - Select parts from inventory
   - Enter quantities needed
   - Submit request
   
   **Wait for Approval:**
   - Service Manager reviews request
   - Inventory Manager assigns parts
   - Status: "Parts Pending"
   
   **Receive Parts:**
   - Pick up from parts counter
   - Job status changes back to: "In Progress"

4. **Perform Service Work:**
   - Complete all items in job card
   - Test vehicle
   - Add any technical notes

5. **Mark Work as Completed**
   - Click "Mark as Complete" button
   - Add completion notes
   - Job Card status: "Completed"
   - Service Manager gets notification

**🎯 Result:** Vehicle service is completed and ready for customer pickup

---

### 7️⃣ **GENERATING INVOICE**

**Who:** Service Advisor OR Finance Manager

#### Step-by-Step:

1. **Open Completed Job Card**
   - Go to "Job Cards" page
   - Filter: "Completed"
   - Click on the job card

2. **Click "Generate Invoice" Button**
   - System creates invoice automatically
   - Invoice includes:
     - All parts used (with prices from quotation)
     - All work done (labour charges)
     - GST breakdown
     - Total amount

3. **Review Invoice:**
   - Check all items match what was done
   - Verify total is correct
   - Make adjustments if needed (discounts, additional charges)

4. **Save & Send Invoice**
   - Job Card status changes to: "Invoiced"
   - Click "Send to Customer"
   - Customer receives invoice via WhatsApp/Email
   - Print copy for customer

**🎯 Result:** Customer receives final bill

---

### 8️⃣ **PAYMENT & DELIVERY**

**Who:** Service Advisor OR Cashier

#### Step-by-Step:

1. **Customer Arrives for Pickup**
   - Has received invoice already

2. **Accept Payment:**
   - Cash, Card, UPI, or Online Transfer
   - Mark payment method in system

3. **Update Invoice Status:**
   - Change status from "Unpaid" to "Paid"
   - Record payment date and time

4. **Deliver Vehicle:**
   - Give customer: 
     - Vehicle keys
     - Invoice copy
     - Warranty documents (if applicable)
     - Service checklist/feedback form

5. **Complete Service Record:**
   - Final status: "Delivered"
   - Vehicle service history updated
   - Customer journey complete!

**🎯 Result:** Happy customer drives away with serviced vehicle! 🚗✨

---

## Common Scenarios

### Scenario A: Customer Rejects Quotation

**What to Do:**
1. Service Advisor calls customer
2. Understand their concerns (too expensive, don't need some items, etc.)
3. Create revised quotation with changes
4. Send new quotation for approval
5. If rejected again → Convert to "Lead" for future follow-up

---

### Scenario B: Parts Not in Stock

**What Happens:**
1. Technician requests parts
2. Inventory Manager sees parts are out of stock
3. Inventory Manager creates Purchase Order to Central Inventory
4. Wait for parts (1-2 days)
5. Once parts arrive, assign to technician
6. Technician continues work

**Customer Communication:**
- Service Advisor informs customer of delay
- Provides new estimated delivery date

---

### Scenario C: Additional Work Found

**What to Do:**
1. Technician finds additional issues (e.g., "brake pads worn, also need rotor replacement")
2. Technician adds notes to job card
3. Service Advisor creates **revised quotation** with new items
4. Send to customer for additional approval
5. Wait for approval before proceeding
6. If approved → Continue work
7. If rejected → Complete only original approved work

---

### Scenario D: Walk-in Customer (No Appointment)

**What to Do:**
1. Service Advisor checks capacity for the day
2. If capacity available:
   - Create appointment immediately (same day)
   - Mark status as "Arrived"
   - Follow normal service intake process
3. If no capacity:
   - Schedule appointment for next available slot
   - Explain wait time to customer

---

### Scenario E: Home Service (Pickup & Drop)

**Process:**
1. **Appointment:** Customer selects "Home Service"
2. **Pickup:** Driver goes to customer location, picks up vehicle
3. **Service Intake:** Filled when vehicle arrives at service center
4. **Service:** Normal process continues
5. **Delivery:** Vehicle driven back to customer after payment

**Status Tracking:**
- "Vehicle Absent" → "Vehicle Arrived at Center" → (Normal Flow) → "Out for Delivery"

---

## Tips & Best Practices

### ✅ For Service Advisors

1. **Always get clear customer complaints** - Don't just write "check battery", write "Customer reports battery draining overnight"
2. **Take photos during check-in** - Protects both you and customer
3. **Set realistic delivery dates** - Add buffer time for unexpected issues
4. **Call customer before sending quotation** - Explain the costs to avoid rejection
5. **Follow up on pending quotations** - Call within 24 hours if no response

### ✅ For Service Managers

1. **Review quotations before sending** - Catch pricing errors early
2. **Assign work based on technician expertise** - Battery work → Battery specialist
3. **Monitor parts request turnaround** - Delays in parts = unhappy customers
4. **Check completed work before invoicing** - Quality check to avoid comebacks

### ✅ For Technicians

1. **Update job status regularly** - Let team know you're making progress
2. **Request all parts at once** - Don't request parts multiple times
3. **Document all work done** - Helps with future reference
4. **Test vehicle before marking complete** - Never send out a vehicle without testing
5. **Communicate unexpected findings immediately** - Don't wait until it's too late

### ✅ For Inventory Managers

1. **Check stock levels daily** - Avoid "out of stock" surprises
2. **Prioritize urgent requests** - Customer waiting vehicles get priority
3. **Track fast-moving parts** - Keep popular parts always in stock
4. **Document all issues/transactions** - For audit trail

---

## Quick Reference: Status Meanings

### Appointment Statuses
| Status | Meaning |
|--------|---------|
| **Pending** | Customer called, not confirmed yet |
| **Confirmed** | Customer confirmed, waiting for arrival |
| **In Progress** | Customer arrived, service intake started |
| **Quotation Created** | Quotation sent to customer |
| **Completed** | Service done, customer picked up vehicle |
| **Cancelled** | Customer cancelled before arrival |

### Job Card Statuses
| Status | Meaning | Who Sees It |
|--------|---------|-------------|
| **Created** | Just created from approved quotation | Manager |
| **Assigned** | Manager assigned to technician | Technician + Manager |
| **In Progress** | Technician is working on it | Everyone |
| **Parts Pending** | Waiting for parts from inventory | Inventory Manager + Technician |
| **Completed** | Work is done, ready for invoicing | Service Advisor |
| **Invoiced** | Bill created, waiting for payment | Finance Manager |

### Quotation Statuses
| Status | Meaning |
|--------|---------|
| **Draft** | Still being created/edited |
| **Sent to Customer** | Customer is reviewing |
| **Customer Approved** | Customer said YES → Job Card created |
| **Customer Rejected** | Customer said NO |
| **Manager Quote** | Needs special manager approval (high value) |

### Invoice Statuses
| Status | Meaning |
|--------|---------|
| **Unpaid** | Invoice sent, waiting for payment |
| **Paid** | Customer paid, service complete! |

---

## Support & Help

### 🆘 Common Questions

**Q: What if I make a mistake in the quotation?**  
A: If status is still "Draft", just edit and save. If already sent to customer, create a revised quotation.

**Q: Can I delete an appointment?**  
A: Yes, but only if no job card or quotation is created. Otherwise, mark as "Cancelled".

**Q: Customer lost their invoice copy, what to do?**  
A: Go to Invoices page → Find the invoice → Click "Download" → Print new copy.

**Q: How to find old service records?**  
A: Go to Customers → Search customer → Click on customer → View "Service History" tab.

**Q: Vehicle still in workshop after promised delivery date?**  
A: Service Advisor should call customer BEFORE delivery date if there's a delay.

---

## System Access

**Login URL:** [Your DMS URL]

**Need Help?**
- Technical Support: [Support Phone/Email]
- System Training: [Training Contact]
- Admin: [Admin Contact]

---

**Remember:** The system is here to help you provide amazing customer service. If something is confusing, ask for help - we're all learning together! 🚀

---

**Document Maintained By:** DMS Admin Team  
**Last Review:** January 16, 2026  
**Next Review:** April 16, 2026
