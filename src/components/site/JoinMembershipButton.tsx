import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/use-session";

declare global {
  interface Window { Razorpay?: new (opts: Record<string, unknown>) => { open: () => void } }
}

function loadCheckout() {
  return new Promise<void>((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Couldn't load checkout."));
    document.body.appendChild(s);
  });
}

export function JoinMembershipButton() {
  const { user } = useSession();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  async function join() {
    if (!user) {
      toast.info("Please sign in first to join the membership.");
      navigate({ to: "/auth/student" });
      return;
    }
    setBusy(true);
    try {
      await loadCheckout();
      const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_placeholder";
      const rzp = new window.Razorpay!({
        key: keyId,
        name: "PUPUK Academy",
        description: "Membership — RM20/month",
        prefill: { email: user.email ?? undefined },
        handler: () => {
          toast.success("Payment initiated! We will confirm your membership shortly.");
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      rzp.open();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't start checkout.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button variant="pill" size="xl" className="mt-6 w-full" disabled={busy} onClick={join}>
      {busy && <Loader2 className="animate-spin" />} Join Membership
    </Button>
  );
}
