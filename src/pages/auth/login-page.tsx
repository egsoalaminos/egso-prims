import * as React from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Eye, EyeOff, KeyRound } from "lucide-react";

import { ConfirmationModal, Input, Spinner, toast } from "@/components";
import { DEV_CREDENTIALS, useAuth } from "@/features/auth/auth-context";
import { useBranding } from "@/features/config/use-appearance";

const loginSchema = z.object({
  email: z.string().min(1, "Enter your email address").email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
  remember: z.boolean(),
});

type LoginValues = z.infer<typeof loginSchema>;

/** Strong ease-out: the sheet arrives quickly and settles. */
const EASE_OUT = [0.23, 1, 0.32, 1] as const;

const fieldClass =
  "h-11 w-full rounded-md border border-neutral-400 bg-white px-3.5 text-[14px] text-neutral-900 transition-colors placeholder:text-neutral-500 focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/15 aria-invalid:border-red-600 aria-invalid:ring-2 aria-invalid:ring-red-600/15";

/**
 * The admin's sign-in page, set as a sheet of the municipality's letterhead.
 *
 * It shares the staff portal's palette, corners and serif, but not its layout:
 * the owner wanted the office's own entrance to look a little different from
 * the public counter. The page takes the portal's token scope (`data-portal`)
 * so the reset-password dialog, portalled to <body>, gets the same corners
 * and crimson.
 */
export function LoginPage() {
  const { status, signIn, requestPasswordReset, supabaseActive } = useAuth();
  const branding = useBranding();
  const location = useLocation();
  const reduce = useReducedMotion();
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
  const { errors } = form.formState;

  React.useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-portal", "");
    return () => root.removeAttribute("data-portal");
  }, []);

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
      toast.success(`Welcome back, ${result.user?.name ?? "Administrator"}`);
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

  // The letterhead's municipality line is the organisation name without its
  // province, which the letterhead gives a line of its own.
  const municipality = branding.organizationName.split(",")[0].trim();
  const enter = (delay = 0) => ({
    initial: reduce ? false : { opacity: 0, transform: "translateY(8px)" },
    animate: { opacity: 1, transform: "translateY(0px)" },
    transition: { duration: 0.36, delay, ease: EASE_OUT },
  });

  return (
    <div data-portal="" className="flex min-h-[100dvh] flex-col bg-canvas font-sans text-neutral-900 antialiased">
      <div aria-hidden="true" className="h-1.5 bg-(--accent-solid)" />

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-4 sm:py-6">
        <motion.div
          {...enter()}
          className="w-full max-w-[440px] rounded-md border border-neutral-200 bg-white"
        >
          {/* Set the way the municipality heads its own letters: centred, seal above. */}
          <header className="px-6 pb-4 pt-5 text-center sm:px-8 sm:pt-6">
            <img
              src={branding.logo}
              alt={`Seal of the ${municipality}`}
              className="mx-auto h-14 w-14 object-contain"
            />
            <p className="mt-3 text-[12.5px] leading-snug text-neutral-500">
              Republic of the Philippines
              <br />
              Province of {branding.province}
            </p>
            <p className="mt-1.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-neutral-700">
              {municipality}
            </p>
            <p className="font-['Spectral',ui-serif,Georgia,serif] text-[20px] font-medium leading-tight text-neutral-900">
              {branding.officeName}
            </p>
          </header>
          {/* The letterhead's rule. */}
          <div aria-hidden="true" className="mx-6 h-0.5 bg-(--accent-solid) sm:mx-8" />

          <div className="px-6 pb-5 pt-4 sm:px-8 sm:pb-6">
            <h1 className="text-[20px] font-semibold tracking-[-0.01em]">Sign in</h1>
            <p className="mt-0.5 text-[14px] text-neutral-500">
              Purchase Request &amp; Inventory Management System
            </p>

            <form onSubmit={submit} noValidate className="mt-4">
              {authError && (
                <p
                  role="alert"
                  className="mb-3 rounded-md border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] leading-snug text-red-700"
                >
                  {authError}
                </p>
              )}

              <label htmlFor="login-email" className="block text-[14px] font-medium text-neutral-900">
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="name@alaminos.gov.ph"
                aria-invalid={errors.email ? true : undefined}
                aria-describedby={errors.email ? "login-email-error" : undefined}
                className={`${fieldClass} mt-1.5`}
                {...form.register("email")}
              />
              {errors.email && (
                <p id="login-email-error" className="mt-1.5 text-[12.5px] text-red-700">
                  {errors.email.message}
                </p>
              )}

              <div className="mt-4 flex items-baseline justify-between gap-3">
                <label htmlFor="login-password" className="block text-[14px] font-medium text-neutral-900">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(form.getValues("email"));
                    setResetOpen(true);
                  }}
                  className="rounded-md text-[13px] font-medium text-neutral-600 underline-offset-2 hover:text-neutral-900 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent-ring)"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative mt-1.5">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  aria-invalid={errors.password ? true : undefined}
                  aria-describedby={errors.password ? "login-password-error" : undefined}
                  className={`${fieldClass} pr-12`}
                  {...form.register("password")}
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-0 top-0 grid h-11 w-11 place-items-center rounded-md text-neutral-500 transition-colors hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-(--accent-ring)"
                >
                  {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                </button>
              </div>
              {errors.password && (
                <p id="login-password-error" className="mt-1.5 text-[12.5px] text-red-700">
                  {errors.password.message}
                </p>
              )}

              {/* Worded for the shared office computer: ticking it there leaves the
                  account open to the next person. */}
              <label className="mt-4 flex w-fit cursor-pointer items-center gap-2.5 text-[14px] text-neutral-700">
                <input
                  type="checkbox"
                  className="h-[18px] w-[18px] shrink-0 cursor-pointer accent-(--accent-solid)"
                  {...form.register("remember")}
                />
                Keep me signed in on this computer
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="group ui-accent ui-accent-hover mt-5 flex h-11 w-full items-center justify-between rounded-md px-4 text-[14px] font-semibold transition-[background-color,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent-ring) focus-visible:ring-offset-2 active:scale-[0.98] disabled:opacity-80"
              >
                {submitting ? "Signing in…" : "Sign in"}
                {submitting ? (
                  <Spinner size="sm" label="Signing in" />
                ) : (
                  <ArrowRight className="h-[18px] w-[18px] transition-transform duration-150 ease-out group-hover:translate-x-[3px]" />
                )}
              </button>
            </form>
          </div>
        </motion.div>

        <motion.div {...enter(0.04)} className="mt-3 w-full max-w-[440px] space-y-1.5 text-center">
          {!supabaseActive && (
            <p className="rounded-md border border-dashed border-neutral-300 bg-white px-3.5 py-2.5 text-[12.5px] text-neutral-600">
              Development mode: Supabase is not configured. Sign in with{" "}
              <span className="font-medium text-neutral-900">{DEV_CREDENTIALS.email}</span> /{" "}
              <span className="font-medium text-neutral-900">{DEV_CREDENTIALS.password}</span>
            </p>
          )}
          <p className="text-[13px] text-neutral-500">
            Authorized personnel only. All activity is recorded in the audit trail.
          </p>
          <p className="text-pretty text-[14px] text-neutral-600">
            Filing or tracking a request? You do not need an account.{" "}
            <Link
              to="/portal"
              className="whitespace-nowrap rounded-md font-medium text-neutral-900 underline underline-offset-2 hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent-ring)"
            >
              Go to the staff portal
            </Link>
          </p>
        </motion.div>
      </main>

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
