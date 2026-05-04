'use client';

import { useTheme } from 'next-themes';

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}

export default function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  if (!active || !payload || payload.length === 0) return null;

  return (
    <div
      style={{
        backgroundColor: isDark ? '#303030' : '#ffffff',
        border: `1px solid ${isDark ? '#3D3D3D' : '#E5E6E6'}`,
        borderRadius: '12px',
        padding: '10px 14px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        fontSize: '13px',
        color: isDark ? '#ffffff' : '#1E1E1E',
      }}
    >
      {label && (
        <p style={{ marginBottom: 6, opacity: 0.6, fontWeight: 500 }}>{label}</p>
      )}
      {payload.map((entry, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: i > 0 ? 4 : 0 }}>
          <span
            style={{
              display: 'inline-block',
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: entry.color,
              flexShrink: 0,
            }}
          />
          <span style={{ opacity: 0.7 }}>{entry.name}:</span>
          <span style={{ fontWeight: 700 }}>{entry.value}</span>
        </div>
      ))}
    </div>
  );
}
