export type UserRole = "homeowner" | "management";

export interface UserProfile {
  id: string;
  clerkId: string;
  role: UserRole;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  company?: string;
  createdAt: number;
}

export interface EquipmentPhoto {
  url: string;
  fileId: string;
}

export interface Equipment {
  id: string;
  userId: string;
  managementId?: string;
  jobId?: string;
  name: string;
  category: string;
  datePurchased?: string;
  warrantyExpiration?: string;
  modelNo?: string;
  serialNo?: string;
  manufacturer?: string;
  location?: string;
  notes?: string;
  /** @deprecated use photos[] */
  photoUrl?: string;
  /** @deprecated use photos[] */
  photoFileId?: string;
  photos?: EquipmentPhoto[];
  createdAt: number;
  updatedAt: number;
}

export type NotificationType =
  | "new_task"
  | "task_comment"
  | "task_high_priority"
  | "task_completed";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  taskId?: string;
  taskTitle?: string;
  equipmentId?: string;
  equipmentName?: string;
  jobId?: string;
  timestamp: number;
  read: boolean;
}

export interface FileRecord {
  id: string;
  userId: string;
  managementId?: string;
  jobId?: string;
  equipmentId?: string;
  equipmentName?: string;
  name: string;
  url: string;
  appwriteFileId: string;
  type: string;
  size: number;
  createdAt: number;
}

export interface TaskUpdate {
  id: string;
  message: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  timestamp: number;
}

export interface Task {
  id: string;
  homeownerId: string;
  managementId?: string;
  jobId?: string;
  homeownerName?: string;
  assignedTo?: string;
  assignedToName?: string;
  title: string;
  description?: string;
  status: "pending" | "in-progress" | "completed";
  priority: "low" | "medium" | "high";
  equipmentId?: string;
  equipmentName?: string;
  updates: Record<string, TaskUpdate>;
  createdAt: number;
  updatedAt: number;
}

export interface BillingRecord {
  id: string;
  homeownerId: string;
  managementId?: string;
  jobId?: string;
  homeownerName?: string;
  description: string;
  amount: number;
  status: "pending" | "paid" | "overdue";
  dueDate: string;
  paidDate?: string;
  createdAt: number;
}

export interface TimeAllotment {
  userId: string;
  quarterlyMinutes: number;
  usedMinutes: number;
  quarterStart: string;
  quarterEnd: string;
}

export interface HandymanTime {
  id: string;
  userId: string;
  managementId: string;
  jobId: string;
  jobTitle?: string;
  startTime: string; // ISO datetime
  endTime: string;   // ISO datetime
  notes?: string;
  createdAt: number;
}

export interface Job {
  id: string;
  managementId: string;
  managementName?: string;
  homeownerId: string;
  homeownerName?: string;
  title: string;
  address?: string;
  status: "active" | "paused" | "completed";
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface EquipmentTemplate {
  id: string;
  managementId: string;
  name: string;
  category: string;
  modelNo?: string;
  manufacturer?: string;
  location?: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}
