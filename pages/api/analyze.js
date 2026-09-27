export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

// Server-side AI Visual Analysis route.
// Keeps the Gemini API key out of the browser bundle — set GEMINI_API_KEY
// (no NEXT_PUBLIC_ prefix) in .env.local and in your Vercel project settings.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
  }

  const { imageData } = req.body || {};
  if (!imageData) {
    return res.status(400).json({ error: 'imageData is required.' });
  }

  try {
    // Update the model name below to whichever Gemini model your API key has access to.
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;
    const base64Data = imageData.split(',')[1] || imageData;

    const payload = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: 'Analyze this image of a lost or found campus item. Return a JSON object with title, category (Electronics, Accessories, Bags, Keys, ID Cards, Clothing, Other), estimatedColor, and keyFeatures.'
            },
            { inlineData: { mimeType: 'image/png', data: base64Data } }
          ]
        }
      ],
      generationConfig: { responseMimeType: 'application/json' }
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    const textResult = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textResult) {
      throw new Error('No content returned from the AI model.');
    }

    const parsed = JSON.parse(textResult);
    return res.status(200).json(parsed);
  } catch (err) {
    console.error('AI analysis error:', err);
    return res.status(500).json({ error: 'AI analysis failed.' });
  }
}
