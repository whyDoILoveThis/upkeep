import type {
  UserProfile,
  Equipment,
  Notification,
  FileRecord,
  Task,
  TaskUpdate,
  BillingRecord,
  TimeAllotment,
  Job,
  EquipmentTemplate,
} from "./types";

// ─── Homeowners ────────────────────────────────────────────

export const demoHomeowner: UserProfile = {
  id: "demo-homeowner",
  clerkId: "demo-homeowner",
  role: "homeowner",
  name: "Alex Rivera",
  email: "alex@demo.com",
  phone: "(555) 234-5678",
  address: "742 Evergreen Terrace, Springfield",
  createdAt: Date.now() - 90 * 86400000,
};

const demoHomeowner2: UserProfile = {
  id: "demo-homeowner-2",
  clerkId: "demo-homeowner-2",
  role: "homeowner",
  name: "Jordan Patel",
  email: "jordan@demo.com",
  phone: "(555) 876-5432",
  address: "1600 Pennsylvania Ave, Metro City",
  createdAt: Date.now() - 60 * 86400000,
};

const demoHomeowner3: UserProfile = {
  id: "demo-homeowner-3",
  clerkId: "demo-homeowner-3",
  role: "homeowner",
  name: "Sam Nakamura",
  email: "sam@demo.com",
  phone: "(555) 111-2233",
  address: "221B Baker St, Watertown",
  createdAt: Date.now() - 30 * 86400000,
};

export const demoManagement: UserProfile = {
  id: "demo-management",
  clerkId: "demo-management",
  role: "management",
  name: "Taylor Brooks",
  email: "taylor@upkeepmanagement.com",
  phone: "(555) 999-0000",
  company: "Upkeep Property Management",
  createdAt: Date.now() - 180 * 86400000,
};

export const demoHomeowners: UserProfile[] = [
  demoHomeowner,
  demoHomeowner2,
  demoHomeowner3,
];

// ─── Equipment ─────────────────────────────────────────────

const now = Date.now();

export const demoEquipment: Equipment[] = [
  {
    id: "eq-1",
    userId: "demo-homeowner",
    name: "Central HVAC System",
    category: "HVAC",
    datePurchased: "2022-03-15",
    warrantyExpiration: "2027-03-15",
    modelNo: "TR-XL18i",
    serialNo: "HVAC-2022-44892",
    manufacturer: "Trane",
    location: "Basement",
    notes: "Serviced annually in spring. Filter changed every 3 months.",
    createdAt: now - 60 * 86400000,
    updatedAt: now - 5 * 86400000,
  },
  {
    id: "eq-2",
    userId: "demo-homeowner",
    name: "Tankless Water Heater",
    category: "Plumbing",
    datePurchased: "2023-08-20",
    warrantyExpiration: "2033-08-20",
    modelNo: "NPE-240A2",
    serialNo: "NAV-23-77120",
    manufacturer: "Navien",
    location: "Utility Room",
    notes: "Flush annually to prevent mineral buildup.",
    createdAt: now - 45 * 86400000,
    updatedAt: now - 2 * 86400000,
  },
  {
    id: "eq-3",
    userId: "demo-homeowner",
    name: "Garage Door Opener",
    category: "Garage",
    datePurchased: "2021-11-10",
    warrantyExpiration: "2026-11-10",
    modelNo: "8500W",
    serialNo: "LO-8500-33219",
    manufacturer: "LiftMaster",
    location: "Garage",
    notes: "Belt drive, ultra-quiet. Lubricate chain every 6 months.",
    createdAt: now - 90 * 86400000,
    updatedAt: now - 30 * 86400000,
  },
  {
    id: "eq-4",
    userId: "demo-homeowner",
    name: "Roof (Architectural Shingles)",
    category: "Exterior",
    datePurchased: "2020-06-01",
    warrantyExpiration: "2050-06-01",
    manufacturer: "GAF",
    modelNo: "Timberline HDZ",
    location: "Roof",
    notes: "30-year warranty. Inspect after major storms.",
    createdAt: now - 120 * 86400000,
    updatedAt: now - 60 * 86400000,
  },
  {
    id: "eq-5",
    userId: "demo-homeowner",
    name: "Samsung Washer & Dryer",
    category: "Appliance",
    datePurchased: "2024-01-08",
    warrantyExpiration: "2026-01-08",
    modelNo: "WF45R6100AW",
    serialNo: "SAM-WD-90128",
    manufacturer: "Samsung",
    location: "Laundry Room",
    notes: "Clean drain filter monthly. Use HE detergent only.",
    createdAt: now - 30 * 86400000,
    updatedAt: now - 1 * 86400000,
  },
  // Homeowner 2 equipment
  {
    id: "eq-6",
    userId: "demo-homeowner-2",
    name: "Bosch Dishwasher",
    category: "Appliance",
    datePurchased: "2023-04-12",
    warrantyExpiration: "2025-04-12",
    modelNo: "SHPM88Z75N",
    serialNo: "BSH-DW-44781",
    manufacturer: "Bosch",
    location: "Kitchen",
    createdAt: now - 40 * 86400000,
    updatedAt: now - 10 * 86400000,
  },
  {
    id: "eq-7",
    userId: "demo-homeowner-2",
    name: "Heat Pump System",
    category: "HVAC",
    datePurchased: "2024-02-28",
    warrantyExpiration: "2034-02-28",
    modelNo: "MLP-36",
    manufacturer: "Mitsubishi",
    location: "Exterior / Living Room",
    createdAt: now - 25 * 86400000,
    updatedAt: now - 3 * 86400000,
  },
  // Homeowner 3 equipment
  {
    id: "eq-8",
    userId: "demo-homeowner-3",
    name: "Generac Standby Generator",
    category: "Electrical",
    datePurchased: "2023-09-15",
    warrantyExpiration: "2028-09-15",
    modelNo: "7228",
    serialNo: "GEN-22K-55901",
    manufacturer: "Generac",
    location: "Side Yard",
    createdAt: now - 50 * 86400000,
    updatedAt: now - 7 * 86400000,
  },
];

// ─── Notifications (generated from tasks) ──────────────────

function generateDemoNotifications(): Notification[] {
  const notifications: Notification[] = [];
  for (const task of demoTasks) {
    // New task notification
    if (task.status === "pending" && task.createdAt > now - 7 * 86400000) {
      notifications.push({
        id: `notif-new-${task.id}`,
        type: "new_task",
        title: "New Task",
        message: `"${task.title}" has been created`,
        taskId: task.id,
        taskTitle: task.title,
        timestamp: task.createdAt,
        read: false,
      });
    }
    // High priority notification
    if (task.priority === "high" && task.status !== "completed") {
      notifications.push({
        id: `notif-priority-${task.id}`,
        type: "task_high_priority",
        title: "High Priority Task",
        message: `"${task.title}" requires immediate attention`,
        taskId: task.id,
        taskTitle: task.title,
        timestamp: task.createdAt,
        read: false,
      });
    }
    // Completed task notification
    if (task.status === "completed" && task.updatedAt > now - 7 * 86400000) {
      notifications.push({
        id: `notif-done-${task.id}`,
        type: "task_completed",
        title: "Task Completed",
        message: `"${task.title}" has been marked as completed`,
        taskId: task.id,
        taskTitle: task.title,
        timestamp: task.updatedAt,
        read: true,
      });
    }
    // Comment notifications
    if (task.updates) {
      for (const [key, update] of Object.entries(task.updates)) {
        if (update.timestamp > now - 14 * 86400000) {
          notifications.push({
            id: `notif-comment-${task.id}-${key}`,
            type: "task_comment",
            title: "New Comment",
            message: `New comment on "${task.title}"`,
            taskId: task.id,
            taskTitle: task.title,
            timestamp: update.timestamp,
            read: false,
          });
        }
      }
    }
  }
  return notifications.sort((a, b) => b.timestamp - a.timestamp);
}

export const demoNotifications = generateDemoNotifications();

// ─── Files ─────────────────────────────────────────────────

export const demoFiles: FileRecord[] = [
  {
    id: "file-1",
    userId: "demo-homeowner",
    name: "HVAC_Warranty_Certificate.pdf",
    url: "#",
    appwriteFileId: "demo",
    type: "application/pdf",
    size: 245000,
    equipmentId: "eq-1",
    equipmentName: "Central HVAC System",
    createdAt: now - 50 * 86400000,
  },
  {
    id: "file-2",
    userId: "demo-homeowner",
    name: "Water_Heater_Manual.pdf",
    url: "#",
    appwriteFileId: "demo",
    type: "application/pdf",
    size: 1800000,
    equipmentId: "eq-2",
    equipmentName: "Tankless Water Heater",
    createdAt: now - 40 * 86400000,
  },
  {
    id: "file-3",
    userId: "demo-homeowner",
    name: "Roof_Inspection_2024.pdf",
    url: "#",
    appwriteFileId: "demo",
    type: "application/pdf",
    size: 520000,
    equipmentId: "eq-4",
    equipmentName: "Roof (Architectural Shingles)",
    createdAt: now - 20 * 86400000,
  },
  {
    id: "file-4",
    userId: "demo-homeowner",
    name: "Home_Insurance_Policy.pdf",
    url: "#",
    appwriteFileId: "demo",
    type: "application/pdf",
    size: 980000,
    createdAt: now - 70 * 86400000,
  },
  {
    id: "file-5",
    userId: "demo-homeowner-2",
    name: "Heat_Pump_Install_Receipt.pdf",
    url: "#",
    appwriteFileId: "demo",
    type: "application/pdf",
    size: 310000,
    equipmentId: "eq-7",
    equipmentName: "Heat Pump System",
    createdAt: now - 15 * 86400000,
  },
];

// ─── Tasks ─────────────────────────────────────────────────

const updateTimestamp = now - 2 * 86400000;

const taskUpdates1: Record<string, TaskUpdate> = {
  "upd-1": {
    id: "upd-1",
    message: "Inspected the faucet — washer is worn. Replacement ordered.",
    authorId: "demo-management",
    authorName: "Taylor Brooks",
    authorRole: "management",
    timestamp: now - 7 * 86400000,
  },
  "upd-2": {
    id: "upd-2",
    message: "Parts arrived. Scheduled repair for Thursday.",
    authorId: "demo-management",
    authorName: "Taylor Brooks",
    authorRole: "management",
    timestamp: now - 4 * 86400000,
  },
  "upd-3": {
    id: "upd-3",
    message: "Fixed! No more leaking. Thanks for the quick turnaround.",
    authorId: "demo-homeowner",
    authorName: "Alex Rivera",
    authorRole: "homeowner",
    timestamp: now - 3 * 86400000,
  },
};

const taskUpdates2: Record<string, TaskUpdate> = {
  "upd-4": {
    id: "upd-4",
    message: "Inspected the seal — cracked along the bottom. Will replace Wednesday.",
    authorId: "demo-management",
    authorName: "Taylor Brooks",
    authorRole: "management",
    timestamp: now - 1 * 86400000,
  },
};

export const demoTasks: Task[] = [
  {
    id: "task-1",
    homeownerId: "demo-homeowner",
    homeownerName: "Alex Rivera",
    assignedTo: "demo-management",
    assignedToName: "Taylor Brooks",
    title: "Fix Leaky Kitchen Faucet",
    description: "Persistent drip from the kitchen faucet cold water handle.",
    status: "completed",
    priority: "medium",
    equipmentId: undefined,
    updates: taskUpdates1,
    createdAt: now - 10 * 86400000,
    updatedAt: now - 3 * 86400000,
  },
  {
    id: "task-2",
    homeownerId: "demo-homeowner",
    homeownerName: "Alex Rivera",
    assignedTo: "demo-management",
    assignedToName: "Taylor Brooks",
    title: "Replace Garage Door Seal",
    description: "Bottom weather seal is cracked, letting in drafts and water.",
    status: "in-progress",
    priority: "high",
    equipmentId: "eq-3",
    equipmentName: "Garage Door Opener",
    updates: taskUpdates2,
    createdAt: now - 5 * 86400000,
    updatedAt: updateTimestamp,
  },
  {
    id: "task-3",
    homeownerId: "demo-homeowner",
    homeownerName: "Alex Rivera",
    title: "Paint Garage Interior",
    description: "Walls need fresh coat of paint — moisture stains along the north wall.",
    status: "pending",
    priority: "low",
    updates: {},
    createdAt: now - 2 * 86400000,
    updatedAt: now - 2 * 86400000,
  },
  // Homeowner 2
  {
    id: "task-4",
    homeownerId: "demo-homeowner-2",
    homeownerName: "Jordan Patel",
    assignedTo: "demo-management",
    assignedToName: "Taylor Brooks",
    title: "Install Smart Thermostat",
    description: "Replace old thermostat with Ecobee Smart Thermostat Premium.",
    status: "in-progress",
    priority: "medium",
    equipmentId: "eq-7",
    equipmentName: "Heat Pump System",
    updates: {
      "upd-5": {
        id: "upd-5",
        message: "Thermostat purchased. Scheduling install for next week.",
        authorId: "demo-management",
        authorName: "Taylor Brooks",
        authorRole: "management",
        timestamp: now - 2 * 86400000,
      },
    },
    createdAt: now - 8 * 86400000,
    updatedAt: now - 2 * 86400000,
  },
  // Homeowner 3
  {
    id: "task-5",
    homeownerId: "demo-homeowner-3",
    homeownerName: "Sam Nakamura",
    title: "Generator Annual Service",
    description: "Oil change, spark plug, air filter, and full load test.",
    status: "pending",
    priority: "medium",
    equipmentId: "eq-8",
    equipmentName: "Generac Standby Generator",
    updates: {},
    createdAt: now - 1 * 86400000,
    updatedAt: now - 1 * 86400000,
  },
];

// ─── Billing ───────────────────────────────────────────────

export const demoBills: BillingRecord[] = [
  {
    id: "bill-1",
    homeownerId: "demo-homeowner",
    homeownerName: "Alex Rivera",
    description: "Q1 2026 Quarterly Maintenance",
    amount: 450,
    status: "paid",
    dueDate: "2026-01-15",
    paidDate: "2026-01-12",
    createdAt: now - 90 * 86400000,
  },
  {
    id: "bill-2",
    homeownerId: "demo-homeowner",
    homeownerName: "Alex Rivera",
    description: "Emergency Faucet Repair — Parts & Labor",
    amount: 185,
    status: "paid",
    dueDate: "2026-03-10",
    paidDate: "2026-03-08",
    createdAt: now - 40 * 86400000,
  },
  {
    id: "bill-3",
    homeownerId: "demo-homeowner",
    homeownerName: "Alex Rivera",
    description: "Q2 2026 Quarterly Maintenance",
    amount: 450,
    status: "pending",
    dueDate: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
    createdAt: now - 5 * 86400000,
  },
  // Homeowner 2
  {
    id: "bill-4",
    homeownerId: "demo-homeowner-2",
    homeownerName: "Jordan Patel",
    description: "Smart Thermostat Install — Parts & Labor",
    amount: 320,
    status: "pending",
    dueDate: new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10),
    createdAt: now - 3 * 86400000,
  },
  {
    id: "bill-5",
    homeownerId: "demo-homeowner-2",
    homeownerName: "Jordan Patel",
    description: "Q1 2026 Quarterly Maintenance",
    amount: 375,
    status: "paid",
    dueDate: "2026-01-15",
    paidDate: "2026-01-14",
    createdAt: now - 90 * 86400000,
  },
  // Homeowner 3
  {
    id: "bill-6",
    homeownerId: "demo-homeowner-3",
    homeownerName: "Sam Nakamura",
    description: "Q1 2026 Quarterly Maintenance",
    amount: 400,
    status: "overdue",
    dueDate: "2026-03-15",
    createdAt: now - 35 * 86400000,
  },
];

// ─── Time Allotments ───────────────────────────────────────

function getQuarterDates() {
  const now = new Date();
  const q = Math.floor(now.getMonth() / 3);
  const start = new Date(now.getFullYear(), q * 3, 1);
  const end = new Date(now.getFullYear(), q * 3 + 3, 0);
  return {
    quarterStart: start.toISOString().slice(0, 10),
    quarterEnd: end.toISOString().slice(0, 10),
  };
}

const { quarterStart, quarterEnd } = getQuarterDates();

export const demoTimeAllotments: (TimeAllotment & { userName?: string })[] = [
  {
    userId: "demo-homeowner",
    userName: "Alex Rivera",
    quarterlyMinutes: 120,
    usedMinutes: 45,
    quarterStart,
    quarterEnd,
  },
  {
    userId: "demo-homeowner-2",
    userName: "Jordan Patel",
    quarterlyMinutes: 90,
    usedMinutes: 30,
    quarterStart,
    quarterEnd,
  },
  {
    userId: "demo-homeowner-3",
    userName: "Sam Nakamura",
    quarterlyMinutes: 120,
    usedMinutes: 0,
    quarterStart,
    quarterEnd,
  },
];

// ─── Jobs ──────────────────────────────────────────────────

export const demoJobs: Job[] = [
  {
    id: "job-1",
    managementId: "demo-management",
    homeownerId: "demo-homeowner",
    homeownerName: "Alex Rivera",
    title: "Rivera Residence",
    address: "742 Evergreen Terrace, Springfield",
    status: "active",
    notes: "Full-service maintenance contract. Quarterly HVAC inspections included.",
    createdAt: now - 80 * 86400000,
    updatedAt: now - 2 * 86400000,
  },
  {
    id: "job-2",
    managementId: "demo-management",
    homeownerId: "demo-homeowner-2",
    homeownerName: "Jordan Patel",
    title: "Patel Estate",
    address: "1600 Pennsylvania Ave, Metro City",
    status: "active",
    notes: "Premium tier plan. Pool and landscape included.",
    createdAt: now - 55 * 86400000,
    updatedAt: now - 1 * 86400000,
  },
  {
    id: "job-3",
    managementId: "demo-management",
    homeownerId: "demo-homeowner-3",
    homeownerName: "Sam Nakamura",
    title: "Nakamura Home",
    address: "221B Baker St, Watertown",
    status: "active",
    notes: "New client. Initial equipment inventory in progress.",
    createdAt: now - 25 * 86400000,
    updatedAt: now - 5 * 86400000,
  },
];

// ─── Equipment Templates ───────────────────────────────────

export const demoEquipmentTemplates: EquipmentTemplate[] = [
  {
    id: "tmpl-1",
    managementId: "demo-management",
    name: "Central Air Conditioner",
    category: "HVAC",
    manufacturer: "Carrier",
    modelNo: "24ACC636A003",
    location: "Exterior / Side Yard",
    notes: "Standard residential 3-ton split system. Check refrigerant annually.",
    createdAt: now - 90 * 86400000,
    updatedAt: now - 90 * 86400000,
  },
  {
    id: "tmpl-2",
    managementId: "demo-management",
    name: "Tankless Water Heater",
    category: "Plumbing",
    manufacturer: "Rinnai",
    modelNo: "RU199iN",
    location: "Utility Room",
    notes: "Descale every 12 months. Check venting annually.",
    createdAt: now - 85 * 86400000,
    updatedAt: now - 30 * 86400000,
  },
  {
    id: "tmpl-3",
    managementId: "demo-management",
    name: "Smart Thermostat",
    category: "HVAC",
    manufacturer: "Ecobee",
    modelNo: "EB-STATE6L-01",
    location: "Main Hallway",
    notes: "Wi-Fi enabled. Replace batteries in remote sensors yearly.",
    createdAt: now - 80 * 86400000,
    updatedAt: now - 80 * 86400000,
  },
  {
    id: "tmpl-4",
    managementId: "demo-management",
    name: "Whole-House Generator",
    category: "Electrical",
    manufacturer: "Generac",
    modelNo: "7228",
    location: "Exterior / Rear",
    notes: "22kW standby. Oil change every 200 hours or annually.",
    createdAt: now - 70 * 86400000,
    updatedAt: now - 70 * 86400000,
  },
];

// ─── Dashboard Stats ───────────────────────────────────────

export function getDemoDashboardStats(role: "homeowner" | "management") {
  const allotment = demoTimeAllotments[0];

  if (role === "homeowner") {
    const myEquip = demoEquipment.filter((e) => e.userId === "demo-homeowner");
    const myNotifs = demoNotifications;
    const myTasks = demoTasks.filter((t) => t.homeownerId === "demo-homeowner");
    const myBills = demoBills.filter((b) => b.homeownerId === "demo-homeowner");

    return {
      equipmentCount: myEquip.length,
      pendingReminders: myNotifs.filter((n) => !n.read).length,
      activeTasks: myTasks.filter((t) => t.status !== "completed").length,
      pendingBills: myBills.filter((b) => b.status === "pending" || b.status === "overdue").length,
      timeAllotment: allotment,
      recentTasks: myTasks.slice(0, 5).map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        updatedAt: t.updatedAt,
      })),
      upcomingReminders: myNotifs
        .slice(0, 5)
        .map((n) => ({
          id: n.id,
          title: n.title,
          type: n.type,
          message: n.message,
          taskId: n.taskId,
          timestamp: n.timestamp,
          read: n.read,
        })),
    };
  }

  // Management sees everything
  return {
    equipmentCount: demoEquipment.length,
    pendingReminders: demoNotifications.filter((n) => !n.read).length,
    activeTasks: demoTasks.filter((t) => t.status !== "completed").length,
    pendingBills: demoBills.filter((b) => b.status === "pending" || b.status === "overdue").length,
    activeJobs: demoJobs.filter((j) => j.status === "active").length,
    timeAllotment: allotment,
    recentTasks: demoTasks.slice(0, 5).map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      updatedAt: t.updatedAt,
    })),
    upcomingReminders: demoNotifications
      .slice(0, 5)
      .map((n) => ({
        id: n.id,
        title: n.title,
        type: n.type,
        message: n.message,
        taskId: n.taskId,
        timestamp: n.timestamp,
        read: n.read,
      })),
  };
}

// ─── Helpers to get role-filtered data ─────────────────────

export function getDemoDashboardStatsForJob(homeownerId: string) {
  const myEquip = demoEquipment.filter((e) => e.userId === homeownerId);
  const myNotifs = demoNotifications;
  const myTasks = demoTasks.filter((t) => t.homeownerId === homeownerId);
  const myBills = demoBills.filter((b) => b.homeownerId === homeownerId);
  const myAllotment = demoTimeAllotments.find((a) => a.userId === homeownerId) || null;

  return {
    equipmentCount: myEquip.length,
    pendingReminders: myNotifs.filter((n) => !n.read).length,
    activeTasks: myTasks.filter((t) => t.status !== "completed").length,
    pendingBills: myBills.filter((b) => b.status === "pending" || b.status === "overdue").length,
    timeAllotment: myAllotment,
    recentTasks: myTasks.slice(0, 5).map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      updatedAt: t.updatedAt,
    })),
    upcomingReminders: myNotifs
      .slice(0, 5)
      .map((n) => ({
        id: n.id,
        title: n.title,
        type: n.type,
        message: n.message,
        taskId: n.taskId,
        timestamp: n.timestamp,
        read: n.read,
      })),
  };
}

export function getDemoDataForRole(role: "homeowner" | "management") {
  if (role === "management") {
    return {
      equipment: demoEquipment,
      notifications: demoNotifications,
      files: demoFiles,
      tasks: demoTasks,
      bills: demoBills,
      homeowners: demoHomeowners,
      timeAllotments: demoTimeAllotments,
      jobs: demoJobs,
      equipmentTemplates: demoEquipmentTemplates,
      myAllotment: null,
    };
  }

  const uid = "demo-homeowner";
  return {
    equipment: demoEquipment.filter((e) => e.userId === uid),
    notifications: demoNotifications,
    files: demoFiles.filter((f) => f.userId === uid),
    tasks: demoTasks.filter((t) => t.homeownerId === uid),
    bills: demoBills.filter((b) => b.homeownerId === uid),
    homeowners: [] as UserProfile[],
    timeAllotments: [],
    jobs: demoJobs.filter((j) => j.homeownerId === uid),
    equipmentTemplates: [] as EquipmentTemplate[],
    myAllotment: demoTimeAllotments[0],
  };
}
