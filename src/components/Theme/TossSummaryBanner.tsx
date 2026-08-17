import React from 'react';
import { ArrowRight, Compass, MapPin, Sparkles, Trophy } from 'lucide-react';

interface TossSummaryBannerProps {
  visitedCount: number;
  totalCount: number;
  onExploreStats: () => void;
  onNewTrip: () => void;
}

export const TossSummaryBanner: React.FC<TossSummaryBannerProps> = ({
  visitedCount,
  totalCount,
  onExploreStats,
  onNewTrip,
}) => {
  const percent = totalCount > 0 ? ((visitedCount / totalCount) * 100).toFixed(1) : '0.0';

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px 26px',
        marginBottom: '16px',
        boxShadow: 'var(--shadow-md)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '4px' }}>
          <Compass size={16} />
          <span>내 대한민국 정복 현황</span>
        </div>
        <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
          전국 250개 시·군·구 중 <span style={{ color: 'var(--primary)' }}>{visitedCount}곳</span>을 다녀왔어요
        </h2>
        <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
          전체 국토의 {percent}%를 발자취로 채웠습니다.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          className="btn btn-outline"
          onClick={onExploreStats}
          style={{ padding: '10px 16px', borderRadius: 'var(--radius-md)', fontWeight: 700 }}
        >
          <span>자세히 보기</span>
          <ArrowRight size={16} />
        </button>
        <button
          className="btn btn-primary"
          onClick={onNewTrip}
          style={{ padding: '10px 18px', borderRadius: 'var(--radius-md)' }}
        >
          <span>새 여행 기록</span>
        </button>
      </div>
    </div>
  );
};
