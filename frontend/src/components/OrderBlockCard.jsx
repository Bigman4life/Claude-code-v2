import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const TYPE_META = {
  bullish_ob: { label: 'Bullish OB', borderColor: '#10b981', bgColor: 'rgba(16,185,129,0.08)', textColor: '#34d399', dotColor: '#10b981' },
  bearish_ob: { label: 'Bearish OB', borderColor: '#ef4444', bgColor: 'rgba(239,68,68,0.08)', textColor: '#f87171', dotColor: '#ef4444' },
  bullish_breaker: { label: 'Bullish Breaker', borderColor: '#3b82f6', bgColor: 'rgba(59,130,246,0.08)', textColor: '#60a5fa', dotColor: '#3b82f6' },
  bearish_breaker: { label: 'Bearish Breaker', borderColor: '#a855f7', bgColor: 'rgba(168,85,247,0.08)', textColor: '#c084fc', dotColor: '#a855f7' },
  bullish_mitigation: { label: 'Bullish Mitigation', borderColor: '#14b8a6', bgColor: 'rgba(20,184,166,0.08)', textColor: '#2dd4bf', dotColor: '#14b8a6' },
  bearish_mitigation: { label: 'Bearish Mitigation', borderColor: '#f97316', bgColor: 'rgba(249,115,22,0.08)', textColor: '#fb923c', dotColor: '#f97316' },
  fvg: { label: 'Fair Value Gap', borderColor: '#eab308', bgColor: 'rgba(234,179,8,0.08)', textColor: '#facc15', dotColor: '#eab308' },
  void: { label: 'Void', borderColor: '#6b7280', bgColor: 'rgba(107,114,128,0.08)', textColor: '#9ca3af', dotColor: '#6b7280' },
};

const STRENGTH_COLORS = {
  strong: '#34d399',
  moderate: '#fbbf24',
  weak: '#f87171',
};

const STATUS_COLORS = {
  unmitigated: '#34d399',
  mitigated: '#fbbf24',
  broken: '#f87171',
};

export default function OrderBlockCard({ ob }) {
  const [expanded, setExpanded] = useState(false);
  const meta = TYPE_META[ob.type] || TYPE_META.bullish_ob;

  return (
    <div
      style={{
        border: `1px solid ${meta.borderColor}`,
        borderRadius: 10,
        background: meta.bgColor,
        overflow: 'hidden',
        transition: 'all 0.2s',
      }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%',
          padding: '12px 14px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          textAlign: 'left',
        }}
      >
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: meta.dotColor, flexShrink: 0 }} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: meta.textColor }}>{ob.label || meta.label}</span>
            {ob.strength && (
              <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: 'rgba(0,0,0,0.3)', color: STRENGTH_COLORS[ob.strength] || '#8b949e' }}>
                {ob.strength}
              </span>
            )}
            {ob.status && (
              <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: 'rgba(0,0,0,0.3)', color: STATUS_COLORS[ob.status] || '#8b949e' }}>
                {ob.status}
              </span>
            )}
          </div>
          {ob.priceZone && (ob.priceZone.high || ob.priceZone.low) && (
            <div style={{ fontSize: 11, color: '#8b949e', marginTop: 2 }}>
              Zone: {ob.priceZone.low} – {ob.priceZone.high}
            </div>
          )}
        </div>

        {expanded ? <ChevronUp size={14} color="#8b949e" /> : <ChevronDown size={14} color="#8b949e" />}
      </button>

      {expanded && (
        <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {ob.description && (
            <div>
              <div style={{ fontSize: 11, color: '#6e7681', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Description</div>
              <p style={{ fontSize: 12, color: '#8b949e', lineHeight: 1.6, margin: 0 }}>{ob.description}</p>
            </div>
          )}

          {ob.tradingImplication && (
            <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 6, padding: 10 }}>
              <div style={{ fontSize: 11, color: '#fbbf24', fontWeight: 600, marginBottom: 4 }}>Trading Implication</div>
              <p style={{ fontSize: 12, color: '#8b949e', lineHeight: 1.6, margin: 0 }}>{ob.tradingImplication}</p>
            </div>
          )}

          {ob.confluences?.length > 0 && (
            <div>
              <div style={{ fontSize: 11, color: '#6e7681', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Confluences</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {ob.confluences.map((c, i) => (
                  <span key={i} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'rgba(0,0,0,0.3)', border: `1px solid ${meta.borderColor}40`, color: meta.textColor }}>
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          {ob.locationOnChart && (
            <div style={{ fontSize: 11, color: '#6e7681' }}>
              Location: <span style={{ color: '#8b949e' }}>{ob.locationOnChart}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
