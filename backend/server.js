import express from 'express';
import cors from 'cors';
import multer from 'multer';
import Anthropic from '@anthropic-ai/sdk';
import sharp from 'sharp';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const ANALYSIS_PROMPT = `You are an expert Smart Money Concepts (SMC) and ICT (Inner Circle Trader) trading analyst. Analyze the provided trading chart image and identify all order blocks and related market structure elements.

For each order block found, provide detailed information in the following JSON structure. Be thorough and precise.

Return ONLY valid JSON in this exact format (no markdown, no explanation outside JSON):

{
  "symbol": "detected symbol or 'Unknown'",
  "timeframe": "detected timeframe or 'Unknown'",
  "currentBias": "bullish" | "bearish" | "neutral",
  "marketStructure": {
    "trend": "uptrend" | "downtrend" | "ranging",
    "lastBOS": "Break of Structure direction if visible",
    "lastCHoCH": "Change of Character direction if visible"
  },
  "orderBlocks": [
    {
      "id": 1,
      "type": "bullish_ob" | "bearish_ob" | "bullish_breaker" | "bearish_breaker" | "bullish_mitigation" | "bearish_mitigation" | "void" | "fvg",
      "label": "Human readable label e.g. 'Bullish Order Block'",
      "strength": "strong" | "moderate" | "weak",
      "status": "unmitigated" | "mitigated" | "broken",
      "priceZone": {
        "high": "approximate price level as string",
        "low": "approximate price level as string"
      },
      "locationOnChart": "top" | "middle" | "bottom" | "left" | "right" | "center",
      "description": "Detailed explanation of why this is identified as this type of order block, what caused it, and its significance",
      "tradingImplication": "What a trader should watch for at this level",
      "confluences": ["list", "of", "confluence", "factors"]
    }
  ],
  "keyLevels": {
    "support": ["list of key support levels as strings"],
    "resistance": ["list of key resistance levels as strings"],
    "pointsOfInterest": ["notable price levels or zones"]
  },
  "liquidityZones": [
    {
      "type": "buy_side" | "sell_side",
      "description": "where liquidity pools exist (above highs / below lows)",
      "priceArea": "approximate level"
    }
  ],
  "overallAnalysis": "Comprehensive paragraph summarizing the chart, current market conditions, dominant structure, key order blocks to watch, and potential trading scenarios",
  "warnings": ["any caveats or important notes about the analysis"],
  "confidence": "high" | "medium" | "low"
}

Definitions to use:
- Bullish Order Block (OB): Last bearish candle before a bullish impulse move that broke structure
- Bearish Order Block (OB): Last bullish candle before a bearish impulse move that broke structure
- Breaker Block: An order block that was previously mitigated and price broke through it — now acts in opposite direction
- Mitigation Block: An OB that has been partially touched/tested but not fully broken
- Fair Value Gap (FVG): Imbalance between 3 candles where the 1st candle's wick and 3rd candle's wick don't overlap
- Void: A large gap area with little to no price action (similar to FVG but larger)
- Buy Side Liquidity: Resting orders above swing highs (stop losses of shorts / buy stops)
- Sell Side Liquidity: Resting orders below swing lows (stop losses of longs / sell stops)

Be as precise and educational as possible. Identify every visible order block, breaker, and liquidity zone.`;

app.post('/api/analyze', upload.single('chart'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
    }

    // Optimize image for API
    const imageBuffer = await sharp(req.file.buffer)
      .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 90 })
      .toBuffer();

    const base64Image = imageBuffer.toString('base64');

    const response = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: base64Image,
              },
            },
            {
              type: 'text',
              text: ANALYSIS_PROMPT,
            },
          ],
        },
      ],
    });

    const rawText = response.content[0].text.trim();

    let analysis;
    try {
      // Strip any markdown code fences if present
      const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, rawText];
      analysis = JSON.parse(jsonMatch[1].trim());
    } catch {
      return res.status(500).json({ error: 'Failed to parse AI response', raw: rawText });
    }

    res.json({
      success: true,
      analysis,
      usage: response.usage,
    });
  } catch (err) {
    console.error('Analysis error:', err);
    res.status(500).json({ error: err.message || 'Analysis failed' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', apiKeyConfigured: !!process.env.ANTHROPIC_API_KEY });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
