import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save } from "lucide-react";

import {
  Button,
  Drawer,
  DrawerActions,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  Field,
  Input,
  toast,
} from "@/components";
import {
  createWaterAccount,
  updateWaterAccount,
  type AccountDraftInput,
} from "@/features/water/api";
import type { WaterAccount } from "@/features/water/types";

const accountSchema = z.object({
  accountNumber: z.string().min(3, "Enter the water account number"),
  accountName: z.string().optional(),
  location: z.string().min(3, "Enter the location served by this account"),
  meterNumber: z.string().min(3, "Enter the meter number"),
});

type AccountValues = z.infer<typeof accountSchema>;

/** Right slide-over for registering or editing a water account. */
export function WaterAccountForm({
  open,
  onOpenChange,
  account,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Existing account when editing; omit to create. */
  account?: WaterAccount | null;
  onSaved?: () => void;
}) {
  const isEdit = !!account;
  const [submitting, setSubmitting] = React.useState(false);

  const form = useForm<AccountValues>({
    resolver: zodResolver(accountSchema),
    mode: "onTouched",
    defaultValues: { accountNumber: "", accountName: "", location: "", meterNumber: "" },
  });

  // Reload defaults whenever the drawer opens for a different record.
  React.useEffect(() => {
    if (!open) return;
    form.reset({
      accountNumber: account?.accountNumber ?? "",
      accountName: account?.accountName ?? "",
      location: account?.location ?? "",
      meterNumber: account?.meterNumber ?? "",
    });
  }, [open, account, form]);

  const submit = form.handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      const input: AccountDraftInput = values;
      const saved = isEdit
        ? await updateWaterAccount(account!.id, input)
        : await createWaterAccount(input);
      toast.success(isEdit ? `${saved.accountNumber} updated` : `${saved.accountNumber} registered`);
      onOpenChange(false);
      onSaved?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unable to save the account");
    }
    setSubmitting(false);
  });

  const err = form.formState.errors;

  return (
    <Drawer open={open} onOpenChange={onOpenChange} size="md">
      <DrawerHeader
        title={isEdit ? `Edit ${account?.accountNumber}` : "New Water Account"}
        description="Water accounts are registered manually by the administrator."
        onClose={() => onOpenChange(false)}
      />
      <DrawerBody>
        <div className="space-y-4">
          <Field label="Account Number" required error={err.accountNumber?.message}>
            <Input
              placeholder="e.g. WD-2024-1101"
              invalid={!!err.accountNumber}
              {...form.register("accountNumber")}
            />
          </Field>
          <Field
            label="Account Name"
            helper="Optional — a friendly label such as the building or facility served."
            error={err.accountName?.message}
          >
            <Input
              placeholder="e.g. Municipal Hall — Main Building"
              {...form.register("accountName")}
            />
          </Field>
          <Field label="Location" required error={err.location?.message}>
            <Input
              placeholder="e.g. Poblacion — Municipal Compound"
              invalid={!!err.location}
              {...form.register("location")}
            />
          </Field>
          <Field label="Meter Number" required error={err.meterNumber?.message}>
            <Input
              placeholder="e.g. WMTR-51002310"
              invalid={!!err.meterNumber}
              {...form.register("meterNumber")}
            />
          </Field>
        </div>
      </DrawerBody>
      <DrawerFooter>
        <DrawerActions>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={submit} loading={submitting}>
            <Save />
            {isEdit ? "Save Changes" : "Register Account"}
          </Button>
        </DrawerActions>
      </DrawerFooter>
    </Drawer>
  );
}
