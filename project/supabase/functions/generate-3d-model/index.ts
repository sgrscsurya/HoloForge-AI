import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { projectId, imageUrl } = await req.json();

    if (!projectId || !imageUrl) {
      return new Response(
        JSON.stringify({ error: "Missing projectId or imageUrl" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    await new Promise(resolve => setTimeout(resolve, 3000));

    const mockModelUrl = `https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF-Binary/Box.glb`;

    const data = {
      success: true,
      projectId,
      modelUrl: mockModelUrl,
      message: "3D model generated successfully (mock data)",
      metadata: {
        processingTime: 3000,
        aiModel: "depth-estimation-mock",
        timestamp: new Date().toISOString(),
      },
    };

    return new Response(JSON.stringify(data), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
