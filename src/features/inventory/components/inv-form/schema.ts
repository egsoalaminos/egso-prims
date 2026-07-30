import { z } from "zod";

export const itemFormSchema = z
  .object({
    name: z.string().min(3, "Enter the item name"),
    category: z.string().min(2, "Select or name a category"),
    description: z.string().optional(),
    unit: z.string().min(1, "Unit"),
    beginningBalance: z
      .number({ error: "Enter the quantity" })
      .min(0, "Cannot be negative"),
    unitPrice: z.number({ error: "Required" }).positive("Must be more than 0"),
  });

export type ItemFormValues = z.infer<typeof itemFormSchema>;

/** Field names validated before leaving each wizard step. */
export const ITEM_STEP_FIELDS: (keyof ItemFormValues)[][] = [
  ["name", "category", "unit"],
  ["beginningBalance", "unitPrice"],
  [],
  [],
];
