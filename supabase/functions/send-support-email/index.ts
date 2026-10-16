import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

// PROVISIONAL: replace this recipient with the final WedConnect support address before launch.
const PROVISIONAL_SUPPORT_EMAIL = "albert.fuerst.usa@gmail.com";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character] || character);
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const resendKey = Deno.env.get("RESEND_API_KEY");
  const fromEmail = Deno.env.get("SUPPORT_FROM_EMAIL");
  if (!supabaseUrl || !serviceKey || !resendKey || !fromEmail) {
    return json({ error: "Support e-mail is not configured." }, 503);
  }

  const authorization = request.headers.get("Authorization") || "";
  const accessToken = authorization.replace(/^Bearer\s+/i, "");
  if (!accessToken) return json({ error: "Authentication required." }, 401);

  let messageId: string;
  try {
    const payload = await request.json();
    messageId = typeof payload.message_id === "string" ? payload.message_id : "";
  } catch {
    return json({ error: "Invalid JSON." }, 400);
  }
  if (!messageId) return json({ error: "message_id is required." }, 400);

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const { data: authData, error: authError } = await admin.auth.getUser(accessToken);
  const actor = authData.user;
  if (authError || !actor) return json({ error: "Invalid session." }, 401);

  const { data: message, error: messageError } = await admin.from("support_messages")
    .select("id,thread_id,sender_id,sender_type,body,email_sent_at,created_at")
    .eq("id", messageId).maybeSingle();
  if (messageError || !message) return json({ error: "Message not found." }, 404);

  const { data: thread, error: threadError } = await admin.from("support_threads")
    .select("id,user_id,channel,subject").eq("id", message.thread_id).maybeSingle();
  if (threadError || !thread || thread.channel !== "email") return json({ error: "E-mail thread not found." }, 404);

  const { data: operatorRow } = await admin.from("support_operators")
    .select("user_id").eq("user_id", actor.id).maybeSingle();
  const isOperator = Boolean(operatorRow);
  const authorized = isOperator
    ? message.sender_type === "user" || (message.sender_id === actor.id && message.sender_type === "operator")
    : thread.user_id === actor.id && message.sender_id === actor.id && message.sender_type === "user";
  if (!authorized) return json({ error: "Not authorized." }, 403);
  if (message.email_sent_at) return json({ ok: true, already_sent: true });

  let recipient = Deno.env.get("SUPPORT_EMAIL") || PROVISIONAL_SUPPORT_EMAIL;
  let recipientLabel = "WedConnect Kontakt / Feedback";
  if (message.sender_type === "operator") {
    const { data: userData, error: userError } = await admin.auth.admin.getUserById(thread.user_id);
    if (userError || !userData.user?.email) return json({ error: "Recipient has no e-mail address." }, 422);
    recipient = userData.user.email;
    recipientLabel = "WedConnect Support-Antwort";
  }

  const subjectPrefix = isOperator ? "Antwort" : "Neue Anfrage";
  const subject = `[WedConnect] ${subjectPrefix}: ${String(thread.subject || "Kontakt / Feedback").slice(0, 120)}`;
  const safeBody = escapeHtml(String(message.body)).replace(/\n/g, "<br>");
  const email = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json", "Idempotency-Key": `wedconnect-support-${message.id}` },
    body: JSON.stringify({
      from: fromEmail,
      to: [recipient],
      subject,
      text: `${recipientLabel}\n\n${message.body}\n\nAntworte in deinem WedConnect-Konto im Bereich Kontakt / Feedback.`,
      html: `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#302f38"><h2>${recipientLabel}</h2><p style="white-space:pre-wrap">${safeBody}</p><p>Der vollständige Verlauf steht in WedConnect unter „Kontakt / Feedback“.</p></div>`,
    }),
  });
  if (!email.ok) {
    const detail = await email.text();
    console.error("Resend request failed", email.status, detail);
    return json({ error: "E-mail provider rejected the message." }, 502);
  }

  const { error: updateError } = await admin.from("support_messages")
    .update({ email_sent_at: new Date().toISOString() }).eq("id", message.id).is("email_sent_at", null);
  if (updateError) {
    console.error("Could not record support e-mail delivery", updateError.message);
    return json({ error: "E-mail was sent but its delivery could not be recorded." }, 500);
  }
  return json({ ok: true });
});
