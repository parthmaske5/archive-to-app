import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/use-session";
import { confirmMembershipPayment, createMembershipSubscription } from "@/lib/membership.functions";

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
  const create = useServerFn(createMembershipSubscription);
  const confirm = useServerFn(confirmMembershipPayment);
  const [busy, setBusy] = useState(false);

  async function join() {
    if (!user) { toast.info("Please sign in first to join the membership."); navigate({ to: "/auth/student" }); return; }
    setBusy(true);
    try {
      await loadCheckout();
      const { subscriptionId, keyId, email } = await create();
      const rzp = new window.Razorpay!({
        key: keyId,
        subscription_id: subscriptionId,
        name: "PUPUK Academy",
        description: "Membership — RM20/month",
        prefill: { email: email ?? undefined },
        handler: async (r: { razorpay_payment_id: string; razorpay_subscription_id: string; razorpay_signature: string }) => {
          try {
            await confirm({ data: { paymentId: r.razorpay_payment_id, subscriptionId: r.razorpay_subscription_id, signature: r.razorpay_signature } });
            toast.success("Payment received! Your access will be activated shortly.");
          } catch { toast.error("We couldn't verify the payment. Please contact us."); }
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      rzp.open();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't start checkout.");
    } finally { setBusy(false); }
  }

  return (
    <Button variant="pill" size="xl" className="mt-6 w-full" disabled={busy} onClick={join}>
      {busy && <Loader2 className="animate-spin" />} Join Membership
    </Button>
  );
}
