const stageColors: Record<string, string> = {
  new:           'bg-blue-500',
  contacted:     'bg-violet-500',
  qualified:     'bg-indigo-500',
  proposal_sent: 'bg-amber-500',
  negotiation:   'bg-yellow-500',
  won:           'bg-emerald-500',
  lost:          'bg-red-500',
};

export default function StageDot({ stage, size = 'md' }: { stage: string; size?: 'sm' | 'md' }) {
  const sizeClass = size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5';
  return <span className={`stage-dot ${sizeClass} ${stageColors[stage] || 'bg-gray-400'}`} />;
}
