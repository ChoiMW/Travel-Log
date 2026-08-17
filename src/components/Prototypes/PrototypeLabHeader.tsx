import React from 'react';
import { Sparkles, Image as ImageIcon, Clock, Shuffle, Luggage, Gift, RotateCcw } from 'lucide-react';

export type PrototypeMode = 'mosaic' | 'timeTravel' | 'roulette' | 'pocket' | 'capsule' | 'classic';

interface PrototypeLabHeaderProps {
  currentMode: PrototypeMode;
  onSelectMode: (mode: PrototypeMode) => void;
}

export const PrototypeLabHeader: React.FC<PrototypeLabHeaderProps> = ({
  currentMode,
  onSelectMode,
}) => {
  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        borderRadius: '22px',
        padding: '10px 12px',
        boxShadow: 'var(--shadow-md)',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px',
        border: '1px solid var(--border-light)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingLeft: '8px' }}>
        <Sparkles size={18} color="#3182f6" />
        <span style={{ fontSize: '0.88rem', fontWeight: 900, color: 'var(--text-main)' }}>
          🧪 프로토타입 랩
        </span>
      </div>

      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', padding: '2px', scrollbarWidth: 'none' }}>
        <button
          onClick={() => onSelectMode('mosaic')}
          style={{
            padding: '8px 14px',
            borderRadius: '14px',
            border: 'none',
            background: currentMode === 'mosaic' ? '#312e81' : 'var(--bg-hover)',
            color: currentMode === 'mosaic' ? '#ffffff' : 'var(--text-secondary)',
            fontSize: '0.84rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <ImageIcon size={15} />
          <span>1. 포토 모자이크 맵</span>
        </button>

        <button
          onClick={() => onSelectMode('timeTravel')}
          style={{
            padding: '8px 14px',
            borderRadius: '14px',
            border: 'none',
            background: currentMode === 'timeTravel' ? '#1e293b' : 'var(--bg-hover)',
            color: currentMode === 'timeTravel' ? '#ffffff' : 'var(--text-secondary)',
            fontSize: '0.84rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Clock size={15} />
          <span>A. 4계절 타임슬립</span>
        </button>

        <button
          onClick={() => onSelectMode('roulette')}
          style={{
            padding: '8px 14px',
            borderRadius: '14px',
            border: 'none',
            background: currentMode === 'roulette' ? '#059669' : 'var(--bg-hover)',
            color: currentMode === 'roulette' ? '#ffffff' : 'var(--text-secondary)',
            fontSize: '0.84rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Shuffle size={15} />
          <span>B. 추천 룰렛</span>
        </button>

        <button
          onClick={() => onSelectMode('pocket')}
          style={{
            padding: '8px 14px',
            borderRadius: '14px',
            border: 'none',
            background: currentMode === 'pocket' ? '#4f46e5' : 'var(--bg-hover)',
            color: currentMode === 'pocket' ? '#ffffff' : 'var(--text-secondary)',
            fontSize: '0.84rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Luggage size={15} />
          <span>C. 짐싸기/가계부</span>
        </button>

        <button
          onClick={() => onSelectMode('capsule')}
          style={{
            padding: '8px 14px',
            borderRadius: '14px',
            border: 'none',
            background: currentMode === 'capsule' ? '#be185d' : 'var(--bg-hover)',
            color: currentMode === 'capsule' ? '#ffffff' : 'var(--text-secondary)',
            fontSize: '0.84rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Gift size={15} />
          <span>D. 1년 뒤 타임캡슐</span>
        </button>

        <button
          onClick={() => onSelectMode('classic')}
          style={{
            padding: '8px 12px',
            borderRadius: '14px',
            border: 'none',
            background: currentMode === 'classic' ? '#3182f6' : 'transparent',
            color: currentMode === 'classic' ? '#ffffff' : 'var(--text-muted)',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          기본 토스 홈
        </button>
      </div>
    </div>
  );
};
