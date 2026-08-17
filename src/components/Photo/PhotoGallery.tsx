import React, { useState, useMemo } from 'react';
import { Image as ImageIcon, MapPin, Calendar, Camera, Search, Filter } from 'lucide-react';
import { PhotoItem, Trip } from '../../types/travel';

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
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const tripMap = useMemo(() => {
    const map = new Map<string, Trip>();
    trips.forEach(t => map.set(t.id, t));
    return map;
  }, [trips]);

  // 사진들로부터 고유 지역 목록 추출
  const availableDistricts = useMemo(() => {
    const set = new Set<string>();
    photos.forEach(p => {
      if (p.districtName) set.add(p.districtName);
    });
    return Array.from(set).sort();
  }, [photos]);

  const filteredPhotos = useMemo(() => {
    return photos.filter(photo => {
      if (selectedTripId !== 'all' && photo.tripId !== selectedTripId) {
        return false;
      }
      if (selectedDistrict !== 'all' && photo.districtName !== selectedDistrict) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const trip = tripMap.get(photo.tripId);
        const matchTitle = trip?.title.toLowerCase().includes(q);
        const matchDistrict = photo.districtName?.toLowerCase().includes(q);
        const matchDate = photo.takenAt?.toLowerCase().includes(q);
        const matchModel = photo.model?.toLowerCase().includes(q);
        if (!matchTitle && !matchDistrict && !matchDate && !matchModel) return false;
      }
      return true;
    });
  }, [photos, selectedTripId, selectedDistrict, searchQuery, tripMap]);

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
            style={{ width: 'auto', minWidth: '150px', padding: '6px 12px', fontSize: '0.86rem' }}
            value={selectedTripId}
            onChange={e => setSelectedTripId(e.target.value)}
          >
            <option value="all">모든 여행 ({trips.length})</option>
            {trips.map(trip => (
              <option key={trip.id} value={trip.id}>
                {trip.title}
              </option>
            ))}
          </select>

          {availableDistricts.length > 0 && (
            <select
              className="form-select"
              style={{ width: 'auto', minWidth: '130px', padding: '6px 12px', fontSize: '0.86rem' }}
              value={selectedDistrict}
              onChange={e => setSelectedDistrict(e.target.value)}
            >
              <option value="all">모든 지역 ({availableDistricts.length})</option>
              {availableDistricts.map(dist => (
                <option key={dist} value={dist}>
                  {dist}
                </option>
              ))}
            </select>
          )}

          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="form-input"
              style={{ width: '170px', padding: '6px 12px 6px 30px', fontSize: '0.86rem' }}
              placeholder="지역 또는 날짜 검색..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>
        </div>
      </div>

      {/* 사진 그리드 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '14px',
        }}
      >
        {filteredPhotos.map(photo => {
          const trip = tripMap.get(photo.tripId);
          return (
            <div
              key={photo.id}
              onClick={() => onPhotoClick(photo)}
              style={{
                borderRadius: '18px',
                overflow: 'hidden',
                background: 'var(--bg-surface)',
                boxShadow: 'var(--shadow-sm)',
                border: '1px solid var(--border-light)',
                cursor: 'pointer',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              }}
            >
              <div style={{ aspectRatio: '1', width: '100%', overflow: 'hidden', background: '#e2e8f0' }}>
                <img
                  src={photo.thumbnailUrl || (photo.blob ? URL.createObjectURL(photo.blob) : '')}
                  alt={photo.fileName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              <div style={{ padding: '12px' }}>
                <div style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {trip?.title || '여행'}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.76rem', color: '#f43f5e', fontWeight: 700, marginTop: '4px' }}>
                  <MapPin size={12} />
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {photo.districtName || '위치 미상'}
                  </span>
                </div>

                {photo.takenAt && (
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {photo.takenAt.split('T')[0]}
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
