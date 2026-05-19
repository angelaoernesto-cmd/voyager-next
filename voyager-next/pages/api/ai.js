// pages/api/ai.js
// Ejecutado 100% en el servidor de Vercel para proteger tu GEMINI_API_KEY.

export default async function handler(req, res) {
  // Configuración de CORS obligatoria para que el móvil pueda entrar
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

  // Extraer el prompt de la aplicación de forma segura
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
    userPrompt = "Genera una ruta optimizada para viajar a Colombia en Diciembre.";
  }

  // Estructura oficial e interna que exige la API v1 de Gemini
  const systemInstruction = "Eres un experto planificador de viajes. Responde SIEMPRE en español. Devuelve SOLO JSON válido, con la estructura exacta solicitada, sin marcas de código, sin markdown, sin texto fuera del JSON.";
  const fullMessage = `${systemInstruction}\n\nPetición del usuario: ${userPrompt}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: fullMessage }
              ]
            }
          ]
        })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: 'Error devuelto por Gemini', detail: errText });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Limpieza estricta de posibles marcas markdown de bloques de código
    const clean = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();

    return res.status(200).json({ text: clean });

  } catch (err) {
    return res.status(500).json({ error: 'Error interno del servidor en Vercel', detail: err.message });
  }
}
