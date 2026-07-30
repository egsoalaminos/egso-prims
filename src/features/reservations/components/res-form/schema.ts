import { z } from "zod";

export const resEquipmentSchema = z.object({
  equipmentId: z.string().min(2, "Name the equipment"),
  quantity: z.number({ error: "Required" }).positive("Must be more than 0"),
  remarks: z.string().optional(),
});

export const resFormSchema = z
  .object({
    borrower: z.string().min(3, "Enter the borrower's name"),
    departmentCode: z.string().min(2, "Enter the requesting office"),
    contactNumber: z.string().min(7, "Enter a contact number"),
    purpose: z.string().min(10, "Describe the activity (at least 10 characters)"),
    facilityId: z.string().min(2, "Enter the facility"),
    date: z.date({ error: "Pick the reservation date" }),
    startTime: z.string().min(1, "Start time"),
    endTime: z.string().min(1, "End time"),
    equipment: z.array(resEquipmentSchema),
  })
  .refine((v) => v.startTime < v.endTime, {
    message: "End time must be after the start time",
    path: ["endTime"],
  });

export type ResFormValues = z.infer<typeof resFormSchema>;

/** Field names validated before leaving each wizard step. */
export const RES_STEP_FIELDS: (keyof ResFormValues)[][] = [
  ["borrower", "departmentCode", "contactNumber", "purpose"],
  ["facilityId", "date", "startTime", "endTime"],
  ["equipment"],
  [],
];
