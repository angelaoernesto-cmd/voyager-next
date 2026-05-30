// pages/api/ai.js
// Ejecutado 100% en el servidor de Vercel — protege tu GEMINI_API_KEY.
// Versión corregida y mejorada:
//   ✅ System instruction para JSON limpio
//   ✅ responseMimeType fuerza JSON puro (sin markdown)
//   ✅ AbortController con timeout de 12 segundos
//   ✅ Manejo correcto de candidatos bloqueados por seguridad
//   ✅ CORS seguro y configurable
//   ✅ Validación robusta del body
//   ✅ Logging de errores para depuración en Vercel

export default async function handler(req, res) {
  // ── CORS ──────────────────────────────────────────────────────────────────
  const origin = req.headers.origin || "";
  // Configura ALLOWED_ORIGINS en Vercel como variable de entorno opcional.
  // Ejemplo: "https://mi-app.vercel.app,https://mi-dominio.com"
  // Si no está definida, se permite cualquier origen (útil en desarrollo).
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
    : ["*"];

  const corsOrigin =
    allowedOrigins.includes("*") || allowedOrigins.includes(origin)
      ? origin || "*"
      : allowedOrigins[0];

  res.setHeader("Access-Control-Allow-Origin", corsOrigin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Vary", "Origin");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  // ── API KEY ────────────────────────────────────────────────────────────────
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("[Voyager] GEMINI_API_KEY no configurada en las variables de entorno de Vercel.");
    return res.status(500).json({
      error: "Configuración incorrecta del servidor. Contacta al administrador.",
    });
  }

  // ── PARSE BODY ─────────────────────────────────────────────────────────────
  let userPrompt = "";
  let image = null;

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    userPrompt = (body?.prompt || "").trim();
    image = body?.image || null;
  } catch (e) {
    return res.status(400).json({ error: "JSON inválido en el cuerpo de la petición." });
  }

  if (!userPrompt) {
    return res.status(400).json({ error: "El campo 'prompt' es obligatorio." });
  }

  // ── CONSTRUIR PARTES MULTIMODAL ────────────────────────────────────────────
  const parts = [];
  // Si el usuario adjuntó una imagen (base64), la incluimos primero
  if (image?.data && image?.mimeType) {
    parts.push({
      inlineData: {
        mimeType: image.mimeType,
        data: image.data,
      },
    });
  }
  parts.push({ text: userPrompt });

  // ── TIMEOUT VÍA AbortController ────────────────────────────────────────────
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 segundos

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          // Instrucción de sistema: garantiza respuestas JSON limpias
          systemInstruction: {
            parts: [
              {
                text:
                  "Eres un asistente experto en viajes y turismo. " +
                  "Cuando el usuario pida datos en formato JSON, responde ÚNICAMENTE con el JSON válido, " +
                  "sin bloques de código markdown, sin comillas de bloque, sin texto introductorio ni explicaciones. " +
                  "El JSON debe ser parseable directamente con JSON.parse().",
              },
            ],
          },
          contents: [{ role: "user", parts }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
            // Fuerza salida JSON pura — elimina el problema de fences ```json
            responseMimeType: "application/json",
          },
          // Configuración de seguridad permisiva para contenido turístico
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT",        threshold: "BLOCK_ONLY_HIGH" },
            { category: "HARM_CATEGORY_HATE_SPEECH",       threshold: "BLOCK_ONLY_HIGH" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
          ],
        }),
      }
    );

    clearTimeout(timeoutId);

    // ── ERROR HTTP DE GEMINI ───────────────────────────────────────────────
    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error(`[Gemini] HTTP ${geminiRes.status}:`, errText);
      // Mensajes de error amigables según código
      const friendlyErrors = {
        400: "Petición inválida enviada a Gemini. Revisa el prompt.",
        401: "API Key de Gemini inválida o expirada. Verifica GEMINI_API_KEY en Vercel.",
        403: "Sin permisos para usar este modelo de Gemini. Verifica tu cuenta de Google Cloud.",
        429: "Límite de peticiones de Gemini alcanzado. Espera unos segundos e inténtalo de nuevo.",
        500: "Error interno de Gemini. Inténtalo más tarde.",
        503: "Gemini no disponible temporalmente. Inténtalo más tarde.",
      };
      return res.status(geminiRes.status).json({
        error: friendlyErrors[geminiRes.status] || `Error de Gemini (${geminiRes.status})`,
        detail: errText,
      });
    }

    const data = await geminiRes.json();

    // ── SIN CANDIDATOS ─────────────────────────────────────────────────────
    if (!data.candidates || data.candidates.length === 0) {
      console.error("[Gemini] Sin candidatos:", JSON.stringify(data?.promptFeedback || {}));
      return res.status(422).json({
        error: "Gemini no generó respuesta. El prompt puede haber sido filtrado.",
        detail: data?.promptFeedback,
      });
    }

    const candidate = data.candidates[0];

    // ── CANDIDATO BLOQUEADO POR SEGURIDAD ──────────────────────────────────
    if (candidate.finishReason === "SAFETY") {
      return res.status(422).json({
        error: "La respuesta fue bloqueada por las políticas de seguridad de Gemini.",
      });
    }

    // ── RESPUESTA VACÍA ────────────────────────────────────────────────────
    const text = candidate.content?.parts?.[0]?.text;
    if (!text) {
      console.error("[Gemini] Respuesta vacía. finishReason:", candidate.finishReason);
      return res.status(500).json({
        error: "Gemini devolvió una respuesta vacía.",
        detail: { finishReason: candidate.finishReason },
      });
    }

    return res.status(200).json({ text: text.trim() });

  } catch (err) {
    clearTimeout(timeoutId);

    if (err.name === "AbortError") {
      return res.status(504).json({
        error: "Timeout: Gemini tardó más de 12 segundos. Inténtalo de nuevo.",
      });
    }

    console.error("[Voyager] Error inesperado:", err);
    return res.status(500).json({
      error: "Error interno del servidor.",
      detail: err.message,
    });
  }
}
