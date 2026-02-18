export default function MessageInputSkeleton({ accent = '#FF3AF2', clash = '#FFE600' }) {
  return (
    <div className="flex-shrink-0 p-4">
      {/* Mirrors the real input container */}
      <div
        className="flex items-end gap-3 rounded-3xl border-4 p-3"
        style={{
          borderColor: accent,
          backgroundColor: 'rgba(45,27,78,0.6)',
          boxShadow: `0 0 20px ${accent}44`,
        }}
      >
        {/* Textarea placeholder */}
        <div
          className="flex-1 animate-pulse rounded-lg"
          style={{
            height: '24px',
            background: 'rgba(255,255,255,0.08)',
          }}
        />

        {/* Send button placeholder */}
        <div
          className="flex-shrink-0 animate-pulse rounded-full border-4 px-5 py-2"
          style={{
            width: '74px',
            height: '40px',
            borderColor: clash,
            background: `linear-gradient(135deg, ${accent}44, ${clash}44)`,
          }}
        />
      </div>

      {/* Hint text placeholder */}
      <div
        className="mt-1.5 mx-2 animate-pulse rounded"
        style={{
          height: '10px',
          width: '200px',
          background: 'rgba(255,255,255,0.08)',
        }}
      />
    </div>
  );
}
