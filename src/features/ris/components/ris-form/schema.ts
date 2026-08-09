import { z } from "zod";

export const risItemSchema = z.object({
  /** What the requester asked for, typed by hand. */
  name: z.string().min(2, "Name the item"),
  /** Set when the typed name matches the stock register. */
  inventoryItemId: z.string().optional(),
  requestedQty: z.number({ error: "Required" }).positive("Must be more than 0"),
  issuedQty: z.number({ error: "Required" }).positive("Must be more than 0"),
});

export const risFormSchema = z.object({
  /** Absent on portal submissions, which do not start from a request. */
  prNumber: z.string().optional(),
  poNumber: z.string().optional(),
  requester: z.string().min(3, "Enter who is requesting"),
  departmentCode: z.string().min(2, "Enter the office"),
  fund: z.string().optional(),
  division: z.string().optional(),
  fppCode: z.string().optional(),
  purpose: z.string().min(3, "State what the items are for"),
  items: z.array(risItemSchema).min(1, "Add at least one item"),
});

export type RISFormValues = z.infer<typeof risFormSchema>;

/** Field names validated before leaving each wizard step. */
export const RIS_STEP_FIELDS: (keyof RISFormValues)[][] = [
  ["requester", "departmentCode", "purpose"],
  ["items"],
  [],
  [],
];
