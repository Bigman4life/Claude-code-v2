import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, TrendingUp, TrendingDown, Minus, AlertTriangle, Zap, Target, Layers, Activity, Key } from 'lucide-react';
import OrderBlockCard from './components/OrderBlockCard';
import LiquidityZone from './components/LiquidityZone';
import MarketStructureBadge from './components/MarketStructureBadge';
import AnalysisSkeleton from './components/AnalysisSkeleton';

const ANALYSIS_PROMPT = `You are an expert Smart Money Concepts (SMC) and ICT (Inner Circle Trader) trading analyst. Analyze the provided trading chart image and identify all order blocks and related market structure elements.

Return ONLY valid JSON (no markdown, no explanation outside JSON):

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
      "label": "Human readable label",
      "strength": "strong" | "moderate" | "weak",
      "status": "unmitigated" | "mitigated" | "broken",
      "priceZone": { "high": "price", "low": "price" },
      "locationOnChart": "top" | "middle" | "bottom" | "left" | "right" | "center",
      "description": "Why this is this type of OB, what caused it, significance",
      "tradingImplication": "What a trader should watch for",
      "confluences": ["list", "of", "confluence", "factors"]
    }
  ],
  "keyLevels": {
    "support": ["levels"],
    "resistance": ["levels"],
    "pointsOfInterest": ["notable levels"]
  },
  "liquidityZones": [
    {
      "type": "buy_side" | "sell_side",
      "description": "where liquidity pools exist",
      "priceArea": "approximate level"
    }
  ],
  "overallAnalysis": "Comprehensive paragraph summarizing the chart",
  "warnings": ["caveats"],
  "confidence": "high" | "medium" | "low"
}

Definitions:
- Bullish OB: Last bearish candle before a bullish impulse move that broke structure
- Bearish OB: Last bullish candle before a bearish impulse move that broke structure
- Breaker Block: Previously mitigated OB that price broke through — now acts in opposite direction
- Mitigation Block: OB partially touched but not fully broken
- FVG: 3-candle imbalance where 1st and 3rd candle wicks don't overlap
- Void: Large gap area with little price action
- Buy Side Liquidity: Resting orders above swing highs
- Sell Side Liquidity: Resting orders below swing lows`;

async function analyzeChart(apiKey, imageBase64, mimeType) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-8',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mimeType, data: imageBase64 } },
          { type: 'text', text: ANALYSIS_PROMPT },
        ],
      }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API error ${response.status}`);
  }

  const data = await response.json();
  const raw = data.content[0].text.trim();
  const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, raw];
  return JSON.parse(match[1].trim());
}

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function App() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('ob_api_key') || '');

  const saveKey = (k) => {
    setApiKey(k);
    localStorage.setItem('ob_api_key', k);
  };

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setAnalysis(null);
    setError(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxFiles: 1,
  });

  const analyze = async () => {
    if (!image || !apiKey) return;
    setLoading(true);
    setError(null);
    setAnalysis(null);
    try {
      const base64 = await toBase64(image);
      const mime = image.type || 'image/jpeg';
      const result = await analyzeChart(apiKey, base64, mime);
      setAnalysis(result);
    } catch (err) {
      setError(err.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const BiasIcon = { bullish: TrendingUp, bearish: TrendingDown, neutral: Minus };
  const BiasIconEl = analysis ? (BiasIcon[analysis.currentBias] || Minus) : Minus;

  const s = (obj) => Object.entries(obj).reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});

  return (
    <div style={{ minHeight: '100vh', background: '#0d1117', color: '#e6edf3' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid #30363d', background: 'rgba(22,27,34,0.95)', backdropFilter: 'blur(8px)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Activity size={16} color="#34d399" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#e6edf3' }}>OrderBlock AI</div>
              <div style={{ fontSize: 11, color: '#8b949e' }}>Smart Money Concepts Analyzer</div>
            </div>
          </div>

          {/* API Key input inline */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto', maxWidth: 400 }}>
            <Key size={14} color="#8b949e" style={{ flexShrink: 0 }} />
            <input
              type="password"
              placeholder="Anthropic API key (saved in browser)"
              value={apiKey}
              onChange={e => saveKey(e.target.value)}
              style={{ flex: 1, background: '#0d1117', border: '1px solid #30363d', borderRadius: 6, padding: '6px 10px', fontSize: 12, color: '#e6edf3', outline: 'none' }}
            />
            {apiKey && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399', flexShrink: 0 }} title="Key set" />}
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 20px' }}>
        {!apiKey && (
          <div style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 10, alignItems: 'center' }}>
            <AlertTriangle size={16} color="#fbbf24" />
            <span style={{ fontSize: 13, color: '#fbbf24' }}>Enter your Anthropic API key above to enable chart analysis. It's stored only in your browser.</span>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

          {/* Left: Upload */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div
              {...getRootProps()}
              style={{
                border: `2px dashed ${isDragActive ? '#10b981' : '#30363d'}`,
                borderRadius: 12,
                padding: preview ? 10 : 40,
                cursor: 'pointer',
                textAlign: 'center',
                background: isDragActive ? 'rgba(16,185,129,0.05)' : '#161b22',
                transition: 'all 0.2s',
                minHeight: preview ? 'auto' : 220,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <input {...getInputProps()} />
              {preview ? (
                <div style={{ width: '100%' }}>
                  <img src={preview} alt="Chart" style={{ width: '100%', borderRadius: 8, objectFit: 'contain', maxHeight: 500 }} />
                  <p style={{ fontSize: 11, color: '#8b949e', marginTop: 8, marginBottom: 0 }}>Click or drop to replace</p>
                </div>
              ) : (
                <>
                  <Upload size={38} color="#8b949e" style={{ marginBottom: 14 }} />
                  <p style={{ fontSize: 15, fontWeight: 600, color: '#e6edf3', margin: 0 }}>Drop your chart image here</p>
                  <p style={{ fontSize: 13, color: '#8b949e', marginTop: 6 }}>PNG, JPG, WEBP · TradingView, MT4/5, cTrader</p>
                </>
              )}
            </div>

            <button
              onClick={analyze}
              disabled={loading || !image || !apiKey}
              style={{
                width: '100%', padding: '13px', borderRadius: 10, fontWeight: 600, fontSize: 14,
                border: 'none', cursor: (loading || !image || !apiKey) ? 'not-allowed' : 'pointer',
                background: (loading || !image || !apiKey) ? 'rgba(16,185,129,0.15)' : '#059669',
                color: (loading || !image || !apiKey) ? '#34d399' : '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background 0.2s',
              }}
            >
              {loading ? (
                <>
                  <div style={{ width: 16, height: 16, border: '2px solid #34d399', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  Analyzing with Claude AI...
                </>
              ) : (
                <><Zap size={16} />Analyze Order Blocks</>
              )}
            </button>

            {!analysis && !loading && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { icon: Target, label: 'Order Blocks', desc: 'Bullish & Bearish OBs', color: '#34d399' },
                  { icon: TrendingUp, label: 'Breakers', desc: 'Broken OB reversals', color: '#60a5fa' },
                  { icon: Layers, label: 'FVGs & Voids', desc: 'Fair Value Gaps', color: '#fbbf24' },
                  { icon: Activity, label: 'Liquidity', desc: 'Buy/Sell side pools', color: '#a78bfa' },
                ].map(({ icon: Icon, label, desc, color }) => (
                  <div key={label} style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: 14 }}>
                    <Icon size={18} color={color} style={{ marginBottom: 8 }} />
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#e6edf3' }}>{label}</div>
                    <div style={{ fontSize: 11, color: '#8b949e' }}>{desc}</div>
                  </div>
                ))}
              </div>
            )}

            {error && (
              <div style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.4)', borderRadius: 10, padding: 14, display: 'flex', gap: 10 }}>
                <AlertTriangle size={16} color="#f87171" style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#f87171' }}>Analysis Failed</div>
                  <div style={{ fontSize: 12, color: 'rgba(248,113,113,0.8)', marginTop: 3 }}>{error}</div>
                </div>
              </div>
            )}
          </div>

          {/* Right: Results */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {loading && <AnalysisSkeleton />}

            {analysis && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeIn 0.4s ease forwards' }}>
                {/* Overview */}
                <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 12, padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                      <span style={{ fontSize: 18, fontWeight: 700, color: '#e6edf3' }}>{analysis.symbol}</span>
                      {analysis.timeframe !== 'Unknown' && (
                        <span style={{ fontSize: 13, color: '#8b949e', marginLeft: 8 }}>{analysis.timeframe}</span>
                      )}
                    </div>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                      background: analysis.currentBias === 'bullish' ? 'rgba(16,185,129,0.15)' : analysis.currentBias === 'bearish' ? 'rgba(220,38,38,0.15)' : 'rgba(107,114,128,0.15)',
                      border: `1px solid ${analysis.currentBias === 'bullish' ? '#10b981' : analysis.currentBias === 'bearish' ? '#ef4444' : '#6b7280'}`,
                      color: analysis.currentBias === 'bullish' ? '#34d399' : analysis.currentBias === 'bearish' ? '#f87171' : '#9ca3af',
                    }}>
                      <BiasIconEl size={14} />
                      {analysis.currentBias?.charAt(0).toUpperCase() + analysis.currentBias?.slice(1)}
                    </div>
                  </div>
                  {analysis.marketStructure && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      <MarketStructureBadge label="Trend" value={analysis.marketStructure.trend} />
                      {analysis.marketStructure.lastBOS && <MarketStructureBadge label="BOS" value={analysis.marketStructure.lastBOS} />}
                      {analysis.marketStructure.lastCHoCH && <MarketStructureBadge label="CHoCH" value={analysis.marketStructure.lastCHoCH} />}
                    </div>
                  )}
                </div>

                {/* Summary */}
                {analysis.overallAnalysis && (
                  <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 12, padding: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#e6edf3', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Activity size={13} color="#34d399" /> Analysis Summary
                    </div>
                    <p style={{ fontSize: 13, color: '#8b949e', lineHeight: 1.65, margin: 0 }}>{analysis.overallAnalysis}</p>
                  </div>
                )}

                {/* Order Blocks */}
                {analysis.orderBlocks?.length > 0 && (
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#e6edf3', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Target size={13} color="#34d399" /> Order Blocks & Zones
                      <span style={{ marginLeft: 'auto', fontSize: 11, background: '#30363d', padding: '2px 8px', borderRadius: 10 }}>{analysis.orderBlocks.length} found</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {analysis.orderBlocks.map((ob, i) => <OrderBlockCard key={ob.id || i} ob={ob} />)}
                    </div>
                  </div>
                )}

                {/* Liquidity */}
                {analysis.liquidityZones?.length > 0 && (
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#e6edf3', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Layers size={13} color="#fbbf24" /> Liquidity Zones
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {analysis.liquidityZones.map((lz, i) => <LiquidityZone key={i} zone={lz} />)}
                    </div>
                  </div>
                )}

                {/* Key Levels */}
                {analysis.keyLevels && (
                  <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 12, padding: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#e6edf3', marginBottom: 12 }}>Key Price Levels</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      {analysis.keyLevels.support?.length > 0 && (
                        <div>
                          <div style={{ fontSize: 11, color: '#34d399', fontWeight: 600, marginBottom: 6 }}>Support</div>
                          {analysis.keyLevels.support.map((s, i) => (
                            <div key={i} style={{ fontSize: 12, color: '#8b949e', borderLeft: '2px solid rgba(16,185,129,0.4)', paddingLeft: 8, marginBottom: 4 }}>{s}</div>
                          ))}
                        </div>
                      )}
                      {analysis.keyLevels.resistance?.length > 0 && (
                        <div>
                          <div style={{ fontSize: 11, color: '#f87171', fontWeight: 600, marginBottom: 6 }}>Resistance</div>
                          {analysis.keyLevels.resistance.map((r, i) => (
                            <div key={i} style={{ fontSize: 12, color: '#8b949e', borderLeft: '2px solid rgba(220,38,38,0.4)', paddingLeft: 8, marginBottom: 4 }}>{r}</div>
                          ))}
                        </div>
                      )}
                    </div>
                    {analysis.keyLevels.pointsOfInterest?.length > 0 && (
                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #30363d' }}>
                        <div style={{ fontSize: 11, color: '#fbbf24', fontWeight: 600, marginBottom: 6 }}>Points of Interest</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {analysis.keyLevels.pointsOfInterest.map((poi, i) => (
                            <span key={i} style={{ fontSize: 11, background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', color: 'rgba(251,191,36,0.9)', padding: '2px 8px', borderRadius: 4 }}>{poi}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Warnings */}
                {analysis.warnings?.length > 0 && (
                  <div style={{ background: 'rgba(217,119,6,0.1)', border: '1px solid rgba(217,119,6,0.3)', borderRadius: 10, padding: 14 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#fbbf24', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <AlertTriangle size={13} /> Notes & Caveats
                    </div>
                    {analysis.warnings.map((w, i) => (
                      <div key={i} style={{ fontSize: 12, color: 'rgba(251,191,36,0.7)', marginBottom: 3 }}>• {w}</div>
                    ))}
                  </div>
                )}

                {analysis.confidence && (
                  <div style={{ fontSize: 11, color: '#8b949e', textAlign: 'right' }}>
                    Confidence: <span style={{ color: analysis.confidence === 'high' ? '#34d399' : analysis.confidence === 'medium' ? '#fbbf24' : '#f87171' }}>{analysis.confidence}</span>
                  </div>
                )}
              </div>
            )}

            {!loading && !analysis && (
              <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 12, padding: 48, textAlign: 'center' }}>
                <Activity size={44} color="#21262d" style={{ margin: '0 auto 14px' }} />
                <p style={{ fontSize: 13, color: '#8b949e', margin: 0 }}>Upload a chart to begin analysis</p>
                <p style={{ fontSize: 11, color: '#6e7681', marginTop: 6 }}>Powered by Claude AI · SMC &amp; ICT methodology</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}
