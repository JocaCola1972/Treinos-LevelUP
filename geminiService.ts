
import { GoogleGenAI } from "@google/genai";

// Standardized initialization using process.env.API_KEY directly
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getTrainingTips = async (focus: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Gera 3 dicas curtas e motivacionais para um treino de padel focado em ${focus}. Responde em Português de Portugal.`,
    });
    return response.text || "Prepara-te para dar o teu melhor em campo!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Foco total na rede e bons treinos!";
  }
};

export const analyzeSession = async (notes: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Com base nas notas do treinador: "${notes}", resume os pontos principais e sugere um foco para a próxima aula. Responde em formato bullet points curtos em Português.`,
    });
    return response.text || "Análise concluída com sucesso.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "A análise da aula será processada em breve.";
  }
};
