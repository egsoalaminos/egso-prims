import { Toaster as SonnerToaster, toast } from "sonner";

/**
 * App-level toast outlet. Mount once in the root layout; fire toasts via the
 * re-exported `toast` API (toast.success, toast.error, …).
 */
export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            "rounded-xl border border-neutral-200 bg-white text-neutral-800 shadow-lg",
          title: "text-[12.5px] font-medium",
          description: "text-[11.5px] text-neutral-500",
        },
      }}
    />
  );
}

export { toast };
