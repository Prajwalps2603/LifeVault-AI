/**
 * AI & Speech Routes — NLP Action Parsing & Speech-to-Text
 */

import { Router, Request, Response } from 'express';

export const aiRouter = Router();

/**
 * POST /api/ai/parse
 * Natural language intent parser for LifeVault actions (expenses, reminders, documents, vehicles, assets).
 */
aiRouter.post('/parse', async (req: Request, res: Response) => {
  const { text } = req.body;

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Text query is required' });
  }

  const clean = text.trim();
  const lower = clean.toLowerCase();

  // 1. Detect Expense Intent
  const amountMatch = clean.match(/(?:(?:rs\.?|inr|\$|€|£)\s*(\d+(?:[.,]\d+)?)|(\d+(?:[.,]\d+)?)\s*(?:rs|inr|dollars|bucks|rupees)|(?:spent|paid|cost)\s*(\d+(?:[.,]\d+)?))/i);
  if (
    lower.includes('spent') ||
    lower.includes('bought') ||
    lower.includes('paid') ||
    lower.includes('cost') ||
    amountMatch
  ) {
    const amountVal = amountMatch ? parseFloat((amountMatch[1] || amountMatch[2] || amountMatch[3] || '0').replace(',', '')) : 0;
    let category = 'other';
    if (/food|lunch|dinner|breakfast|coffee|groceries|restaurant|swiggy|zomato/i.test(lower)) {
      category = 'food';
    } else if (/petrol|fuel|diesel|uber|ola|cab|auto|metro|flight/i.test(lower)) {
      category = 'transport';
    } else if (/electricity|water|wifi|broadband|rent|bill|recharge/i.test(lower)) {
      category = 'bills';
    } else if (/shirt|clothes|shoes|amazon|flipkart|shopping/i.test(lower)) {
      category = 'shopping';
    } else if (/medicine|doctor|hospital|clinic|pharma/i.test(lower)) {
      category = 'health';
    }

    return res.json({
      intent: 'CREATE_EXPENSE',
      confidence: 0.92,
      data: {
        amount: amountVal,
        category,
        description: clean,
        date: new Date().toISOString().split('T')[0],
      },
      message: `Parsed expense of ${amountVal || 'amount'} under category "${category}".`,
    });
  }

  // 2. Detect Reminder Intent
  if (
    lower.includes('remind') ||
    lower.includes('due') ||
    lower.includes('deadline') ||
    lower.includes('expire')
  ) {
    let daysAhead = 1;
    if (lower.includes('tomorrow')) daysAhead = 1;
    else if (lower.includes('next week')) daysAhead = 7;
    else if (lower.includes('next month')) daysAhead = 30;

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysAhead);

    return res.json({
      intent: 'CREATE_REMINDER',
      confidence: 0.9,
      data: {
        title: clean.replace(/^(please\s+)?remind\s+(me\s+)?(to\s+)?/i, ''),
        dueDate: targetDate.toISOString().split('T')[0],
        time: '09:00',
        frequency: 'once',
      },
      message: `Parsed reminder scheduled for ${targetDate.toISOString().split('T')[0]}.`,
    });
  }

  // 3. Fallback General LifeVault AI Response
  return res.json({
    intent: 'GENERAL_ASSISTANT',
    confidence: 0.85,
    data: { query: clean },
    message: `LifeVault AI processed your request: "${clean}". Use voice or text to log expenses, create reminders, or track vehicles.`,
  });
});

/**
 * POST /api/speech/transcribe
 * Speech-to-Text endpoint supporting Google Speech-to-Text API
 */
aiRouter.post('/transcribe', async (req: Request, res: Response) => {
  const { audioBase64, languageCode = 'en-US' } = req.body;
  const apiKey = process.env.SPEECH_TO_TEXT_API_KEY;
  const provider = process.env.SPEECH_TO_TEXT_PROVIDER || 'GOOGLE';

  if (!audioBase64) {
    return res.status(400).json({ error: 'audioBase64 audio payload is required' });
  }

  // If real Google Speech API key is provided
  if (apiKey && provider === 'GOOGLE') {
    try {
      const response = await fetch(
        `https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            config: {
              encoding: 'LINEAR16',
              sampleRateHertz: 16000,
              languageCode,
            },
            audio: {
              content: audioBase64,
            },
          }),
        }
      );

      const data = (await response.json()) as any;
      const transcript =
        data.results
          ?.map((r: any) => r.alternatives?.[0]?.transcript)
          .join('\n') || '';

      return res.json({
        success: true,
        transcript,
        provider: 'GOOGLE',
      });
    } catch (err: any) {
      return res.status(500).json({
        error: 'Speech recognition request failed',
        details: err?.message,
      });
    }
  }

  // Simulated development fallback for testing without external billable API
  return res.json({
    success: true,
    transcript: 'Spent 450 rupees on vehicle fuel today',
    provider: 'MOCK_DEV',
    note: 'Configure SPEECH_TO_TEXT_API_KEY in .env for live Google cloud recognition',
  });
});
