import React, { useState, useMemo } from 'react';
import { Calendar, MapPin, Star, Image as ImageIcon, Plus, Search, Filter, ArrowUpDown, Clock, QrCode } from 'lucide-react';
import { Trip, PhotoItem } from '../../types/travel';

interface TripTimelineProps {
  trips: Trip[];
  photos: PhotoItem[];
  onSelectTrip: (trip: Trip) => void;
  onNewTrip: () => void;
}

type SortOption = 'date-desc' | 'date-asc' | 'rating-desc' | 'title-asc';

export const TripTimeline: React.FC<TripTimelineProps> = ({
  trips,
  photos,
  onSelectTrip,
  onNewTrip,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');

  // 사진 매핑
  const photoMapByTripId = useMemo(() => {
    const map = new Map<string, PhotoItem[]>();
    photos.forEach(p => {
      const list = map.get(p.tripId) || [];
      list.push(p);
      map.set(p.tripId, list);
    });
    return map;
  }, [photos]);

  // 존재하는 연도 및 태그 목록 추출
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    trips.forEach(t => {
      if (t.startDate) years.add(t.startDate.split('-')[0]);
    });
    return Array.from(years).sort().reverse();
  }, [trips]);

  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    trips.forEach(t => {
      t.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags);
  }, [trips]);

  // 필터링 및 정렬 적용
  const filteredTrips = useMemo(() => {
    return trips
      .filter(trip => {
        if (selectedYear !== 'all' && !trip.startDate.startsWith(selectedYear)) {
          return false;
        }
        if (selectedTag !== 'all' && (!trip.tags || !trip.tags.includes(selectedTag))) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = trip.title.toLowerCase().includes(q);
          const matchDist = trip.districtNames?.some(d => d.toLowerCase().includes(q));
          const matchMemo = trip.memo?.toLowerCase().includes(q);
          if (!matchTitle && !matchDist && !matchMemo) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date-desc') return b.startDate.localeCompare(a.startDate);
        if (sortBy === 'date-asc') return a.startDate.localeCompare(b.startDate);
        if (sortBy === 'rating-desc') return (b.rating || 0) - (a.rating || 0);
        if (sortBy === 'title-asc') return a.title.localeCompare(b.title);
        return 0;
      });
  }, [trips, selectedYear, selectedTag, searchQuery, sortBy]);

  // 여행 일수 계산 헬퍼 (예: 당일치기, 1박 2일)
  const getDurationText = (start: string, end: string) => {
    if (start === end) return '당일치기';
    const s = new Date(start);
    const e = new Date(end);
    const diffDays = Math.round((e.getTime() - s.getTime()) / (1000 * 3600 * 24));
    if (diffDays <= 0) return '당일치기';
    return `${diffDays}박 ${diffDays + 1}일`;
  };

  if (trips.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', maxWidth: '500px', margin: '0 auto' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>✈️</div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>
          아직 기록된 여행이 없습니다
        </h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '24px', lineHeight: 1.6 }}>
          사진을 업로드하면 촬영 일시와 위치(EXIF)를 자동으로 분석해 지도에 색칠하고 멋진 여행 기록을 만들어 드립니다.
        </p>
        <button className="btn btn-primary" onClick={onNewTrip}>
          <Plus size={18} />
          <span>첫 번째 여행 기록하기</span>
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* 헤더 타이틀 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            나의 여행 기록 ({filteredTrips.length} / {trips.length}개)
          </h2>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
            시간 순서대로 정리된 대한민국 여행 다이어리
          </p>
        </div>
        <button className="btn btn-primary" onClick={onNewTrip}>
          <Plus size={16} />
          <span>새 기록</span>
        </button>
      </div>

      {/* 다차원 필터 툴바 */}
      <div
        style={{
          background: 'var(--bg-surface)',
          padding: '14px 16px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-light)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* 검색창 */}
          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', padding: '0 10px', border: '1px solid var(--border-light)', flex: 1, minWidth: '200px' }}>
            <Search size={14} style={{ color: 'var(--text-muted)', marginRight: '6px' }} />
            <input
              type="text"
              placeholder="제목, 지역, 메모 검색..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                padding: '6px 0',
                fontSize: '0.85rem',
                color: 'var(--text-main)',
                width: '100%',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {/* 연도 필터 */}
            {availableYears.length > 0 && (
              <select
                className="form-select"
                style={{ width: 'auto', padding: '6px 10px', fontSize: '0.82rem' }}
                value={selectedYear}
                onChange={e => setSelectedYear(e.target.value)}
              >
                <option value="all">전체 연도</option>
                {availableYears.map(yr => (
                  <option key={yr} value={yr}>
                    {yr}년
                  </option>
                ))}
              </select>
            )}

            {/* 정렬 드롭다운 */}
            <select
              className="form-select"
              style={{ width: 'auto', padding: '6px 10px', fontSize: '0.82rem' }}
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortOption)}
            >
              <option value="date-desc">최신 여행순</option>
              <option value="date-asc">과거 여행순</option>
              <option value="rating-desc">만족도 높은순</option>
              <option value="title-asc">제목순</option>
            </select>
          </div>
        </div>

        {/* 태그 필터 칩 */}
        {availableTags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>태그:</span>
            <button
              onClick={() => setSelectedTag('all')}
              style={{
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.74rem',
                border: '1px solid var(--border-light)',
                background: selectedTag === 'all' ? 'var(--primary)' : 'var(--bg-subtle)',
                color: selectedTag === 'all' ? 'white' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              전체
            </button>
            {availableTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? 'all' : tag)}
                style={{
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.74rem',
                  border: '1px solid var(--border-light)',
                  background: selectedTag === tag ? 'var(--primary)' : 'var(--bg-subtle)',
                  color: selectedTag === tag ? 'white' : 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 여행 카드 목록 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filteredTrips.map(trip => {
          const tripPhotos = photoMapByTripId.get(trip.id) || [];
          const durationText = getDurationText(trip.startDate, trip.endDate);

          return (
            <div
              key={trip.id}
              onClick={() => onSelectTrip(trip)}
              style={{
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-light)',
                boxShadow: 'var(--shadow-sm)',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)',
                display: 'flex',
                flexDirection: 'column',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              }}
            >
              {/* 상단 테마 컬러 바 */}
              <div style={{ height: '6px', background: trip.color || '#3b82f6' }} />

              <div style={{ padding: '18px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        {trip.title}
                      </h3>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          background: 'var(--primary-light)',
                          color: 'var(--primary)',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                          fontWeight: 700,
                        }}
                      >
                        {durationText}
                      </span>

                      {/* QR 패스 등록 뱃지 */}
                      {trip.itinerary && trip.itinerary.some(i => i.qrCodeData || i.qrImageUrl) && (
                        <span
                          style={{
                            fontSize: '0.72rem',
                            background: trip.country === 'JP' ? 'rgba(244, 63, 94, 0.12)' : 'rgba(49, 130, 246, 0.12)',
                            color: trip.country === 'JP' ? '#f43f5e' : '#3182f6',
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-full)',
                            fontWeight: 800,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                          }}
                        >
                          <QrCode size={11} />
                          <span>QR 패스 {trip.itinerary.filter(i => i.qrCodeData || i.qrImageUrl).length}곳</span>
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', marginTop: '6px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                        <span>
                          {trip.startDate} {trip.startDate !== trip.endDate ? `~ ${trip.endDate}` : ''}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={14} style={{ color: 'var(--primary)' }} />
                        <span>{trip.districtNames?.join(', ') || '지역'}</span>
                      </div>
                    </div>
                  </div>

                  {trip.rating && (
                    <div style={{ display: 'flex', gap: '2px', color: '#f59e0b', fontSize: '0.9rem' }}>
                      {'★'.repeat(trip.rating)}
                    </div>
                  )}
                </div>

                {/* 태그 목록 */}
                {trip.tags && trip.tags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                    {trip.tags.map(tag => (
                      <span
                        key={tag}
                        style={{
                          background: 'var(--bg-subtle)',
                          color: 'var(--text-secondary)',
                          fontSize: '0.75rem',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                          fontWeight: 500,
                        }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* 메모 내용 */}
                {trip.memo && (
                  <p
                    style={{
                      fontSize: '0.88rem',
                      color: 'var(--text-secondary)',
                      marginTop: '12px',
                      lineHeight: 1.6,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {trip.memo}
                  </p>
                )}

                {/* 사진 갤러리 썸네일 스트립 */}
                {tripPhotos.length > 0 && (
                  <div style={{ marginTop: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                      <ImageIcon size={14} />
                      <span>여행 사진 {tripPhotos.length}장</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '8px' }}>
                      {tripPhotos.slice(0, 6).map((photo, i) => (
                        <div
                          key={photo.id}
                          style={{
                            aspectRatio: '1',
                            borderRadius: 'var(--radius-md)',
                            overflow: 'hidden',
                            background: '#cbd5e1',
                            position: 'relative',
                          }}
                        >
                          <img
                            src={photo.thumbnailUrl || (photo.blob ? URL.createObjectURL(photo.blob) : '')}
                            alt={photo.fileName}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          {i === 5 && tripPhotos.length > 6 && (
                            <div
                              style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'rgba(0,0,0,0.55)',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '0.9rem',
                              }}
                            >
                              +{tripPhotos.length - 6}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
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
