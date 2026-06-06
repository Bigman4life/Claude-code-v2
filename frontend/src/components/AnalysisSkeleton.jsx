function Shimmer({ height = 16, width = '100%', radius = 6, style = {} }) {
  return (
    <div style={{
      height,
      width,
      borderRadius: radius,
      background: 'linear-gradient(90deg, #161b22 25%, #21262d 50%, #161b22 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
      ...style,
    }} />
  );
}

export default function AnalysisSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <style>{`@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }`}</style>

      {/* Overview skeleton */}
      <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 12, padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Shimmer height={22} width={120} />
          <Shimmer height={30} width={100} radius={20} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Shimmer height={22} width={80} />
          <Shimmer height={22} width={90} />
        </div>
      </div>

      {/* Summary skeleton */}
      <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 12, padding: 16 }}>
        <Shimmer height={14} width={120} style={{ marginBottom: 10 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Shimmer height={12} width="100%" />
          <Shimmer height={12} width="95%" />
          <Shimmer height={12} width="88%" />
          <Shimmer height={12} width="92%" />
        </div>
      </div>

      {/* Order blocks skeleton */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Shimmer height={14} width={140} />
          <Shimmer height={20} width={60} radius={10} style={{ marginLeft: 'auto' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ border: '1px solid #30363d', borderRadius: 10, padding: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#30363d' }} />
                <Shimmer height={14} width={130} />
                <Shimmer height={18} width={55} radius={4} style={{ marginLeft: 8 }} />
              </div>
              <div style={{ marginTop: 6, marginLeft: 18 }}>
                <Shimmer height={11} width={160} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ textAlign: 'center', fontSize: 12, color: '#6e7681', paddingTop: 8 }}>
        <span>Claude AI is analyzing your chart...</span>
      </div>
    </div>
  );
}
