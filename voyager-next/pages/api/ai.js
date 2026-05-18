// pages/api/ai.js
// Ejecutado 100% en el servidor de Vercel para proteger tu GEMINI_API_KEY.

export default async function handler(req, res) {
  // 1. Configuración de CORS total para desbloquear el teléfono móvil
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Responder al control de ruta (OPTIONS) de Android
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY no configurada en Vercel.' });
  }

  // 2. Parche de lectura: Extraer el prompt de forma segura sea cual sea el formato del móvil
  let prompt = "";
  if (req.body && typeof req.body === 'object') {
    prompt = req.body.prompt;
  } else if (req.body && typeof req.body === 'string') {
    try {
      const parsed = JSON.parse(req.body);
      prompt = parsed.prompt;
    } catch (e) {
      prompt = req.body;
    }
  }

  if (!prompt) {
    return res.status(400).json({ error: 'Falta el prompt o no se pudo leer correctamente.' });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 1500,
            responseMimeType: 'application/json',
          },
          systemInstruction: {
            parts: [{
              text: "Eres un expertisimo planificador de viajes. Responde SIEMPRE en español. Devuelve SOLO JSON válido, con la estructura exacta solicitada, sin marcas de código, sin markdown, sin texto fuera del JSON."
            }]
          }
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: 'Error en Gemini API', detail: errText });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Limpieza radical por si Gemini mete texto basura en los extremos
    const clean = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();

    return res.status(200).json({ text: clean });

  } catch (err) {
    return res.status(500).json({ error: 'Error interno del servidor', detail: err.message });
  }
}
