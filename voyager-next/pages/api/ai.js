// pages/api/ai.js
// This runs SERVER-SIDE on Vercel — the API key is never sent to the browser.

export default async function handler(req, res) {
  // 1. CONFIGURACIÓN DE CABECERAS CORS (Para que tu móvil pueda conectar)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Responder a la petición de control de los móviles (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "GEMINI_API_KEY not configured",
      hint: "Add GEMINI_API_KEY in Vercel → Settings → Environment Variables"
    });
  }

  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: "Missing prompt" });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 1500,
            responseMimeType: "application/json",
          },
          systemInstruction: {
            parts: [{
              text: "Eres un experto planificador de viajes. Responde SIEMPRE en español. Devuelve SOLO JSON válido, sin explicaciones, sin markdown, sin bloques de código."
            }]
          }
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error("Gemini API error:", err);
      return res.status(response.status).json({ error: "Gemini API error", detail: err });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Limpieza de cualquier formato markdown accidental
    const clean = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();

    return res.status(200).json({ text: clean });

  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: "Internal server error", detail: err.message });
  }
}
