import { z } from "zod";

export const equipmentSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  category: z.string().min(1, "Category is required").max(100),
  datePurchased: z.string().optional(),
  warrantyExpiration: z.string().optional(),
  modelNo: z.string().max(100).optional(),
  serialNo: z.string().max(100).optional(),
  manufacturer: z.string().max(200).optional(),
  location: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
  jobId: z.string().optional(),
});

export const taskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional(),
  priority: z.enum(["low", "medium", "high"]),
  equipmentId: z.string().optional(),
  homeownerId: z.string().optional(),
  jobId: z.string().optional(),
});

export const taskUpdateSchema = z.object({
  message: z.string().min(1, "Message is required").max(2000),
  photos: z
    .array(
      z.object({
        url: z.string().url(),
        fileId: z.string(),
        fileName: z.string().optional(),
        fileSize: z.number().optional(),
      }),
    )
    .max(10)
    .optional(),
});

export const billingSchema = z.object({
  description: z.string().min(1, "Description is required").max(500),
  amount: z.number().positive("Amount must be positive"),
  dueDate: z.string().min(1, "Due date is required"),
  homeownerId: z.string().min(1, "Homeowner is required"),
  jobId: z.string().optional(),
});

export const profileSchema = z.object({
  role: z.enum(["homeowner", "management"]),
  name: z.string().min(1).max(200),
  phone: z.string().max(20).optional(),
  address: z.string().max(500).optional(),
  company: z.string().max(200).optional(),
});

export const timeAllotmentSchema = z.object({
  userId: z.string().min(1),
  quarterlyMinutes: z.number().min(0),
});

export const jobSchema = z.object({
  homeownerId: z.string().min(1, "Homeowner is required"),
  title: z.string().min(1, "Title is required").max(200),
  address: z.string().max(500).optional(),
  status: z.enum(["active", "paused", "completed"]).optional(),
  notes: z.string().max(2000).optional(),
});

export const equipmentTemplateSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  category: z.string().min(1, "Category is required").max(100),
  modelNo: z.string().max(100).optional(),
  manufacturer: z.string().max(200).optional(),
  location: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
});
