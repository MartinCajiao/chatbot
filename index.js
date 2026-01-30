import express from "express";
import dotenv from "dotenv";
import OpenAI from "openai";
import cors from "cors";
import rateLimit from "express-rate-limit"; 

dotenv.config();
const app = express();
app.use(express.json());

app.use(cors()); 
app.use(express.json());
// --- MEJORA: LÍMITE DE MENSAJES (Rate Limiting) ---
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, 
  max: 5, 
  message: { reply: "Has alcanzado el límite de consultas permitidas. Intenta más tarde." }
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Aplicar el límite a la ruta de chat
app.post("/chat", limiter, async (req, res) => {
  const { message } = req.body;

  if (!message) return res.status(400).json({ reply: "Mensaje vacío" });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: `INSTRUCCIONES CRÍTICAS:
          1. Eres un asistente exclusivo de [PCJ Representaciones medicas].
          2. Responde ÚNICAMENTE con texto plano. No generes listas largas, código, ni formatos complejos.
          3. Prohibido responder temas fuera de la empresa (política, ocio, otros servicios).
          4. Si el usuario pregunta algo ajeno a la empresa, responde exactamente: "Lo siento, solo puedo ayudarte con temas relacionados a nuestra empresa".
          5. vendemos equipos e insumos medicos de varias marcas gima medela welchallyn pero no somos partner.
          6. Redacta un mensaje amable y profesional para una página web de ventas en línea. El mensaje debe indicar que si el usuario no encuentra el producto que busca, puede consultar a través de WhatsApp para recibir una cotización personalizada. Además, menciona que los precios y productos que aparecen en la página son solo una referencia general de lo que se dispone.
          7. Sé extremadamente breve y directo.` 
        },
        { role: "user", content: message }
      ],
      // Control de creatividad: 0 es lo más estricto y menos "imaginativo"
      temperature: 0,
      // Límite de tokens de salida para ahorrar dinero y forzar brevedad
      max_tokens: 150 
    });

    res.json({ reply: completion.choices[0].message.content });

  } catch (error) {
    // 1. Primero los logs en tu consola de Git Bash para que tú veas qué pasó
    console.error("--- ERROR DETECTADO ---");
    console.error("Mensaje:", error.message);
    console.error("Código de OpenAI:", error.code);
    console.error("Status:", error.status);
    console.error("-----------------------");

    // 2. UNA SOLA respuesta para el frontend con el 'return' para detener todo
    return res.status(500).json({ 
      reply: "Error en el servidor o falta de saldo en OpenAI.", 
      debug: error.message 
    });
  }
});
app.listen(3000, () => console.log("Bot blindado en puerto 3000"));