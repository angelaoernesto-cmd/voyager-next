// pages/api/ai.js
// ✅ CORREGIDO — Ejecutado 100% en el servidor de Vercel para proteger GEMINI_API_KEY.

export default async function handler(req, res) {
  // ── CORS ────────────────────────────────────────────────────────────────────
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  // ── API KEY ─────────────────────────────────────────────────────────────────
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY no configurada en Vercel.' });
  }

  // ── PARSE BODY ──────────────────────────────────────────────────────────────
  // ✅ FIX #1: Next.js 14 parsea automáticamente el body JSON.
  // El código original tenía lógica redundante que podía fallar.
  let userPrompt = "";
  try {
    if (req.body && typeof req.body === 'object') {
      userPrompt = req.body.prompt || "";
    } else if (req.body && typeof req.body === 'string') {
      const parsed = JSON.parse(req.body);
      userPrompt = parsed.prompt || req.body;
    }
  } catch (e) {
    userPrompt = typeof req.body === 'string' ? req.body : "";
  }

  if (!userPrompt || !userPrompt.trim()) {
    userPrompt = "Genera una ruta optimizada para viajar.";
  }

  // ── CALL GEMINI ─────────────────────────────────────────────────────────────
  // ✅ FIX #2: Usar gemini-2.0-flash (modelo disponible en la API v1beta).
  //    gemini-1.5-flash sigue funcionando, pero 2.0-flash es más rápido y estable.
  //    Se mantiene gemini-1.5-flash para máxima compatibilidad.
  // ✅ FIX #3: responseMimeType "application/json" requiere API v1beta, NO v1.
  //    El código original usaba /v1/models/... que NO soporta responseMimeType JSON.
  //    → Cambiado a /v1beta/models/...
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: userPrompt
            }]
          }],
          generationConfig: {
            // ✅ FIX #3: responseMimeType SOLO funciona en v1beta
            responseMimeType: "application/json",
            temperature: 0.7,
            maxOutputTokens: 2048,
          }
        })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API error:', response.status, errText);
      return res.status(response.status).json({
        error: 'Error de Gemini API',
        status: response.status,
        detail: errText
      });
    }

    const data = await response.json();

    // ✅ FIX #4: Manejo robusto de la respuesta de Gemini.
    // Gemini puede devolver el texto en distintas estructuras.
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!text) {
      console.error('Gemini devolvió respuesta vacía:', JSON.stringify(data));
      return res.status(500).json({
        error: 'Gemini devolvió una respuesta vacía',
        raw: data
      });
    }

    return res.status(200).json({ text: text.trim() });

  } catch (err) {
    console.error('Error interno en handler:', err);
    return res.status(500).json({
      error: 'Error interno en servidor',
      detail: err.message
    });
  }
}
