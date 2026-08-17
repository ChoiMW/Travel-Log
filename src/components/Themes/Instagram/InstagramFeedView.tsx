import React, { useState } from 'react';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Grid, MapPin, Plus, Sparkles, Image as ImageIcon } from 'lucide-react';
import { Trip, PhotoItem, VisitedDistrictSummary, DistrictFeatureProperties } from '../../../types/travel';
import { InstagramStoryBar } from '../../Theme/InstagramStoryBar';
import { MapViewer } from '../../Map/MapViewer';

interface InstagramFeedViewProps {
  trips: Trip[];
  photos: PhotoItem[];
  visitedSummaries: VisitedDistrictSummary[];
  visitedSummaryMap: Map<string, VisitedDistrictSummary>;
  onSelectTrip: (trip: Trip) => void;
  onNewTrip: () => void;
  onSelectDistrict: (district: DistrictFeatureProperties) => void;
  onOpenPhoto: (photo: PhotoItem) => void;
}

export const InstagramFeedView: React.FC<InstagramFeedViewProps> = ({
  trips,
  photos,
  visitedSummaries,
  visitedSummaryMap,
  onSelectTrip,
  onNewTrip,
  onSelectDistrict,
  onOpenPhoto,
}) => {
  const [subTab, setSubTab] = useState<'feed' | 'grid' | 'map'>('feed');
  const [likedTrips, setLikedTrips] = useState<Set<string>>(new Set());
  const [savedTrips, setSavedTrips] = useState<Set<string>>(new Set());
  const [doubleTapHeart, setDoubleTapHeart] = useState<string | null>(null);

  // 여행별 사진 매핑
  const photoMapByTripId = React.useMemo(() => {
    const map = new Map<string, PhotoItem[]>();
    photos.forEach(p => {
      const list = map.get(p.tripId) || [];
      list.push(p);
      map.set(p.tripId, list);
    });
    return map;
  }, [photos]);

  const toggleLike = (tripId: string) => {
    setLikedTrips(prev => {
      const next = new Set(prev);
      if (next.has(tripId)) next.delete(tripId);
      else next.add(tripId);
      return next;
    });
  };

  const toggleSave = (tripId: string) => {
    setSavedTrips(prev => {
      const next = new Set(prev);
      if (next.has(tripId)) next.delete(tripId);
      else next.add(tripId);
      return next;
    });
  };

  const handleDoubleTap = (tripId: string) => {
    setLikedTrips(prev => new Set(prev).add(tripId));
    setDoubleTapHeart(tripId);
    setTimeout(() => setDoubleTapHeart(null), 800);
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '70px' }}>
      {/* 1. 상단 인스타 스토리 링 바 */}
      <InstagramStoryBar
        visitedSummaries={visitedSummaries}
        photos={photos}
        trips={trips}
        onSelectDistrict={code => {
          const t = trips.find(trip => trip.districtCodes.includes(code));
          if (t) onSelectTrip(t);
        }}
        onNewTrip={onNewTrip}
      />

      {/* 2. 인스타 서브 탭 네비게이션 (피드 / 3열 그리드 / 지도) */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          borderBottom: '1px solid var(--border-light)',
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)',
          padding: '8px 0',
        }}
      >
        <button
          onClick={() => setSubTab('feed')}
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: '0.86rem',
            fontWeight: subTab === 'feed' ? 800 : 500,
            color: subTab === 'feed' ? '#e1306c' : 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '6px 14px',
            borderBottom: subTab === 'feed' ? '2px solid #e1306c' : 'none',
          }}
        >
          📷 피드 뷰
        </button>
        <button
          onClick={() => setSubTab('grid')}
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: '0.86rem',
            fontWeight: subTab === 'grid' ? 800 : 500,
            color: subTab === 'grid' ? '#e1306c' : 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '6px 14px',
            borderBottom: subTab === 'grid' ? '2px solid #e1306c' : 'none',
          }}
        >
          <Grid size={15} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
          3열 갤러리
        </button>
        <button
          onClick={() => setSubTab('map')}
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: '0.86rem',
            fontWeight: subTab === 'map' ? 800 : 500,
            color: subTab === 'map' ? '#e1306c' : 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '6px 14px',
            borderBottom: subTab === 'map' ? '2px solid #e1306c' : 'none',
          }}
        >
          🗺️ 여행 지도
        </button>
      </div>

      {/* 3-A. 메인 피드 뷰 (Instagram Post Card Feed) */}
      {subTab === 'feed' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {trips.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '10px' }}>📸</div>
              <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>아직 게시물이 없습니다</p>
              <p style={{ fontSize: '0.84rem', marginTop: '4px' }}>첫 번째 여행 사진을 업로드해 감성 피드를 채워보세요.</p>
              <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={onNewTrip}>
                <Plus size={16} />
                <span>여행 포스팅 작성</span>
              </button>
            </div>
          ) : (
            trips.map(trip => {
              const tripPhotos = photoMapByTripId.get(trip.id) || [];
              const primaryPhoto = tripPhotos[0];
              const photoUrl = primaryPhoto?.thumbnailUrl || (primaryPhoto?.blob ? URL.createObjectURL(primaryPhoto.blob) : '');
              const isLiked = likedTrips.has(trip.id);
              const isSaved = savedTrips.has(trip.id);

              return (
                <div
                  key={trip.id}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                  }}
                >
                  {/* 포스트 헤더 */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
                          padding: '2px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <div
                          style={{
                            width: '100%',
                            height: '100%',
                            borderRadius: '50%',
                            background: trip.color || '#3b82f6',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: 800,
                          }}
                        >
                          {trip.districtNames?.[0]?.slice(0, 1) || '旅'}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>
                          {trip.title}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#e1306c', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <MapPin size={11} />
                          <span>{trip.districtNames?.join(', ')}</span>
                        </div>
                      </div>
                    </div>

                    <button className="btn-icon" onClick={() => onSelectTrip(trip)}>
                      <MoreHorizontal size={18} />
                    </button>
                  </div>

                  {/* 포스트 사진 미디어 영역 (더블 탭 시 하트) */}
                  <div
                    style={{
                      aspectRatio: '1',
                      background: '#111827',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                    onDoubleClick={() => handleDoubleTap(trip.id)}
                  >
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt="feed"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                        <ImageIcon size={48} style={{ opacity: 0.5, margin: '0 auto 8px' }} />
                        <div style={{ fontSize: '0.85rem' }}>{trip.title}</div>
                      </div>
                    )}

                    {/* 더블탭 하트 애니메이션 */}
                    {doubleTapHeart === trip.id && (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          animation: 'fadeIn 0.2s ease',
                        }}
                      >
                        <Heart size={84} fill="white" color="white" style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))' }} />
                      </div>
                    )}

                    {tripPhotos.length > 1 && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          background: 'rgba(0,0,0,0.7)',
                          color: 'white',
                          borderRadius: '9999px',
                          padding: '3px 9px',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                        }}
                      >
                        1/{tripPhotos.length}
                      </div>
                    )}
                  </div>

                  {/* 액션 버튼 바 */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px' }}>
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                      <button
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        onClick={() => toggleLike(trip.id)}
                      >
                        <Heart
                          size={24}
                          fill={isLiked ? '#ef4444' : 'none'}
                          color={isLiked ? '#ef4444' : 'var(--text-main)'}
                        />
                      </button>
                      <button
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        onClick={() => onSelectTrip(trip)}
                      >
                        <MessageCircle size={24} color="var(--text-main)" />
                      </button>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        <Send size={22} color="var(--text-main)" />
                      </button>
                    </div>

                    <button
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      onClick={() => toggleSave(trip.id)}
                    >
                      <Bookmark
                        size={24}
                        fill={isSaved ? 'var(--text-main)' : 'none'}
                        color="var(--text-main)"
                      />
                    </button>
                  </div>

                  {/* 본문 및 캡션 */}
                  <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {trip.rating && (
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f59e0b' }}>
                        {'★'.repeat(trip.rating)} 여행 만족도 {trip.rating}.0
                      </div>
                    )}

                    {trip.memo && (
                      <div style={{ fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                        <span style={{ fontWeight: 800, marginRight: '6px' }}>TravelLog</span>
                        <span>{trip.memo}</span>
                      </div>
                    )}

                    {trip.tags && trip.tags.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {trip.tags.map(tag => (
                          <span key={tag} style={{ color: '#38bdf8', fontSize: '0.8rem', fontWeight: 600 }}>
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {trip.startDate} {trip.startDate !== trip.endDate ? `~ ${trip.endDate}` : ''}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 3-B. 3열 썸네일 그리드 뷰 (3x3 Grid Profile View) */}
      {subTab === 'grid' && (
        <div>
          {/* 상단 프로필 요약 헤더 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-around',
              padding: '18px',
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-light)',
              marginBottom: '12px',
              textAlign: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{trips.length}</div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>게시물</div>
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#e1306c' }}>{visitedSummaries.length}</div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>정복 시군구</div>
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#38bdf8' }}>{photos.length}</div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>보관 사진</div>
            </div>
          </div>

          {/* 3열 정방형 그리드 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
            {photos.map(photo => {
              const url = photo.thumbnailUrl || (photo.blob ? URL.createObjectURL(photo.blob) : '');
              return (
                <div
                  key={photo.id}
                  onClick={() => onOpenPhoto(photo)}
                  style={{
                    aspectRatio: '1',
                    background: '#e2e8f0',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  <img src={url} alt={photo.fileName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3-C. 지도 뷰 */}
      {subTab === 'map' && (
        <MapViewer
          trips={trips}
          photos={photos}
          visitedSummaryMap={visitedSummaryMap}
          onSelectTrip={onSelectTrip}
          onNewTripForDistrict={onSelectDistrict}
        />
      )}
    </div>
  );
};
