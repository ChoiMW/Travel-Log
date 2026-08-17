import React from 'react';
import { Sparkles, Plus, MapPin } from 'lucide-react';
import { VisitedDistrictSummary, PhotoItem, Trip } from '../../types/travel';

interface InstagramStoryBarProps {
  visitedSummaries: VisitedDistrictSummary[];
  photos: PhotoItem[];
  trips: Trip[];
  onSelectDistrict: (districtCode: string) => void;
  onNewTrip: () => void;
}

export const InstagramStoryBar: React.FC<InstagramStoryBarProps> = ({
  visitedSummaries,
  photos,
  trips,
  onSelectDistrict,
  onNewTrip,
}) => {
  // 각 지역별 대표 사진 매핑
  const districtPhotoMap = React.useMemo(() => {
    const map = new Map<string, string>();
    photos.forEach(p => {
      if (p.districtCode && !map.has(p.districtCode)) {
        const url = p.thumbnailUrl || (p.blob ? URL.createObjectURL(p.blob) : '');
        if (url) map.set(p.districtCode, url);
      }
    });
    return map;
  }, [photos]);

  return (
    <div className="instagram-story-bar">
      {/* 내 스토리 / 새 기록 추가 버튼 */}
      <div className="story-item" onClick={onNewTrip}>
        <div
          style={{
            width: '58px',
            height: '58px',
            borderRadius: '50%',
            background: 'var(--bg-subtle)',
            border: '2px dashed var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)',
          }}
        >
          <Plus size={24} />
        </div>
        <span className="story-label">내 여행 추가</span>
      </div>

      {/* 방문한 지역별 인스타 스토리 링 아이템들 */}
      {visitedSummaries.map(summary => {
        const photoUrl = districtPhotoMap.get(summary.districtCode);

        return (
          <div
            key={summary.districtCode}
            className="story-item"
            onClick={() => onSelectDistrict(summary.districtCode)}
          >
            <div className="story-ring-wrapper">
              {photoUrl ? (
                <img src={photoUrl} alt={summary.name} className="story-avatar" />
              ) : (
                <div
                  className="story-avatar"
                  style={{
                    background: summary.color || '#3b82f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '11px',
                  }}
                >
                  {summary.name.slice(0, 2)}
                </div>
              )}
            </div>
            <span className="story-label">{summary.name}</span>
          </div>
        );
      })}

      {visitedSummaries.length === 0 && (
        <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.82rem', color: 'var(--text-muted)', padding: '0 8px' }}>
          방문한 지역의 여행 스토리가 이곳에 인스타 링으로 표시됩니다 ✨
        </div>
      )}
    </div>
  );
};
