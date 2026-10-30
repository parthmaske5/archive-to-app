import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function creds() {
  const keyId = process.env["RAZORPAY_KEY_ID"];
  const secret = process.env["RAZORPAY_KEY_SECRET"];
  const planId = process.env["RAZORPAY_PLAN_ID"];
  if (!keyId || !secret || !planId) throw new Error("Payments are not set up yet.");
  return { keyId, secret, planId };
}

export const createMembershipSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { keyId, secret, planId } = creds();
    const res = await fetch("https://api.razorpay.com/v1/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Basic " + btoa(`${keyId}:${secret}`) },
      body: JSON.stringify({ plan_id: planId, total_count: 120, customer_notify: 1, notes: { user_id: context.userId } }),
    });
    const sub = (await res.json()) as { id?: string; error?: { description?: string } };
    if (!res.ok || !sub.id) {
      console.error("Razorpay subscription error", sub);
      throw new Error("Couldn't start checkout. Please try again.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = (context.claims as { email?: string }).email ?? null;
    await supabaseAdmin.from("memberships").insert({ user_id: context.userId, email, razorpay_subscription_id: sub.id });
    return { subscriptionId: sub.id, keyId, email };
  });

export const confirmMembershipPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ paymentId: z.string().min(1), subscriptionId: z.string().min(1), signature: z.string().min(1) }).parse(d))
  .handler(async ({ data, context }) => {
    const { secret } = creds();
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${data.paymentId}|${data.subscriptionId}`));
    const hex = [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
    if (hex !== data.signature) throw new Error("Payment could not be verified.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("memberships").update({ status: "paid", razorpay_payment_id: data.paymentId, updated_at: new Date().toISOString() })
      .eq("razorpay_subscription_id", data.subscriptionId).eq("user_id", context.userId);
    return { ok: true };
  });
