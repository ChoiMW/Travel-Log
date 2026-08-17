import React, { useState, useMemo } from 'react';
import { Image as ImageIcon, MapPin, Calendar, Camera, Search, Filter } from 'lucide-react';
import { PhotoItem, Trip } from '../../types/travel';
import { sdoList } from '../../utils/geoMatcher';

interface PhotoGalleryProps {
  photos: PhotoItem[];
  trips: Trip[];
  onPhotoClick: (photo: PhotoItem) => void;
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({
  photos,
  trips,
  onPhotoClick,
}) => {
  const [selectedTripId, setSelectedTripId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const tripMap = useMemo(() => {
    const map = new Map<string, Trip>();
    trips.forEach(t => map.set(t.id, t));
    return map;
  }, [trips]);

  const filteredPhotos = useMemo(() => {
    return photos.filter(photo => {
      if (selectedTripId !== 'all' && photo.tripId !== selectedTripId) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const trip = tripMap.get(photo.tripId);
        const matchTitle = trip?.title.toLowerCase().includes(q);
        const matchDistrict = photo.districtName?.toLowerCase().includes(q);
        const matchDate = photo.takenAt?.toLowerCase().includes(q);
        if (!matchTitle && !matchDistrict && !matchDate) return false;
      }
      return true;
    });
  }, [photos, selectedTripId, searchQuery, tripMap]);

  if (photos.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', maxWidth: '500px', margin: '0 auto' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>📸</div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>
          저장된 여행 사진이 없습니다
        </h3>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          여행을 기록할 때 사진을 첨부하면 사진의 EXIF(촬영날짜, GPS 위치) 정보와 함께 이곳에서 모아볼 수 있습니다.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 헤더 및 필터 영역 */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            여행 사진첩 ({filteredPhotos.length}장)
          </h2>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
            촬영일시 및 위치(GPS) 메타데이터가 담긴 사진 컬렉션
          </p>
        </div>

        {/* 필터 컨트롤 */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '160px', padding: '6px 12px', fontSize: '0.86rem' }}
            value={selectedTripId}
            onChange={e => setSelectedTripId(e.target.value)}
          >
            <option value="all">모든 여행 사진 ({photos.length})</option>
            {trips.map(trip => (
              <option key={trip.id} value={trip.id}>
                {trip.title}
              </option>
            ))}
          </select>

          <input
            type="text"
            className="form-input"
            style={{ width: '180px', padding: '6px 12px', fontSize: '0.86rem' }}
            placeholder="지역 또는 날짜 검색..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* 사진 그리드 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: '12px',
        }}
      >
        {filteredPhotos.map(photo => {
          const displayUrl = photo.thumbnailUrl || (photo.blob ? URL.createObjectURL(photo.blob) : '');
          const trip = tripMap.get(photo.tripId);

          return (
            <div
              key={photo.id}
              onClick={() => onPhotoClick(photo)}
              style={{
                aspectRatio: '1',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                position: 'relative',
                cursor: 'pointer',
                background: '#e2e8f0',
                boxShadow: 'var(--shadow-sm)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              }}
            >
              <img
                src={displayUrl}
                alt={photo.fileName}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />

              {/* 하단 오버레이 정보 */}
              <div
                style={{
                  position: 'absolute',
                  inset: 'auto 0 0 0',
                  padding: '24px 8px 8px',
                  background: 'linear-gradient(to top, rgba(15, 23, 42, 0.85) 0%, transparent 100%)',
                  color: 'white',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                }}
              >
                {photo.districtName && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.76rem', fontWeight: 600 }}>
                    <MapPin size={12} style={{ color: '#38bdf8' }} />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {photo.districtName}
                    </span>
                  </div>
                )}

                {photo.takenAt && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', opacity: 0.85 }}>
                    <Calendar size={11} />
                    <span>{photo.takenAt.split('T')[0]}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
