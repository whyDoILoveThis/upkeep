import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebase-admin";
import { getAuthUserId } from "@/lib/auth-helpers";

// Seeds demo data into Firebase Realtime DB, scoped per user.
// All demo data uses "{userId}-demo" prefix to isolate each user's demo data.

function resolveContext(userId: string, role: string) {
  const p = `${userId}-demo`;
  const isHomeowner = role === "homeowner";
  const mgmtId = isHomeowner ? `${p}-management` : userId;
  return { isHomeowner, p, mgmtId };
}

/** Build the full set of demo keys for a given prefix so DELETE can clean up */
function getDemoKeys(p: string): Record<string, string[]> {
  return {
    users: [`${p}-management`, `${p}-homeowner`, `${p}-homeowner-2`, `${p}-homeowner-3`],
    jobs: [`${p}-job-1`, `${p}-job-2`, `${p}-job-3`],
    handymanTime: [`${p}-ht-1`, `${p}-ht-2`, `${p}-ht-3`, `${p}-ht-4`],
    equipmentTemplates: [`${p}-tmpl-1`, `${p}-tmpl-2`, `${p}-tmpl-3`],
    equipment: [`${p}-eq-1`, `${p}-eq-2`, `${p}-eq-3`, `${p}-eq-4`, `${p}-eq-5`, `${p}-eq-6`],
    tasks: [`${p}-task-1`, `${p}-task-2`, `${p}-task-3`, `${p}-task-4`],
    billing: [`${p}-bill-1`, `${p}-bill-2`, `${p}-bill-3`, `${p}-bill-4`, `${p}-bill-5`],
  };
}

export async function POST(req: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Accept role from request body or look it up from the DB
  let role: string | null = null;
  try {
    const body = await req.json();
    role = body.role;
  } catch {
    // no body
  }

  const db = getDb();

  if (!role) {
    const userSnap = await db.ref(`users/${userId}`).get();
    if (userSnap.exists()) role = userSnap.val().role;
  }

  if (role !== "homeowner" && role !== "management") {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const { isHomeowner, p, mgmtId } = resolveContext(userId, role);

  // Scoped IDs
  const hw1 = `${p}-homeowner`;
  const hw2 = `${p}-homeowner-2`;
  const hw3 = `${p}-homeowner-3`;
  const mgmtKey = `${p}-management`;
  const job1 = `${p}-job-1`;
  const job2 = `${p}-job-2`;
  const job3 = `${p}-job-3`;
  const eq1 = `${p}-eq-1`;
  const eq2 = `${p}-eq-2`;
  const eq3 = `${p}-eq-3`;
  const eq4 = `${p}-eq-4`;
  const eq5 = `${p}-eq-5`;
  const eq6 = `${p}-eq-6`;

  // Check if already seeded for this user
  const checkKey = isHomeowner ? `${p}-management` : `${p}-homeowner`;
  const check = await db.ref(`users/${checkKey}`).get();
  if (check.exists()) {
    return NextResponse.json({ seeded: false, message: "Already seeded" });
  }

  const now = Date.now();
  const DAY = 86400000;

  // --- Homeowner seed path ---
  if (isHomeowner) {
    // Create a demo management company for this homeowner
    await db.ref(`users/${mgmtKey}`).set({
      id: mgmtKey,
      clerkId: mgmtKey,
      role: "management",
      name: "Apex Property Management",
      email: "demo@apex-mgmt.com",
      phone: "555-100-0000",
      address: "",
      company: "Apex Property Management",
      createdAt: now - 120 * DAY,
    });

    // Create homeowner profile if it doesn't exist
    const hwSnap = await db.ref(`users/${userId}`).get();
    let hwName = "Demo Homeowner";
    if (hwSnap.exists()) {
      hwName = hwSnap.val()?.name || "Demo Homeowner";
    } else {
      await db.ref(`users/${userId}`).set({
        id: userId,
        clerkId: userId,
        role: "homeowner",
        name: "Demo Homeowner",
        email: "demo@homeowner.com",
        phone: "555-200-0000",
        address: "742 Evergreen Terrace, Springfield",
        company: "",
        createdAt: now - 100 * DAY,
      });
    }

    await db.ref(`jobs/${job1}`).set({
      managementId: mgmtId,
      managementName: "Apex Property Management",
      homeownerId: userId,
      homeownerName: hwName,
      title: `${hwName.split(" ").pop()} Residence`,
      address: "",
      status: "active",
      notes: "Demo job — full-service maintenance contract.",
      createdAt: now - 80 * DAY,
      updatedAt: now - 2 * DAY,
    });

    // Equipment for the homeowner
    await db.ref("equipment").update({
      [eq1]: {
        userId,
        managementId: mgmtId,
        jobId: job1,
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
      [eq2]: {
        userId,
        managementId: mgmtId,
        jobId: job1,
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
      [eq3]: {
        userId,
        managementId: mgmtId,
        jobId: job1,
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
    });

    // Tasks
    await db.ref("tasks").update({
      [`${p}-task-1`]: {
        homeownerId: userId,
        homeownerName: hwName,
        managementId: mgmtId,
        jobId: job1,
        assignedTo: mgmtId,
        assignedToName: "Apex Property Management",
        title: "Fix kitchen faucet leak",
        description: "Slow drip from kitchen sink faucet — started last week",
        status: "in-progress",
        priority: "high",
        updates: {
          "u1": {
            id: "u1",
            message: "Inspected faucet. Cartridge needs replacement — ordered parts.",
            authorId: mgmtId,
            authorName: "Apex Property Management",
            authorRole: "management",
            timestamp: now - 3 * DAY,
          },
        },
        createdAt: now - 5 * DAY,
        updatedAt: now - 1 * DAY,
      },
    });

    // Billing
    await db.ref("billing").update({
      [`${p}-bill-1`]: {
        homeownerId: userId,
        homeownerName: hwName,
        managementId: mgmtId,
        jobId: job1,
        description: "Quarterly maintenance — Q1 service",
        amount: 450,
        status: "paid",
        dueDate: new Date(now - 30 * DAY).toISOString().split("T")[0],
        paidDate: new Date(now - 28 * DAY).toISOString().split("T")[0],
        createdAt: now - 45 * DAY,
      },
      [`${p}-bill-2`]: {
        homeownerId: userId,
        homeownerName: hwName,
        managementId: mgmtId,
        jobId: job1,
        description: "Faucet cartridge replacement — parts & labor",
        amount: 185,
        status: "pending",
        dueDate: new Date(now + 15 * DAY).toISOString().split("T")[0],
        createdAt: now - 1 * DAY,
      },
    });

    return NextResponse.json({ seeded: true });
  }

  // --- Management seed path ---

  // Create management user profile if it doesn't exist
  const mgmtSnap = await db.ref(`users/${userId}`).get();
  if (!mgmtSnap.exists()) {
    await db.ref(`users/${userId}`).set({
      id: userId,
      clerkId: userId,
      role: "management",
      name: "Apex Property Management",
      email: "demo@apex-mgmt.com",
      phone: "555-100-0000",
      address: "",
      company: "Apex Property Management",
      createdAt: now - 120 * DAY,
    });
  }

  await db.ref(`users/${hw1}`).set({
    id: hw1,
    clerkId: hw1,
    role: "homeowner",
    name: "Alex Rivera",
    email: "alex@example.com",
    phone: "555-200-1001",
    address: "742 Evergreen Terrace, Springfield",
    company: "",
    createdAt: now - 100 * DAY,
  });

  await db.ref(`users/${hw2}`).set({
    id: hw2,
    clerkId: hw2,
    role: "homeowner",
    name: "Jordan Patel",
    email: "jordan@example.com",
    phone: "555-200-1002",
    address: "1600 Pennsylvania Ave, Metro City",
    company: "",
    createdAt: now - 90 * DAY,
  });

  await db.ref(`users/${hw3}`).set({
    id: hw3,
    clerkId: hw3,
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
    [job1]: {
      managementId: mgmtId,
      managementName: "Apex Property Management",
      homeownerId: hw1,
      homeownerName: "Alex Rivera",
      title: "Rivera Residence",
      address: "742 Evergreen Terrace, Springfield",
      status: "active",
      notes: "Full-service maintenance contract. Quarterly HVAC inspections included.",
      createdAt: now - 80 * DAY,
      updatedAt: now - 2 * DAY,
    },
    [job2]: {
      managementId: mgmtId,
      managementName: "Apex Property Management",
      homeownerId: hw2,
      homeownerName: "Jordan Patel",
      title: "Patel Estate",
      address: "1600 Pennsylvania Ave, Metro City",
      status: "active",
      notes: "Premium tier plan. Pool and landscape included.",
      createdAt: now - 55 * DAY,
      updatedAt: now - 1 * DAY,
    },
    [job3]: {
      managementId: mgmtId,
      managementName: "Apex Property Management",
      homeownerId: hw3,
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
    [`${p}-ht-1`]: {
      userId: hw1,
      managementId: mgmtId,
      jobId: job1,
      jobTitle: "Rivera Residence",
      startTime: new Date(qStart.getTime() + 7 * DAY + 9 * 3600000).toISOString(),
      endTime: new Date(qStart.getTime() + 7 * DAY + 11 * 3600000).toISOString(),
      notes: "HVAC filter replacement and inspection",
      createdAt: now - 30 * DAY,
    },
    [`${p}-ht-2`]: {
      userId: hw1,
      managementId: mgmtId,
      jobId: job1,
      jobTitle: "Rivera Residence",
      startTime: new Date(qStart.getTime() + 21 * DAY + 13 * 3600000).toISOString(),
      endTime: new Date(qStart.getTime() + 21 * DAY + 15 * 3600000).toISOString(),
      notes: "Fix kitchen faucet leak",
      createdAt: now - 20 * DAY,
    },
    [`${p}-ht-3`]: {
      userId: hw2,
      managementId: mgmtId,
      jobId: job2,
      jobTitle: "Patel Estate",
      startTime: new Date(qStart.getTime() + 14 * DAY + 10 * 3600000).toISOString(),
      endTime: new Date(qStart.getTime() + 14 * DAY + 14 * 3600000).toISOString(),
      notes: "Pool pump maintenance and deck repair",
      createdAt: now - 15 * DAY,
    },
    [`${p}-ht-4`]: {
      userId: hw1,
      managementId: mgmtId,
      jobId: job1,
      jobTitle: "Rivera Residence",
      startTime: new Date(now + 5 * DAY + 9 * 3600000).toISOString(),
      endTime: new Date(now + 5 * DAY + 12 * 3600000).toISOString(),
      notes: "Gutter cleaning and downspout inspection",
      createdAt: now - 2 * DAY,
    },
  };
  await db.ref("handymanTime").update(htData);

  // Equipment templates
  const templatesData: Record<string, unknown> = {
    [`${p}-tmpl-1`]: {
      managementId: mgmtId,
      name: "Central Air Conditioner",
      category: "HVAC",
      manufacturer: "Carrier",
      modelNo: "24ACC636A003",
      location: "Exterior / Side Yard",
      notes: "Standard residential 3-ton split system.",
      createdAt: now - 90 * DAY,
      updatedAt: now - 90 * DAY,
    },
    [`${p}-tmpl-2`]: {
      managementId: mgmtId,
      name: "Tankless Water Heater",
      category: "Plumbing",
      manufacturer: "Rinnai",
      modelNo: "RU199iN",
      location: "Utility Room",
      notes: "Descale every 12 months.",
      createdAt: now - 85 * DAY,
      updatedAt: now - 30 * DAY,
    },
    [`${p}-tmpl-3`]: {
      managementId: mgmtId,
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
    [eq1]: {
      userId: hw1,
      managementId: mgmtId,
      jobId: job1,
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
    [eq2]: {
      userId: hw1,
      managementId: mgmtId,
      jobId: job1,
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
    [eq3]: {
      userId: hw1,
      managementId: mgmtId,
      jobId: job1,
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
    [eq4]: {
      userId: hw2,
      managementId: mgmtId,
      jobId: job2,
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
    [eq5]: {
      userId: hw2,
      managementId: mgmtId,
      jobId: job2,
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
    [eq6]: {
      userId: hw3,
      managementId: mgmtId,
      jobId: job3,
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

  // Tasks
  const tasksData: Record<string, unknown> = {
    [`${p}-task-1`]: {
      homeownerId: hw1,
      homeownerName: "Alex Rivera",
      managementId: mgmtId,
      jobId: job1,
      assignedTo: mgmtId,
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
          authorId: mgmtId,
          authorName: "Apex Property Management",
          authorRole: "management",
          timestamp: now - 3 * DAY,
        },
        "u2": {
          id: "u2",
          message: "Parts arrived. Will install Friday morning.",
          authorId: mgmtId,
          authorName: "Apex Property Management",
          authorRole: "management",
          timestamp: now - 1 * DAY,
        },
      },
      createdAt: now - 5 * DAY,
      updatedAt: now - 1 * DAY,
    },
    [`${p}-task-2`]: {
      homeownerId: hw1,
      homeownerName: "Alex Rivera",
      managementId: mgmtId,
      jobId: job1,
      assignedTo: mgmtId,
      assignedToName: "Apex Property Management",
      title: "Annual HVAC tune-up",
      description: "Scheduled seasonal maintenance for central AC",
      status: "pending",
      priority: "medium",
      equipmentId: eq1,
      equipmentName: "Central Air Conditioner",
      updates: {},
      createdAt: now - 10 * DAY,
      updatedAt: now - 10 * DAY,
    },
    [`${p}-task-3`]: {
      homeownerId: hw2,
      homeownerName: "Jordan Patel",
      managementId: mgmtId,
      jobId: job2,
      assignedTo: mgmtId,
      assignedToName: "Apex Property Management",
      title: "Pool heater not igniting",
      description: "Pool heater clicks but doesn't fire up. May need ignitor replacement.",
      status: "pending",
      priority: "high",
      updates: {},
      createdAt: now - 2 * DAY,
      updatedAt: now - 2 * DAY,
    },
    [`${p}-task-4`]: {
      homeownerId: hw1,
      homeownerName: "Alex Rivera",
      managementId: mgmtId,
      jobId: job1,
      title: "Replace weatherstripping on front door",
      description: "Draft coming in around the front door seal",
      status: "completed",
      priority: "low",
      updates: {
        "u1": {
          id: "u1",
          message: "Replaced all weatherstripping. No more draft.",
          authorId: mgmtId,
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
    [`${p}-bill-1`]: {
      homeownerId: hw1,
      homeownerName: "Alex Rivera",
      managementId: mgmtId,
      jobId: job1,
      description: "Quarterly maintenance — Q1 service",
      amount: 450,
      status: "paid",
      dueDate: new Date(now - 30 * DAY).toISOString().split("T")[0],
      paidDate: new Date(now - 28 * DAY).toISOString().split("T")[0],
      createdAt: now - 45 * DAY,
    },
    [`${p}-bill-2`]: {
      homeownerId: hw1,
      homeownerName: "Alex Rivera",
      managementId: mgmtId,
      jobId: job1,
      description: "Faucet cartridge replacement — parts & labor",
      amount: 185,
      status: "pending",
      dueDate: new Date(now + 15 * DAY).toISOString().split("T")[0],
      createdAt: now - 1 * DAY,
    },
    [`${p}-bill-3`]: {
      homeownerId: hw2,
      homeownerName: "Jordan Patel",
      managementId: mgmtId,
      jobId: job2,
      description: "Pool pump service and chemical balancing",
      amount: 320,
      status: "paid",
      dueDate: new Date(now - 10 * DAY).toISOString().split("T")[0],
      paidDate: new Date(now - 8 * DAY).toISOString().split("T")[0],
      createdAt: now - 25 * DAY,
    },
    [`${p}-bill-4`]: {
      homeownerId: hw2,
      homeownerName: "Jordan Patel",
      managementId: mgmtId,
      jobId: job2,
      description: "Deck staining and repair",
      amount: 875,
      status: "overdue",
      dueDate: new Date(now - 5 * DAY).toISOString().split("T")[0],
      createdAt: now - 20 * DAY,
    },
    [`${p}-bill-5`]: {
      homeownerId: hw3,
      homeownerName: "Sam Nakamura",
      managementId: mgmtId,
      jobId: job3,
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

export async function DELETE() {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const p = `${userId}-demo`;
  const keys = getDemoKeys(p);

  const removes: Promise<void>[] = [];
  for (const [collection, ids] of Object.entries(keys)) {
    for (const id of ids) {
      removes.push(db.ref(`${collection}/${id}`).remove());
    }
  }

  await Promise.all(removes);

  return NextResponse.json({ cleared: true });
}

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const p = `${userId}-demo`;
  // Check for any seeded user — management key exists in both paths
  const check = await db.ref(`users/${p}-management`).get();
  if (!check.exists()) {
    const check2 = await db.ref(`users/${p}-homeowner`).get();
    return NextResponse.json({ loaded: check2.exists() });
  }
  return NextResponse.json({ loaded: check.exists() });
}
