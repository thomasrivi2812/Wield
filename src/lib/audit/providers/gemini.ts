import { GoogleGenAI } from "@google/genai";
import { geminiUsage, parseGemini } from "./parse";
import { engineKeys } from "@/lib/env";
import type { EngineAdapter, EngineAnswer } from "../types";

/** Gemini, avec l'ancrage sur la recherche Google. */
const MODEL = process.env.GEMINI_AUDIT_MODEL ?? "gemini-2.5-flash";

export function geminiAdapter(): EngineAdapter {
  const apiKey = engineKeys.google;

  if (!apiKey) {
    return {
      id: "gemini",
      label: "Gemini",
      configured: false,
      unavailableReason: "GOOGLE_AI_API_KEY absente",
    };
  }

  const ai = new GoogleGenAI({ apiKey });

  return {
    id: "gemini",
    label: "Gemini",
    configured: true,
    async ask(prompt, signal): Promise<EngineAnswer> {
      const response = await ai.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: {
          abortSignal: signal,
          systemInstruction:
            "Tu réponds à un acheteur professionnel français qui cherche un " +
            "prestataire. Cite nommément les entreprises que tu recommandes.",
          tools: [{ googleSearch: {} }],
        },
      });

      return { ...parseGemini(response), usage: geminiUsage(response) };
    },
  };
}
