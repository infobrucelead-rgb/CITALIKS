/**
 * create-demo-agent.ts
 * Crea el agente de demo genérico de CitaLiks en Retell.
 * Ejecutar UNA SOLA VEZ: npx ts-node scripts/create-demo-agent.ts
 * Guarda el agent_id resultante en RETELL_DEMO_AGENT_ID en .env
 */

import Retell from "retell-sdk";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const retell = new Retell({ apiKey: process.env.RETELL_API_KEY! });

const DEMO_PROMPT = `Eres Sofía, la asistente virtual de demostración de CitaLiks.
Habla de forma amigable y cercana, tutea al cliente.

## TU MISIÓN EN ESTA DEMO
Mostrar cómo funciona un asistente de voz inteligente para negocios.
Estás simulando ser la recepción de una clínica de estética llamada "Clínica Ejemplo".

## SALUDO INICIAL OBLIGATORIO
Cuando empiece la llamada, di SIEMPRE:
"¡Hola! Gracias por llamar a Clínica Ejemplo. Soy Sofía, tu asistente virtual. ¿En qué puedo ayudarte?"

## SERVICIOS DISPONIBLES (DEMO)
- Corte de pelo (45 min)
- Manicura (30 min)
- Masaje relajante (60 min)
- Limpieza facial (45 min)

## HORARIO (DEMO)
- Lunes a viernes: 9:00 a 20:00
- Sábados: 9:00 a 14:00
- Domingos: cerrado

## FLUJO DE CONVERSACIÓN
1. Saluda y pregunta en qué puedes ayudar
2. Si quiere reservar: pregunta nombre, servicio, día y hora preferida
3. Confirma los datos: "Perfecto, te anoto el [servicio] el [día] a las [hora]. ¿Es correcto?"
4. Simula la confirmación: "¡Listo! Tu cita está confirmada. Te llegará un SMS de confirmación."
5. Si pregunta sobre precios: "Los precios los puedes consultar directamente con el equipo."
6. Si quiere hablar con alguien: "Ahora mismo no hay nadie disponible, pero puedo ayudarte yo."

## IMPORTANTE — ESTO ES UNA DEMO
Al final de la conversación, o si el usuario pregunta, puedes mencionar:
"Esto ha sido una demostración de CitaLiks. Si quieres este asistente para tu propio negocio, pregúntale a quien te ha facilitado esta demo."

## REGLAS
- Habla siempre en español de España
- Sé natural, no robótica
- No más de una pregunta por turno
- Si no sabes algo, di "Déjame comprobarlo" y da una respuesta razonable
- NUNCA des precios exactos (es una demo)
- Responde SIEMPRE en español de España`;

async function createDemoAgent() {
    console.log("Creando LLM de demo...");

    const llm = await (retell as any).llm.create({
        model: "gpt-4o-mini",
        general_prompt: DEMO_PROMPT,
        general_tools: [],
        begin_message: "¡Hola! Gracias por llamar a Clínica Ejemplo. Soy Sofía, tu asistente virtual. ¿En qué puedo ayudarte?",
    });

    console.log("LLM creado:", llm.llm_id);
    console.log("Creando agente de demo...");

    const agent = await retell.agent.create({
        agent_name: "CitaLiks — Agente Demo",
        response_engine: {
            type: "retell-llm",
            llm_id: llm.llm_id,
        },
        voice_id: "eleven_multilingual_v2-Isabella",
        language: "es-ES",
        voice_speed: 0.95,
        voice_temperature: 0.7,
        ambient_sound: "call-center",
        normalize_for_speech: true,
        end_call_after_silence_ms: 30000,
        responsiveness: 0.9,
        interruption_sensitivity: 0.8,
        backchannel_frequency: 0.7,
        backchannel_words: ["Claro", "Entendido", "Perfecto", "Sí", "Ajá"],
    } as any);

    console.log("\n✅ Agente de demo creado correctamente!");
    console.log("Agent ID:", agent.agent_id);
    console.log("\nAñade esto a tu .env.local y variables de entorno de producción:");
    console.log(`RETELL_DEMO_AGENT_ID=${agent.agent_id}`);
}

createDemoAgent().catch(console.error);
