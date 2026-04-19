import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

serve(async (req) => {
  try {
    const { to, name, otp } = await req.json();

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Campus IQ <onboarding@resend.dev>",
        to: [to],
        subject: "Campus IQ - Email Verification Code",
        html: `<div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #001f4d; color: #ffffff; padding: 32px; border-radius: 16px;"><h1 style="color: #FFD700; text-align: center;">Campus IQ</h1><h2 style="color: #1D9E75; text-align: center;">Email Verification</h2><p style="color: #a0c4ff;">Hi <strong>${name}</strong>,</p><p style="color: #a0c4ff;">Your verification code is:</p><div style="background: #0a2a4a; border: 2px solid #1D9E75; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;"><span style="font-size: 42px; font-weight: bold; letter-spacing: 12px; color: #FFD700;">${otp}</span></div><p style="color: #a0c4ff;">This code expires in <strong>10 minutes</strong>.</p><p style="color: #a0c4ff;">If you did not sign up for Campus IQ, please ignore this email.</p><hr style="border-color: #1D9E75; margin: 24px 0;" /><p style="color: #7a9cc4; font-size: 12px; text-align: center;">Midlands State University 2026</p></div>`,
      }),
    });

    const data = await res.json();
    return new Response(JSON.stringify(data), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
