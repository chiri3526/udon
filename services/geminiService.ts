
import { GoogleGenAI, Type } from "@google/genai";
import { OrderItem } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function parseEmailContent(emailBody: string): Promise<{ items: OrderItem[], date: string }> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `以下の食堂からのメール内容から、注文日と注文されたメニュー項目を抽出してください。
    また、各項目が「うどん（Udon）」であるかどうかも判定してください。
    
    メール内容:
    ${emailBody}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          date: {
            type: Type.STRING,
            description: "注文日 (YYYY-MM-DD形式)",
          },
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: {
                  type: Type.STRING,
                  description: "メニュー名",
                },
                isUdon: {
                  type: Type.BOOLEAN,
                  description: "うどん（かけうどん、たぬきうどん、きつねうどん等）であればtrue",
                },
              },
              required: ["name", "isUdon"],
            },
          },
        },
        required: ["date", "items"],
      },
    },
  });

  try {
    const data = JSON.parse(response.text || "{}");
    return data;
  } catch (error) {
    console.error("Failed to parse Gemini response:", error);
    return { items: [], date: new Date().toISOString().split('T')[0] };
  }
}
