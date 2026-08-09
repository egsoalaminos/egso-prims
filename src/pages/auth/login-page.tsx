import * as React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "motion/react";
import { AlertTriangle, Building2, Eye, EyeOff, KeyRound, LogIn } from "lucide-react";

import {
  Button,
  Caption,
  Checkbox,
  ConfirmationModal,
  Field,
  Input,
  toast,
} from "@/components";
import { DEV_CREDENTIALS, useAuth } from "@/features/auth/auth-context";
import { useBranding } from "@/features/config/use-appearance";
import { BURGUNDY, GOLD, PAPER, RULE, SERIF } from "@/features/portal/theme";

const loginSchema = z.object({
  email: z.string().min(1, "Enter your email address").email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
  remember: z.boolean(),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { status, signIn, requestPasswordReset, supabaseActive } = useAuth();
  const branding = useBranding();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/";

  const [showPassword, setShowPassword] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [authError, setAuthError] = React.useState<string | null>(null);
  const [resetOpen, setResetOpen] = React.useState(false);
  const [resetEmail, setResetEmail] = React.useState("");
  const [resetSending, setResetSending] = React.useState(false);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    // Off by default. These are shared office desktops and the system keeps an
    // audit trail: a session left open records the next person's actions under
    // the previous person's name. Anyone on their own machine can still tick it.
    defaultValues: { email: "", password: "", remember: false },
  });
  const remember = form.watch("remember");

  if (status === "authenticated") {
    return <Navigate to={from} replace />;
  }

  const submit = form.handleSubmit(async (values) => {
    setSubmitting(true);
    setAuthError(null);
    const result = await signIn(values.email, values.password, values.remember);
    setSubmitting(false);
    if (result.error) {
      setAuthError(result.error);
    } else {
      toast.success("Welcome back, Administrator");
    }
  });

  const sendReset = async () => {
    if (!resetEmail.trim()) return;
    setResetSending(true);
    const result = await requestPasswordReset(resetEmail.trim());
    setResetSending(false);
    setResetOpen(false);
    if (result.error) toast.error(result.error);
    else
      toast.success(
        supabaseActive
          ? "Password reset link sent — check the account's inbox."
          : "Reset request recorded — the system administrator will contact you.",
      );
  };

  return (
    // `data-municipal` is the same hook the portal root carries. It buys the
    // burgundy accent and the square corners from the stylesheet without
    // editing `Button` or `Input` — both are the admin's components too.
    <div
      data-municipal
      className="grid min-h-screen place-items-center px-4 font-sans antialiased"
      style={{ background: PAPER }}
    >
      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        className="w-full max-w-sm"
      >
        {/*
         * The same letterhead the portal opens with, centred for a login card:
         * Republic, province, municipality, office. The seal is shown bare —
         * it was previously clipped into a rounded square and given a drop
         * shadow, which turns a coat of arms into an app icon.
         */}
        <div className="mb-6 flex flex-col items-center text-center">
          {branding.logo ? (
            <img src={branding.logo} alt="" className="h-16 w-16 object-contain" />
          ) : (
            <div className="grid h-16 w-16 place-items-center rounded-full bg-neutral-900 text-white">
              <Building2 className="h-7 w-7" />
            </div>
          )}
          <p className="mt-3 text-[9.5px] uppercase tracking-[0.16em] text-neutral-500">
            Republic of the Philippines
          </p>
          <p className="text-[9.5px] uppercase tracking-[0.16em] text-neutral-500">
            Province of Laguna
          </p>
          <h1
            className="mt-1 text-[21px] leading-tight tracking-tight"
            style={{ fontFamily: SERIF, color: BURGUNDY, fontWeight: 600 }}
          >
            Municipality of Alaminos
          </h1>
          <p className="mt-0.5 text-[12.5px] font-medium text-neutral-700">
            {branding.officeName}
          </p>

          {/* The seam every other municipal surface uses. */}
          <span className="mt-4 block h-[2px] w-16" style={{ background: GOLD }} />
        </div>

        {/*
         * A plain bordered surface rather than `ContainerCard`. Its
         * `rounded-xl` compiles to `calc(var(--radius) + 4px)` — the offset is
         * baked into the utility by `@theme inline`, so zeroing `--radius` in
         * the municipal scope still leaves 4px. The portal builds its own
         * surfaces this way for the same reason.
         */}
        <div className="border bg-white p-6" style={{ borderColor: RULE }}>
          <form onSubmit={submit} className="space-y-4">
            {authError && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5"
              >
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-600" />
                <p className="text-[11.5px] leading-snug text-red-700">{authError}</p>
              </motion.div>
            )}

            <Field label="Email Address" required error={form.formState.errors.email?.message}>
              <Input
                type="email"
                autoComplete="email"
                placeholder="name@alaminos.gov.ph"
                invalid={!!form.formState.errors.email}
                {...form.register("email")}
              />
            </Field>

            <Field label="Password" required error={form.formState.errors.password?.message}>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••••"
                  className="pr-9"
                  invalid={!!form.formState.errors.password}
                  {...form.register("password")}
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 transition hover:text-neutral-700"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>

            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2 text-[12.5px] text-neutral-700">
                <Checkbox
                  checked={remember}
                  onCheckedChange={(v) => form.setValue("remember", !!v)}
                />
                Remember me
              </label>
              <button
                type="button"
                onClick={() => {
                  setResetEmail(form.getValues("email"));
                  setResetOpen(true);
                }}
                className="text-[12.5px] font-medium text-neutral-500 transition hover:text-neutral-900"
              >
                Forgot password?
              </button>
            </div>

            <Button type="submit" loading={submitting} className="w-full py-2">
              {!submitting && <LogIn />}
              Sign In
            </Button>
          </form>
        </div>

        {!supabaseActive && (
          <div className="mt-3 rounded-lg border border-dashed border-neutral-300 bg-white/60 px-3 py-2.5 text-center">
            <Caption className="text-[10.5px]">
              Development mode — Supabase not configured. Sign in with{" "}
              <span className="font-medium text-neutral-700">{DEV_CREDENTIALS.email}</span> /{" "}
              <span className="font-medium text-neutral-700">{DEV_CREDENTIALS.password}</span>
            </Caption>
          </div>
        )}

        <p className="mt-4 text-center text-[10.5px] text-neutral-400">
          Authorized personnel only. All activity is recorded in the audit trail.
        </p>
      </motion.div>

      <ConfirmationModal
        open={resetOpen}
        onOpenChange={setResetOpen}
        icon={KeyRound}
        tone="neutral"
        title="Reset password"
        description="Enter the account's email address and we'll send a password reset link."
        confirmLabel="Send Reset Link"
        loading={resetSending}
        onConfirm={sendReset}
      >
        <div className="mt-3">
          <Input
            type="email"
            placeholder="name@alaminos.gov.ph"
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
          />
        </div>
      </ConfirmationModal>
    </div>
  );
}
