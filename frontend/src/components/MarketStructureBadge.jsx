export default function MarketStructureBadge({ label, value }) {
  if (!value) return null;
  const v = String(value).toLowerCase();

  const color = v.includes('bull') || v.includes('up') || v.includes('bullish')
    ? '#34d399'
    : v.includes('bear') || v.includes('down') || v.includes('bearish')
    ? '#f87171'
    : '#9ca3af';

  const bg = v.includes('bull') || v.includes('up') || v.includes('bullish')
    ? 'rgba(16,185,129,0.1)'
    : v.includes('bear') || v.includes('down') || v.includes('bearish')
    ? 'rgba(239,68,68,0.1)'
    : 'rgba(107,114,128,0.1)';

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '3px 8px',
      borderRadius: 6,
      background: bg,
      border: `1px solid ${color}40`,
    }}>
      <span style={{ fontSize: 10, color: '#6e7681', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
      <span style={{ fontSize: 11, fontWeight: 600, color }}>{value}</span>
    </div>
  );
}
