import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

interface InviteRequest {
  householdId: string;
  email: string;
}

function jsonResponse(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function escapeHtml(value: string) {
  const escapedCharacters: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return value.replace(/[&<>"']/g, (character) => escapedCharacters[character]);
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return jsonResponse({ error: "Sign in to invite someone." }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const fromEmail = Deno.env.get("HOUSEHOLD_INVITE_FROM_EMAIL");
  const appUrl = Deno.env.get("APP_URL");
  if (!supabaseUrl || !anonKey || !serviceRoleKey || !resendApiKey || !fromEmail || !appUrl) {
    console.error("Household invite email configuration is incomplete.");
    return jsonResponse({ error: "Household invitations are not configured to send email yet." }, 500);
  }

  try {
    const body = await req.json() as InviteRequest;
    const email = body.email?.trim().toLowerCase();
    if (!body.householdId || !email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return jsonResponse({ error: "Enter a valid email address." }, 400);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const token = authHeader.replace(/^Bearer\s+/i, "");
    const { data: { user }, error: authError } = await adminClient.auth.getUser(token);
    if (authError || !user) {
      return jsonResponse({ error: "Your session has expired. Sign in again." }, 401);
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: invitationId, error: inviteError } = await userClient.rpc(
      "send_household_invite",
      { target_household_id: body.householdId, invitee_email: email },
    );
    if (inviteError) {
      return jsonResponse({ error: inviteError.message }, 400);
    }

    const { data: household, error: householdError } = await userClient
      .from("households")
      .select("name")
      .eq("id", body.householdId)
      .single();
    if (householdError) {
      throw new Error(`Invitation was recorded, but household details could not be loaded: ${householdError.message}`);
    }

    const signInUrl = new URL("/auth/login", appUrl).toString();
    const householdName = escapeHtml(household.name);
    const inviterEmail = escapeHtml(user.email || "A Nibble user");
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [email],
        subject: `${user.email || "Someone"} invited you to ${household.name} on Nibble`,
        html: `<p>${inviterEmail} invited you to join <strong>${householdName}</strong> on Nibble.</p><p>Sign in or create an account using <strong>${escapeHtml(email)}</strong> to accept or decline the invitation.</p><p><a href="${escapeHtml(signInUrl)}">Open Nibble</a></p>`,
        text: `${user.email || "Someone"} invited you to join ${household.name} on Nibble. Sign in or create an account using ${email} to accept or decline the invitation: ${signInUrl}`,
      }),
    });
    if (!emailResponse.ok) {
      const providerMessage = await emailResponse.text();
      console.error("Household invite email delivery failed:", emailResponse.status, providerMessage);
      return jsonResponse({
        error: "The invitation is saved, but its email could not be sent. Check the email configuration and try again.",
        invitationId,
      }, 502);
    }

    return jsonResponse({
      invitationId,
      email,
      createdAt: new Date().toISOString(),
    }, 200);
  } catch (error) {
    console.error("Household invitation failed:", error);
    return jsonResponse({
      error: error instanceof Error ? error.message : "Could not send the household invitation.",
    }, 500);
  }
});
