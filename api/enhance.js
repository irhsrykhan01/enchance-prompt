export default async function handler(req, res) {
  // Hanya izinkan POST
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method Not Allowed"
    });
  }

  try {
    const {
      prompt,
      systemPrompt
    } = req.body || {};

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({
        error: "Prompt tidak boleh kosong."
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "Environment variable GEMINI_API_KEY belum diset."
      });
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": apiKey
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text:
`${systemPrompt}

User Prompt:
${prompt}`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.8,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 2048
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error:
          data?.error?.message ||
          "Gemini API Error"
      });
    }

    const result =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!result) {
      return res.status(500).json({
        error: "AI tidak mengembalikan hasil."
      });
    }

    return res.status(200).json({
      success: true,
      result: result.trim()
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: err.message || "Internal Server Error"
    });
  }
}
