import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // AI Routes
  app.post('/api/ai/tactical', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'Missing GEMINI_API_KEY' });
      }

      const { systemName, wave, health, shotsHit, shotsFired, action } = req.body;

      const ai = new GoogleGenAI({ apiKey });

      const systemInstruction = `You are "A.E.G.I.S.", a highly advanced, ultra-concise tactical ship AI in a sci-fi space shooter.
Respond with a single ultra-short, punchy line of tactical advice, warning, or status update (max 10-15 words).
Do NOT be conversational. Be clinical, gritty, and badass. Use a Nine Inch Nails style dark, cynical, industrial tone.`;

      let userPrompt = `System: ${systemName} | Wave: ${wave} | Hull: ${health}% | Accuracy: ${shotsFired > 0 ? Math.round((shotsHit / shotsFired) * 100) : 100}%.\n\n`;

      if (action === "SYSTEM_ENTER") {
        userPrompt += `Event: The ship just warped into this sector. Give a brief, chilling status of the local anomalies.`;
      } else if (action === "HEAVY_DAMAGE") {
        userPrompt += `Event: The ship just took massive damage! Deliver an urgent, cold warning!`;
      } else if (action === "OVERDRIVE") {
        userPrompt += `Event: Hyper-overdrive engaged! React to the brutal speed!`;
      } else {
        userPrompt += `Event: Standard tactical update needed. Evaluate combat efficiency or local hostility.`;
      }

      const response = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: userPrompt,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        }
      });

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      for await (const chunk of response) {
        res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
      }
      res.write('data: [DONE]\n\n');
      res.end();

    } catch (error: any) {
      if (error?.status === 429 || error?.message?.includes('429')) {
         res.status(429).json({ error: 'Rate-limited', code: 429 });
         return;
      } else {
         console.error("AI API Error:", error);
      }
      res.status(500).json({ error: 'Failed' });
    }
  });

  app.post('/api/ai/review', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'Missing GEMINI_API_KEY' });
      }

      const { score, asteroidsDestroyed, accuracy, playTime } = req.body;

      const ai = new GoogleGenAI({ apiKey });
      const systemInstruction = `You are "A.E.G.I.S.", a highly advanced ship AI assessing a recently deceased/destroyed pilot's flight log in a sci-fi game.
Write a compelling, cinematic, slightly morbid but respectful post-mortem analysis of the pilot's performance in exactly 2 paragraphs. Focus on their combat metrics and final outcome. End with a solemn sign-off. Use a dark, Nine Inch Nails-inspired industrial tone.`;

      const userPrompt = `Pilot Stats:
Score: ${score}
Targets Destroyed: ${asteroidsDestroyed}
Accuracy: ${accuracy}%
Flight Time: ${(playTime/60).toFixed(2)} cycles`;

      const response = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: userPrompt,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.8,
        }
      });

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      for await (const chunk of response) {
        res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
      }
      res.write('data: [DONE]\n\n');
      res.end();

    } catch (error: any) {
      if (error?.status === 429 || error?.message?.includes('429')) {
         res.status(429).json({ error: 'Rate-limited', code: 429 });
         return;
      } else {
         console.error("AI Review Error:", error);
      }
      res.status(500).json({ error: 'Failed' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
