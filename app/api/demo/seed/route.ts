import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebase-admin";

// Seeds demo data into Firebase Realtime DB on first demo visit
// Only writes if demo-management user doesn't exist yet

export async function POST(req: NextRequest) {
  const demoRole = req.cookies.get("demo_role")?.value;
  if (demoRole !== "homeowner" && demoRole !== "management") {
    return NextResponse.json({ error: "Demo only" }, { status: 403 });
  }

  const db = getDb();

  // Check if already seeded
  const check = await db.ref("users/demo-management").get();
  if (check.exists()) {
    return NextResponse.json({ seeded: false, message: "Already seeded" });
  }

  const now = Date.now();
  const DAY = 86400000;

  // Users
  await db.ref("users/demo-management").set({
    id: "demo-management",
    clerkId: "demo-management",
    role: "management",
    name: "Apex Property Management",
    email: "demo@apex-mgmt.com",
    phone: "555-100-0000",
    address: "",
    company: "Apex Property Management",
    createdAt: now - 120 * DAY,
  });

  await db.ref("users/demo-homeowner").set({
    id: "demo-homeowner",
    clerkId: "demo-homeowner",
    role: "homeowner",
    name: "Alex Rivera",
    email: "alex@example.com",
    phone: "555-200-1001",
    address: "742 Evergreen Terrace, Springfield",
    company: "",
    createdAt: now - 100 * DAY,
  });

  await db.ref("users/demo-homeowner-2").set({
    id: "demo-homeowner-2",
    clerkId: "demo-homeowner-2",
    role: "homeowner",
    name: "Jordan Patel",
    email: "jordan@example.com",
    phone: "555-200-1002",
    address: "1600 Pennsylvania Ave, Metro City",
    company: "",
    createdAt: now - 90 * DAY,
  });

  await db.ref("users/demo-homeowner-3").set({
    id: "demo-homeowner-3",
    clerkId: "demo-homeowner-3",
    role: "homeowner",
    name: "Sam Nakamura",
    email: "sam@example.com",
    phone: "555-200-1003",
    address: "221B Baker St, Watertown",
    company: "",
    createdAt: now - 60 * DAY,
  });

  // Jobs
  const jobsData: Record<string, unknown> = {
    "demo-job-1": {
      managementId: "demo-management",
      homeownerId: "demo-homeowner",
      homeownerName: "Alex Rivera",
      title: "Rivera Residence",
      address: "742 Evergreen Terrace, Springfield",
      status: "active",
      notes: "Full-service maintenance contract. Quarterly HVAC inspections included.",
      createdAt: now - 80 * DAY,
      updatedAt: now - 2 * DAY,
    },
    "demo-job-2": {
      managementId: "demo-management",
      homeownerId: "demo-homeowner-2",
      homeownerName: "Jordan Patel",
      title: "Patel Estate",
      address: "1600 Pennsylvania Ave, Metro City",
      status: "active",
      notes: "Premium tier plan. Pool and landscape included.",
      createdAt: now - 55 * DAY,
      updatedAt: now - 1 * DAY,
    },
    "demo-job-3": {
      managementId: "demo-management",
      homeownerId: "demo-homeowner-3",
      homeownerName: "Sam Nakamura",
      title: "Nakamura Home",
      address: "221B Baker St, Watertown",
      status: "active",
      notes: "New client. Initial equipment inventory in progress.",
      createdAt: now - 25 * DAY,
      updatedAt: now - 5 * DAY,
    },
  };
  await db.ref("jobs").update(jobsData);

  // Handyman Time entries
  const qNow = new Date();
  const quarter = Math.floor(qNow.getMonth() / 3);
  const qStart = new Date(qNow.getFullYear(), quarter * 3, 1);

  const htData: Record<string, unknown> = {
    "demo-ht-1": {
      userId: "demo-homeowner",
      managementId: "demo-management",
      startTime: new Date(qStart.getTime() + 7 * DAY + 9 * 3600000).toISOString(), // 9am, 7 days into quarter
      endTime: new Date(qStart.getTime() + 7 * DAY + 11 * 3600000).toISOString(),   // 11am
      notes: "HVAC filter replacement and inspection",
      createdAt: now - 30 * DAY,
    },
    "demo-ht-2": {
      userId: "demo-homeowner",
      managementId: "demo-management",
      startTime: new Date(qStart.getTime() + 21 * DAY + 13 * 3600000).toISOString(), // 1pm
      endTime: new Date(qStart.getTime() + 21 * DAY + 15 * 3600000).toISOString(),   // 3pm
      notes: "Fix kitchen faucet leak",
      createdAt: now - 20 * DAY,
    },
    "demo-ht-3": {
      userId: "demo-homeowner-2",
      managementId: "demo-management",
      startTime: new Date(qStart.getTime() + 14 * DAY + 10 * 3600000).toISOString(),
      endTime: new Date(qStart.getTime() + 14 * DAY + 14 * 3600000).toISOString(),
      notes: "Pool pump maintenance and deck repair",
      createdAt: now - 15 * DAY,
    },
    "demo-ht-4": {
      userId: "demo-homeowner",
      managementId: "demo-management",
      startTime: new Date(now + 5 * DAY + 9 * 3600000).toISOString(),
      endTime: new Date(now + 5 * DAY + 12 * 3600000).toISOString(),
      notes: "Gutter cleaning and downspout inspection",
      createdAt: now - 2 * DAY,
    },
  };
  await db.ref("handymanTime").update(htData);

  // Equipment templates
  const templatesData: Record<string, unknown> = {
    "demo-tmpl-1": {
      managementId: "demo-management",
      name: "Central Air Conditioner",
      category: "HVAC",
      manufacturer: "Carrier",
      modelNo: "24ACC636A003",
      location: "Exterior / Side Yard",
      notes: "Standard residential 3-ton split system.",
      createdAt: now - 90 * DAY,
      updatedAt: now - 90 * DAY,
    },
    "demo-tmpl-2": {
      managementId: "demo-management",
      name: "Tankless Water Heater",
      category: "Plumbing",
      manufacturer: "Rinnai",
      modelNo: "RU199iN",
      location: "Utility Room",
      notes: "Descale every 12 months.",
      createdAt: now - 85 * DAY,
      updatedAt: now - 30 * DAY,
    },
    "demo-tmpl-3": {
      managementId: "demo-management",
      name: "Smart Thermostat",
      category: "HVAC",
      manufacturer: "Ecobee",
      modelNo: "EB-STATE6L-01",
      location: "Main Hallway",
      notes: "Wi-Fi enabled. Replace remote sensor batteries yearly.",
      createdAt: now - 80 * DAY,
      updatedAt: now - 80 * DAY,
    },
  };
  await db.ref("equipmentTemplates").update(templatesData);

  // Equipment (per homeowner)
  const equipmentData: Record<string, unknown> = {
    "demo-eq-1": {
      userId: "demo-homeowner",
      name: "Central Air Conditioner",
      category: "HVAC",
      manufacturer: "Carrier",
      modelNo: "24ACC636A003",
      serialNo: "CAR-2023-78541",
      location: "Exterior / Side Yard",
      datePurchased: "2021-06-15",
      warrantyExpiration: "2026-06-15",
      notes: "3-ton split system. Filter size 20x25x1.",
      createdAt: now - 70 * DAY,
      updatedAt: now - 10 * DAY,
    },
    "demo-eq-2": {
      userId: "demo-homeowner",
      name: "Tankless Water Heater",
      category: "Plumbing",
      manufacturer: "Rinnai",
      modelNo: "RU199iN",
      serialNo: "RIN-2022-44312",
      location: "Utility Room",
      datePurchased: "2022-03-10",
      warrantyExpiration: "2027-03-10",
      notes: "Descale every 12 months. Last descaled Jan.",
      createdAt: now - 65 * DAY,
      updatedAt: now - 5 * DAY,
    },
    "demo-eq-3": {
      userId: "demo-homeowner",
      name: "Smart Thermostat",
      category: "HVAC",
      manufacturer: "Ecobee",
      modelNo: "EB-STATE6L-01",
      serialNo: "ECO-2023-10092",
      location: "Main Hallway",
      notes: "Wi-Fi enabled. Replace remote sensor batteries yearly.",
      createdAt: now - 60 * DAY,
      updatedAt: now - 60 * DAY,
    },
    "demo-eq-4": {
      userId: "demo-homeowner-2",
      name: "Pool Pump",
      category: "Outdoor",
      manufacturer: "Pentair",
      modelNo: "342001",
      serialNo: "PEN-2023-55678",
      location: "Pool Equipment Pad",
      datePurchased: "2023-04-22",
      warrantyExpiration: "2026-04-22",
      notes: "Variable speed. Run on low speed 8 hrs/day.",
      createdAt: now - 50 * DAY,
      updatedAt: now - 3 * DAY,
    },
    "demo-eq-5": {
      userId: "demo-homeowner-2",
      name: "Garage Door Opener",
      category: "General",
      manufacturer: "LiftMaster",
      modelNo: "87504",
      serialNo: "LM-2021-99201",
      location: "Garage",
      datePurchased: "2021-08-01",
      warrantyExpiration: "2025-08-01",
      notes: "Belt drive. Lubricate rails every 6 months.",
      createdAt: now - 45 * DAY,
      updatedAt: now - 45 * DAY,
    },
    "demo-eq-6": {
      userId: "demo-homeowner-3",
      name: "Furnace",
      category: "HVAC",
      manufacturer: "Lennox",
      modelNo: "EL296V",
      serialNo: "LEN-2020-33412",
      location: "Basement",
      datePurchased: "2020-11-15",
      warrantyExpiration: "2030-11-15",
      notes: "High-efficiency gas furnace. Change filter every 3 months.",
      createdAt: now - 20 * DAY,
      updatedAt: now - 20 * DAY,
    },
  };
  await db.ref("equipment").update(equipmentData);

  // Reminders
  const remindersData: Record<string, unknown> = {
    "demo-rem-1": {
      userId: "demo-homeowner",
      title: "Replace HVAC filter",
      description: "20x25x1 pleated filter for central AC unit",
      dueDate: new Date(now + 14 * DAY).toISOString().split("T")[0],
      recurring: "quarterly",
      equipmentId: "demo-eq-1",
      equipmentName: "Central Air Conditioner",
      completed: false,
      createdAt: now - 60 * DAY,
    },
    "demo-rem-2": {
      userId: "demo-homeowner",
      title: "Descale water heater",
      description: "Annual vinegar flush for tankless unit",
      dueDate: new Date(now + 60 * DAY).toISOString().split("T")[0],
      recurring: "yearly",
      equipmentId: "demo-eq-2",
      equipmentName: "Tankless Water Heater",
      completed: false,
      createdAt: now - 50 * DAY,
    },
    "demo-rem-3": {
      userId: "demo-homeowner",
      title: "Replace thermostat sensor batteries",
      dueDate: new Date(now - 5 * DAY).toISOString().split("T")[0],
      recurring: "yearly",
      equipmentId: "demo-eq-3",
      equipmentName: "Smart Thermostat",
      completed: true,
      createdAt: now - 40 * DAY,
    },
    "demo-rem-4": {
      userId: "demo-homeowner-2",
      title: "Pool pump inspection",
      description: "Check impeller and seals",
      dueDate: new Date(now + 7 * DAY).toISOString().split("T")[0],
      recurring: "quarterly",
      equipmentId: "demo-eq-4",
      equipmentName: "Pool Pump",
      completed: false,
      createdAt: now - 30 * DAY,
    },
    "demo-rem-5": {
      userId: "demo-homeowner-2",
      title: "Lubricate garage door rails",
      dueDate: new Date(now + 30 * DAY).toISOString().split("T")[0],
      recurring: "monthly",
      equipmentId: "demo-eq-5",
      equipmentName: "Garage Door Opener",
      completed: false,
      createdAt: now - 25 * DAY,
    },
    "demo-rem-6": {
      userId: "demo-homeowner-3",
      title: "Change furnace filter",
      dueDate: new Date(now + 21 * DAY).toISOString().split("T")[0],
      recurring: "quarterly",
      equipmentId: "demo-eq-6",
      equipmentName: "Furnace",
      completed: false,
      createdAt: now - 15 * DAY,
    },
  };
  await db.ref("reminders").update(remindersData);

  // Tasks
  const tasksData: Record<string, unknown> = {
    "demo-task-1": {
      homeownerId: "demo-homeowner",
      homeownerName: "Alex Rivera",
      assignedTo: "demo-management",
      assignedToName: "Apex Property Management",
      title: "Fix kitchen faucet leak",
      description: "Slow drip from kitchen sink faucet — started last week",
      status: "in-progress",
      priority: "high",
      equipmentId: "",
      updates: {
        "u1": {
          id: "u1",
          message: "Inspected faucet. Cartridge needs replacement — ordered parts.",
          authorId: "demo-management",
          authorName: "Apex Property Management",
          authorRole: "management",
          timestamp: now - 3 * DAY,
        },
        "u2": {
          id: "u2",
          message: "Parts arrived. Will install Friday morning.",
          authorId: "demo-management",
          authorName: "Apex Property Management",
          authorRole: "management",
          timestamp: now - 1 * DAY,
        },
      },
      createdAt: now - 5 * DAY,
      updatedAt: now - 1 * DAY,
    },
    "demo-task-2": {
      homeownerId: "demo-homeowner",
      homeownerName: "Alex Rivera",
      assignedTo: "demo-management",
      assignedToName: "Apex Property Management",
      title: "Annual HVAC tune-up",
      description: "Scheduled seasonal maintenance for central AC",
      status: "pending",
      priority: "medium",
      equipmentId: "demo-eq-1",
      equipmentName: "Central Air Conditioner",
      updates: {},
      createdAt: now - 10 * DAY,
      updatedAt: now - 10 * DAY,
    },
    "demo-task-3": {
      homeownerId: "demo-homeowner-2",
      homeownerName: "Jordan Patel",
      assignedTo: "demo-management",
      assignedToName: "Apex Property Management",
      title: "Pool heater not igniting",
      description: "Pool heater clicks but doesn't fire up. May need ignitor replacement.",
      status: "pending",
      priority: "high",
      updates: {},
      createdAt: now - 2 * DAY,
      updatedAt: now - 2 * DAY,
    },
    "demo-task-4": {
      homeownerId: "demo-homeowner",
      homeownerName: "Alex Rivera",
      title: "Replace weatherstripping on front door",
      description: "Draft coming in around the front door seal",
      status: "completed",
      priority: "low",
      updates: {
        "u1": {
          id: "u1",
          message: "Replaced all weatherstripping. No more draft.",
          authorId: "demo-management",
          authorName: "Apex Property Management",
          authorRole: "management",
          timestamp: now - 15 * DAY,
        },
      },
      createdAt: now - 20 * DAY,
      updatedAt: now - 15 * DAY,
    },
  };
  await db.ref("tasks").update(tasksData);

  // Billing records
  const billingData: Record<string, unknown> = {
    "demo-bill-1": {
      homeownerId: "demo-homeowner",
      homeownerName: "Alex Rivera",
      description: "Quarterly maintenance — Q1 service",
      amount: 450,
      status: "paid",
      dueDate: new Date(now - 30 * DAY).toISOString().split("T")[0],
      paidDate: new Date(now - 28 * DAY).toISOString().split("T")[0],
      createdAt: now - 45 * DAY,
    },
    "demo-bill-2": {
      homeownerId: "demo-homeowner",
      homeownerName: "Alex Rivera",
      description: "Faucet cartridge replacement — parts & labor",
      amount: 185,
      status: "pending",
      dueDate: new Date(now + 15 * DAY).toISOString().split("T")[0],
      createdAt: now - 1 * DAY,
    },
    "demo-bill-3": {
      homeownerId: "demo-homeowner-2",
      homeownerName: "Jordan Patel",
      description: "Pool pump service and chemical balancing",
      amount: 320,
      status: "paid",
      dueDate: new Date(now - 10 * DAY).toISOString().split("T")[0],
      paidDate: new Date(now - 8 * DAY).toISOString().split("T")[0],
      createdAt: now - 25 * DAY,
    },
    "demo-bill-4": {
      homeownerId: "demo-homeowner-2",
      homeownerName: "Jordan Patel",
      description: "Deck staining and repair",
      amount: 875,
      status: "overdue",
      dueDate: new Date(now - 5 * DAY).toISOString().split("T")[0],
      createdAt: now - 20 * DAY,
    },
    "demo-bill-5": {
      homeownerId: "demo-homeowner-3",
      homeownerName: "Sam Nakamura",
      description: "Initial home assessment and equipment inventory",
      amount: 200,
      status: "pending",
      dueDate: new Date(now + 10 * DAY).toISOString().split("T")[0],
      createdAt: now - 10 * DAY,
    },
  };
  await db.ref("billing").update(billingData);

  return NextResponse.json({ seeded: true });
}
