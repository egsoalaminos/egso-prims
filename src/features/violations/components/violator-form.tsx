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
  Textarea,
  toast,
} from "@/components";
import { updateViolator } from "@/features/violations/api";
import type { Violator } from "@/features/violations/types";

const violatorSchema = z.object({
  fullName: z.string().trim().min(1, "Enter the violator's full name"),
  contactNumber: z.string().optional(),
  email: z.union([z.literal(""), z.email("Enter a valid email address")]).optional(),
  address: z.string().optional(),
});

type ViolatorValues = z.infer<typeof violatorSchema>;

/**
 * Corrects an existing violator's details.
 *
 * Profiles are never created here — recording a violation creates or matches
 * one automatically — so this form only ever edits someone already on file.
 */
export function ViolatorForm({
  open,
  onOpenChange,
  violator,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The profile being corrected. */
  violator: Violator | null;
  onSaved?: (violator: Violator) => void;
}) {
  const [submitting, setSubmitting] = React.useState(false);

  const form = useForm<ViolatorValues>({
    resolver: zodResolver(violatorSchema),
    mode: "onTouched",
    defaultValues: { fullName: "", contactNumber: "", email: "", address: "" },
  });

  React.useEffect(() => {
    if (!open) return;
    form.reset({
      fullName: violator?.fullName ?? "",
      contactNumber: violator?.contactNumber ?? "",
      email: violator?.email ?? "",
      address: violator?.address ?? "",
    });
  }, [open, violator, form]);

  const submit = form.handleSubmit(async (values) => {
    if (!violator) return;
    setSubmitting(true);
    try {
      const saved = await updateViolator(violator.id, values);
      toast.success("Violator profile updated");
      onOpenChange(false);
      onSaved?.(saved);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unable to save the violator profile");
    }
    setSubmitting(false);
  });

  const err = form.formState.errors;

  return (
    <Drawer open={open} onOpenChange={onOpenChange} size="md">
      <DrawerHeader
        title="Edit Violator Profile"
        description="Update the person's details. Their violation history is unaffected."
        onClose={() => onOpenChange(false)}
      />
      <DrawerBody>
        <div className="space-y-4">
          <Field
            label="Full Name"
            required
            error={err.fullName?.message}
            helper="Recorded as it should appear on the printed report, e.g. Nasol, Richard."
          >
            <Input
              placeholder="e.g. Nasol, Richard"
              invalid={!!err.fullName}
              {...form.register("fullName")}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Contact Number" error={err.contactNumber?.message}>
              <Input placeholder="Optional — e.g. 0917 845 2210" {...form.register("contactNumber")} />
            </Field>
            <Field label="Email Address" error={err.email?.message}>
              <Input
                type="email"
                placeholder="Optional"
                invalid={!!err.email}
                {...form.register("email")}
              />
            </Field>
          </div>

          <Field label="Address" error={err.address?.message}>
            <Textarea
              rows={2}
              placeholder="Optional — e.g. Brgy. San Agustin, Alaminos, Laguna"
              {...form.register("address")}
            />
          </Field>
        </div>
      </DrawerBody>
      <DrawerFooter>
        <DrawerActions>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={submit} loading={submitting} disabled={!violator}>
            <Save />
            Save Changes
          </Button>
        </DrawerActions>
      </DrawerFooter>
    </Drawer>
  );
}
