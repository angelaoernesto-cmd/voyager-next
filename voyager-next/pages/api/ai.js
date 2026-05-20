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
    userPrompt = "China";
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
              text: `Eres un planificador experto. Genera un itinerario optimizado para: ${userPrompt}. 
              Devuelve la respuesta estrictamente como un array de objetos JSON planos en español, sin envolverlo en markdown, sin usar las palabras o marcas \`\`\`json.
              Formato esperado: [{"name":"Ciudad","emoji":"emoji","desc":"2 frases","days":4,"order":1}]` 
            }] 
          }]
        })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: 'Error de Gemini API', detail: errText });
    }

    const data = await response.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Limpieza manual de seguridad por si acaso mete bloques markdown
    text = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();

    return res.status(200).json({ text: text });

  } catch (err) {
    return res.status(500).json({ error: 'Error interno en Vercel', detail: err.message });
  }
}
