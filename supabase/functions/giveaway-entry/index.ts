import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve(async (req: Request) => {
  try {
    const { email } = await req.json();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) return Response.json({ error: "Invalid email" }, { status: 400 });
    const normalizedEmail = email.trim().toLowerCase();
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    if (!serviceRoleKey) return Response.json({ error: "Giveaway is not configured." }, { status: 503 });
    const serviceHeaders = { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` };
    const giveawayMonth = new Date().toISOString().slice(0, 7);
    const { data: existing } = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/rest/v1/giveaway_entries?select=id&email=eq.${encodeURIComponent(normalizedEmail)}&giveaway_month=eq.${giveawayMonth}`,
      { headers: serviceHeaders }
    ).then(r => r.json().catch(() => []));
    if (Array.isArray(existing) && existing.length > 0) return Response.json({ success: false, message: "already_entered" });
    const response = await fetch(`${Deno.env.get("SUPABASE_URL")}/rest/v1/giveaway_entries`, {
      method: "POST",
      headers: { ...serviceHeaders, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ email: normalizedEmail, giveaway_month: giveawayMonth, is_winner: false })
    });
    if (response.status === 409) return Response.json({ success: false, message: "already_entered" });
    if (!response.ok) return Response.json({ error: await response.text() }, { status: 500 });
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Giveaway error" }, { status: 500 });
  }
});