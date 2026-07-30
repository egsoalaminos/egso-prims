import { z } from "zod";

export const poItemSchema = z.object({
  description: z.string().min(3, "Describe the item"),
  quantity: z.number({ error: "Required" }).positive("Must be more than 0"),
  unit: z.string().min(1, "Unit"),
  unitCost: z.number({ error: "Required" }).positive("Must be more than 0"),
});

export const poFormSchema = z.object({
  prNumber: z.string().min(1, "Select the source purchase request"),
  departmentCode: z.string().min(1),
  requester: z.string().min(1),
  purpose: z.string().min(1),
  supplierName: z.string().min(2, "Enter the supplier"),
  supplierAddress: z.string().optional(),
  supplierTin: z.string().optional(),
  supplierContact: z.string().optional(),
  modeOfProcurement: z.string().optional(),
  paymentTerm: z.string().optional(),
  deliveryTerm: z.string().optional(),
  municipalMayor: z.string().optional(),
  bacSecretary: z.string().optional(),
  deliveryAddress: z.string().min(8, "Enter the delivery address"),
  expectedDelivery: z.date({ error: "Pick the expected delivery date" }),
  items: z.array(poItemSchema).min(1, "Add at least one item"),
});

export type POFormValues = z.infer<typeof poFormSchema>;

/** Field names validated before leaving each wizard step. */
export const PO_STEP_FIELDS: (keyof POFormValues)[][] = [
  ["prNumber", "supplierName", "deliveryAddress", "expectedDelivery"],
  ["items"],
  [],
  [],
];
