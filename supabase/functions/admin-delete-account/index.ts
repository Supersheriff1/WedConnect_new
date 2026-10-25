import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function respond(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return respond(405, { error: "method_not_allowed" });
  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return respond(401, { error: "not_authenticated" });
  let body: { action?: string; user_id?: string; reason?: string; confirmation?: string };
  try { body = await request.json(); } catch { return respond(400, { error: "invalid_request" }); }
  if (!body.user_id || !body.reason || !["delete", "role_reset"].includes(body.action || "")) return respond(400, { error: "invalid_request" });
  if (body.action === "delete" && body.confirmation !== "KONTO LÖSCHEN") return respond(400, { error: "confirmation_required" });

  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const publicKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  if (!url || !serviceKey || !publicKey) return respond(500, { error: "server_configuration_error" });
  const token = authorization.slice("Bearer ".length);
  const userClient = createClient(url, publicKey, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false, autoRefreshToken: false } });
  const { data: { user }, error: userError } = await userClient.auth.getUser(token);
  if (userError || !user) return respond(401, { error: "not_authenticated" });

  if (body.action === "delete") {
    const { error: auditError } = await userClient.rpc("admin_prepare_account_deletion", {
      p_user_id: body.user_id,
      p_reason: body.reason.trim(),
      p_confirmation: body.confirmation,
    });
    if (auditError) return respond(403, { error: "admin_authorization_failed" });
  } else {
    const { error: resetError } = await userClient.rpc("admin_reset_user_role", { p_user_id: body.user_id, p_reason: body.reason.trim() });
    if (resetError) return respond(403, { error: "admin_authorization_failed" });
  }

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  try {
    const bucket = admin.storage.from("wedconnect-profile-photos");
    const paths: string[] = [];
    async function collect(folder: string): Promise<void> {
      let offset = 0;
      while (true) {
        const { data, error } = await bucket.list(folder, { limit: 100, offset, sortBy: { column: "name", order: "asc" } });
        if (error) throw new Error("storage_cleanup_failed");
        const rows = data ?? [];
        for (const row of rows) {
          const path = `${folder}/${row.name}`;
          if (row.id === null) await collect(path); else paths.push(path);
        }
        if (rows.length < 100) break;
        offset += rows.length;
      }
    }
    await collect(body.user_id);
    for (let i = 0; i < paths.length; i += 100) {
      const { error } = await bucket.remove(paths.slice(i, i + 100));
      if (error) throw new Error("storage_cleanup_failed");
    }
    if (body.action === "delete") {
      const { error } = await admin.auth.admin.deleteUser(body.user_id, false);
      if (error) throw new Error("account_delete_failed");
      return respond(200, { deleted: true });
    }
    return respond(200, { role_reset: true });
  } catch (error) {
    console.error("Admin account deletion failed", error);
    return respond(500, { error: error instanceof Error ? error.message : "account_delete_failed" });
  }
});
