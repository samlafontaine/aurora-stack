import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const { userId, priceId } = await req.json();

  if (!userId || !priceId) {
    return NextResponse.json({ error: "Missing userId or priceId" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", userId)
    .single();

  let customerId = profile?.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      metadata: { supabase_user_id: userId },
    });
    customerId = customer.id;
    await supabase
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", userId);
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${req.headers.get("origin") || "https://app.usespara.com"}?upgraded=true`,
    cancel_url: `${req.headers.get("origin") || "https://app.usespara.com"}`,
    metadata: { supabase_user_id: userId },
  });

  return NextResponse.json({ url: session.url });
}
