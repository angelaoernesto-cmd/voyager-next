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
  let image = null;

  if (req.body && typeof req.body === 'object') {
    userPrompt = req.body.prompt;
    image = req.body.image;
  } else if (req.body && typeof req.body === 'string') {
    try {
      const parsed = JSON.parse(req.body);
      userPrompt = parsed.prompt;
      image = parsed.image;
    } catch (e) {
      userPrompt = req.body;
    }
  }

  if (!userPrompt) {
    return res.status(400).json({ error: 'Falta el prompt del usuario' });
  }

  // Construimos las partes para la API de Google (Multimodal)
  const parts = [];
  
  // camelCase obligatorio por la especificación de la API de Google (inlineData y mimeType)
  if (image && image.data && image.mimeType) {
    parts.push({
      inlineData: {
        mimeType: image.mimeType,
        data: image.data
      }
    });
  }
  
  parts.push({ text: userPrompt });

  try {
    // v1beta + gemini-2.0-flash: la combinación que responde correctamente en tu cuenta de Google Cloud
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: parts }]
        })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: 'Error de Gemini API', detail: errText });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return res.status(200).json({ text: text.trim() });

  } catch (err) {
    return res.status(500).json({ error: 'Error interno en Vercel', detail: err.message });
  }
}
