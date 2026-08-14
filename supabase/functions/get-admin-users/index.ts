import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify the requesting user is an admin
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user is admin
    const { data: roleData } = await userClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role client to get user list
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get all users from auth
    const { data: authUsers, error: authError } = await adminClient.auth.admin.listUsers({
      perPage: 1000,
    });

    if (authError) {
      console.error("Error fetching auth users:", authError);
      return new Response(JSON.stringify({ error: "Failed to fetch users" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get briefing counts per user
    const { data: briefings } = await adminClient
      .from("briefings")
      .select("user_id, created_at")
      .order("created_at", { ascending: false });

    // Build user map with briefing counts
    const userBriefings = new Map<string, { count: number; latest: string }>();
    briefings?.forEach((b) => {
      const existing = userBriefings.get(b.user_id);
      if (!existing) {
        userBriefings.set(b.user_id, { count: 1, latest: b.created_at });
      } else {
        existing.count++;
      }
    });

    // Get user roles
    const { data: roles } = await adminClient.from("user_roles").select("user_id, role");
    const userRoles = new Map<string, string[]>();
    roles?.forEach((r) => {
      const existing = userRoles.get(r.user_id) || [];
      existing.push(r.role);
      userRoles.set(r.user_id, existing);
    });

    // Combine data
    const users = authUsers.users.map((u) => {
      const briefingData = userBriefings.get(u.id);
      return {
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        briefing_count: briefingData?.count || 0,
        latest_briefing: briefingData?.latest || null,
        roles: userRoles.get(u.id) || [],
      };
    });

    // Sort by briefing count descending
    users.sort((a, b) => b.briefing_count - a.briefing_count);

    return new Response(JSON.stringify({ users }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
