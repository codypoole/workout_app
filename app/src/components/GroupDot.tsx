/* ============ Group color dot ============ */
const GROUP_HUES: Record<string, number> = {
  Chest: 8,
  Back: 200,
  Legs: 140,
  Shoulders: 48,
  Arms: 280,
  Core: 330,
  'Full Body': 100,
  Cardio: 25,
};

export function groupColor(g: string | undefined): string {
  const h = GROUP_HUES[g ?? ''] ?? 0;
  return `oklch(0.72 0.16 ${h})`;
}

export function GroupDot({ group, size = 8 }: { group?: string; size?: number }) {
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: 99,
        background: groupColor(group),
        flexShrink: 0,
        display: 'inline-block',
      }}
    />
  );
}
