import { NextResponse } from "next/server"

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Clé GEMINI_API_KEY absente." }, { status: 500 })
    }

    const { audioBase64, mimeType } = await req.json()
    if (!audioBase64) {
      return NextResponse.json({ error: "Fichier audio manquant." }, { status: 400 })
    }

    const cleanBase64 = audioBase64.includes(",") ? audioBase64.split(",")[1] : audioBase64

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: {
            parts: [{
              text: "Tu es un retranscripteur audio pour atelier mécanique. Tu écoutes le fichier audio fourni et tu renvoies UNIQUEMENT le texte exact prononcé en français, sans aucun commentaire, sans guillemets, ni formule de politesse."
            }]
          },
          contents: [
            {
              role: "user",
              parts: [
                {
                  inline_data: {
                    mime_type: mimeType || "audio/webm",
                    data: cleanBase64
                  }
                },
                { text: "Retranscris fidèlement les propos énoncés." }
              ]
            }
          ]
        })
      }
    )

    const data = await response.json()
    const transcription = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ""

    return NextResponse.json({ text: transcription })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Erreur serveur transcription." }, { status: 500 })
  }
}
