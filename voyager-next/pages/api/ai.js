// pages/api/ai.js
// Ejecutado 100% en el servidor de Vercel para proteger tu GEMINI_API_KEY.

export default async function handler(req, res) {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

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

  let userPrompt = "";
  if (req.body && typeof req.body === 'object') {
    userPrompt = req.body.prompt;
  } else if (req.body && typeof req.body === 'string') {
    try {
      const parsed = JSON.parse(req.body);
      userPrompt = parsed.prompt || req.body;
    } catch (e) {
      userPrompt = req.body;
    }
  }

  if (!userPrompt) {
    userPrompt = "Genera una ruta optimizada para viajar a China.";
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ 
            parts: [{ 
              text: `Genera una sugerencia de itinerario para: ${userPrompt}. Devuelve estrictamente un array de objetos con este formato: [{"name":"Ciudad","emoji":"emoji","desc":"2 frases","days":4,"order":1}]. Responde siempre en español.` 
            }] 
          }],
          // PARÁMETRO CLAVE: Obliga a Gemini a escupir JSON puro sin texto Markdown
          generationConfig: {
            responseMimeType: "application/json"
          }
        })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: 'Error de Gemini', detail: errText });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Devolvemos el JSON limpio de fábrica
    return res.status(200).json({ text: text.trim() });

  } catch (err) {
    return res.status(500).json({ error: 'Error interno en Vercel', detail: err.message });
  }
}
