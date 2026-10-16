import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function respond(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return respond(405, { error: "method_not_allowed" });

  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return respond(401, { error: "not_authenticated" });

  let body: { confirmation?: string };
  try {
    body = await request.json();
  } catch {
    return respond(400, { error: "invalid_request" });
  }
  if (body.confirmation !== "KONTO LÖSCHEN") return respond(400, { error: "confirmation_required" });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const publicKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  if (!supabaseUrl || !serviceRoleKey || !publicKey) {
    return respond(500, { error: "server_configuration_error" });
  }

  const accessToken = authorization.slice("Bearer ".length);
  const userClient = createClient(supabaseUrl, publicKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: { user }, error: userError } = await userClient.auth.getUser(accessToken);
  if (userError || !user) return respond(401, { error: "not_authenticated" });

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const bucket = admin.storage.from("wedconnect-profile-photos");
    const ownedPaths: string[] = [];

    async function collectFiles(folder: string): Promise<void> {
      let offset = 0;
      const pageSize = 100;
      while (true) {
        const { data, error } = await bucket.list(folder, {
          limit: pageSize,
          offset,
          sortBy: { column: "name", order: "asc" },
        });
        if (error) throw new Error("storage_list_failed");
        const entries = data ?? [];
        for (const entry of entries) {
          const path = `${folder}/${entry.name}`;
          if (entry.id === null) await collectFiles(path);
          else ownedPaths.push(path);
        }
        if (entries.length < pageSize) break;
        offset += entries.length;
      }
    }

    await collectFiles(user.id);
    for (let index = 0; index < ownedPaths.length; index += 100) {
      const { error } = await bucket.remove(ownedPaths.slice(index, index + 100));
      if (error) throw new Error("storage_remove_failed");
    }

    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id, false);
    if (deleteError) throw new Error("account_delete_failed");
    return respond(200, { deleted: true });
  } catch (error) {
    console.error("Account deletion failed", error);
    return respond(500, { error: error instanceof Error ? error.message : "account_delete_failed" });
  }
});
