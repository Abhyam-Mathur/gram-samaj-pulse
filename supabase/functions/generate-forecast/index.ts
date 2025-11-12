import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { districtId, blockName, months } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Call Lovable AI for forecast generation
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a time series forecasting expert. Generate realistic MGNREGA person-days forecasts based on historical patterns. Return only valid JSON."
          },
          {
            role: "user",
            content: `Generate ${months} months of MGNREGA person-days forecast for district ${districtId}, block ${blockName}. Base predictions on seasonal patterns (higher in monsoon Jun-Aug). Return JSON format: {"forecast": [{"month": "Jan 2025", "predicted": 6500}, ...]}`
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) throw new Error("AI gateway error");

    const data = await response.json();
    let content = data.choices[0].message.content;
    
    // Strip markdown code blocks if present
    content = content.replace(/```json\n/g, '').replace(/```\n/g, '').replace(/```/g, '').trim();
    
    const forecast = JSON.parse(content);

    return new Response(JSON.stringify(forecast), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Forecast error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
