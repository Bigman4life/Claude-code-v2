export default function LiquidityZone({ zone }) {
  const isBuy = zone.type === 'buy_side';

  return (
    <div style={{
      background: isBuy ? 'rgba(16,185,129,0.07)' : 'rgba(239,68,68,0.07)',
      border: `1px solid ${isBuy ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
      borderRadius: 8,
      padding: '10px 12px',
      display: 'flex',
      gap: 10,
      alignItems: 'flex-start',
    }}>
      <div style={{
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: isBuy ? '#10b981' : '#ef4444',
        marginTop: 4,
        flexShrink: 0,
      }} />
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: isBuy ? '#34d399' : '#f87171', marginBottom: 2 }}>
          {isBuy ? 'Buy Side Liquidity' : 'Sell Side Liquidity'}
          {zone.priceArea && <span style={{ color: '#8b949e', fontWeight: 400, marginLeft: 6 }}>@ {zone.priceArea}</span>}
        </div>
        {zone.description && (
          <p style={{ fontSize: 12, color: '#8b949e', margin: 0, lineHeight: 1.5 }}>{zone.description}</p>
        )}
      </div>
    </div>
  );
}
