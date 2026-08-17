import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Navigation, NavTab } from './components/Layout/Navigation';
import { TossHomeView } from './components/Themes/Toss/TossHomeView';
import { MapViewer } from './components/Map/MapViewer';
import { JapanMapViewer } from './components/Map/JapanMapViewer';
import { TripTimeline } from './components/Diary/TripTimeline';
import { TripDetailModal } from './components/Diary/TripDetailModal';
import { TripEditorModal } from './components/Editor/TripEditorModal';
import { PhotoGallery } from './components/Photo/PhotoGallery';
import { PhotoLightbox } from './components/Photo/PhotoLightbox';
import { StatsDashboard } from './components/Stats/StatsDashboard';
import { SettingsModal } from './components/Settings/SettingsModal';
import { TravelPocketView } from './components/Pocket/TravelPocketView';

import { getAllTrips, getAllPhotos, saveTrip, savePhotos, deleteTrip } from './db';
import { Trip, PhotoItem, VisitedDistrictSummary, DistrictFeatureProperties, CountryCode } from './types/travel';
import { ParsedPhotoResult } from './utils/exif';
import { matchActiveTrip, ActiveTripMatchResult } from './utils/tripMatcher';
import districtsData from './data/koreaDistricts.json';
import { MapPin, Calendar, Sparkles, ArrowRight, X } from 'lucide-react';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('home');
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>('KR');
  const [trips, setTrips] = useState<Trip[]>([]);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 실시간 위치 및 오늘 날짜 기반 자동 매칭 상태
  const [activeMatchResult, setActiveMatchResult] = useState<ActiveTripMatchResult | null>(null);
  const [isMatchBannerDismissed, setIsMatchBannerDismissed] = useState<boolean>(false);

  // 다크모드 상태
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('travellog_theme');
    if (saved) return saved === 'dark';
    return false;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    localStorage.setItem('travellog_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const handleToggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  // 모달 상태
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [initialDistrictForTrip, setInitialDistrictForTrip] = useState<DistrictFeatureProperties | null>(null);

  const [selectedTripForDetail, setSelectedTripForDetail] = useState<Trip | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);

  const [selectedPhotoForLightbox, setSelectedPhotoForLightbox] = useState<PhotoItem | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);

  // 설정 및 백업 전용 모달 상태
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // 데이터 로드
  const loadData = useCallback(async () => {
    try {
      const loadedTrips = await getAllTrips();
      const loadedPhotos = await getAllPhotos();
      setTrips(loadedTrips);
      setPhotos(loadedPhotos);

      // 위치 & 날짜 기반 엄격 여행 자동 매칭 실행
      if (loadedTrips.length > 0) {
        const result = await matchActiveTrip(loadedTrips);
        if (result.matchedTrip) {
          setActiveMatchResult(result);
        }
      }
    } catch (err) {
      console.error('Failed to load data from IndexedDB:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 국가별 여행/사진 필터링
  const currentCountryTrips = useMemo(() => {
    return trips.filter(t => selectedCountry === 'JP' ? t.country === 'JP' : t.country !== 'JP');
  }, [trips, selectedCountry]);

  const currentCountryPhotos = useMemo(() => {
    const tripIds = new Set(currentCountryTrips.map(t => t.id));
    return photos.filter(p => tripIds.has(p.tripId));
  }, [photos, currentCountryTrips]);

  // 방문한 지역 요약 맵 (선택된 국가 기준)
  const visitedSummaryMap = useMemo(() => {
    const map = new Map<string, VisitedDistrictSummary>();

    currentCountryTrips.forEach(trip => {
      trip.districtCodes.forEach((code, idx) => {
        const fullName = trip.districtNames?.[idx] || code;
        const sdoName = fullName.split(' ')[0] || '';
        const name = fullName.split(' ').slice(1).join(' ') || fullName;

        const existing = map.get(code);
        if (existing) {
          existing.visitCount += 1;
          existing.tripIds.push(trip.id);
          if (trip.startDate > existing.latestVisitDate) {
            existing.latestVisitDate = trip.startDate;
            existing.latestTripTitle = trip.title;
            existing.color = trip.color || existing.color;
          }
        } else {
          map.set(code, {
            districtCode: code,
            fullName,
            sdoName,
            name,
            visitCount: 1,
            latestVisitDate: trip.startDate,
            latestTripTitle: trip.title,
            color: trip.color || (selectedCountry === 'JP' ? '#f43f5e' : '#3b82f6'),
            photoCount: 0,
            tripIds: [trip.id],
          });
        }
      });
    });

    currentCountryPhotos.forEach(p => {
      if (p.districtCode && map.has(p.districtCode)) {
        const item = map.get(p.districtCode)!;
        item.photoCount += 1;
      }
    });

    return map;
  }, [currentCountryTrips, currentCountryPhotos, selectedCountry]);

  const totalDistrictsCount = selectedCountry === 'JP' ? 47 : districtsData.features.length;

  const handleOpenNewTrip = (district?: DistrictFeatureProperties) => {
    setEditingTrip(null);
    setInitialDistrictForTrip(district || null);
    setIsEditorOpen(true);
  };

  const handleOpenEditTrip = (trip: Trip) => {
    setEditingTrip(trip);
    setInitialDistrictForTrip(null);
    setIsEditorOpen(true);
  };

  const handleSelectTrip = (trip: Trip) => {
    setSelectedTripForDetail(trip);
    setIsDetailOpen(true);
  };

  const handleOpenPhoto = (photo: PhotoItem) => {
    setSelectedPhotoForLightbox(photo);
    setIsLightboxOpen(true);
  };

  const handleSaveTrip = async (tripData: Trip, newPhotos: ParsedPhotoResult[]) => {
    await saveTrip(tripData);

    if (newPhotos.length > 0) {
      const photoItems: PhotoItem[] = newPhotos.map(p => {
        const districtCode = p.districtCode || tripData.districtCodes[0] || '';
        const districtName = p.districtName || tripData.districtNames[0] || '';

        return {
          id: p.id || `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          tripId: tripData.id,
          country: tripData.country || 'KR',
          districtCode,
          districtName,
          fileName: p.file.name,
          blob: p.blob,
          thumbnailUrl: p.thumbnailUrl,
          takenAt: p.takenAt,
          latitude: p.latitude,
          longitude: p.longitude,
          make: p.make,
          model: p.model,
          createdAt: new Date().toISOString(),
        };
      });

      await savePhotos(photoItems);
    }

    await loadData();
  };

  const handleUpdateTrip = async (updatedTrip: Trip) => {
    await saveTrip(updatedTrip);
    setTrips(prev => {
      const exists = prev.some(t => t.id === updatedTrip.id);
      if (exists) {
        return prev.map(t => t.id === updatedTrip.id ? updatedTrip : t);
      }
      return [updatedTrip, ...prev];
    });
    if (selectedTripForDetail && selectedTripForDetail.id === updatedTrip.id) {
      setSelectedTripForDetail(updatedTrip);
    }
  };

  const handleDeleteTrip = async (tripId: string) => {
    await deleteTrip(tripId);
    await loadData();
  };

  // 자동 매칭 배너 클릭 시 여행 포켓으로 이동
  const handleGoToMatchedTrip = () => {
    if (activeMatchResult?.matchedTrip) {
      if (activeMatchResult.matchedTrip.country) {
        setSelectedCountry(activeMatchResult.matchedTrip.country);
      }
      setCurrentTab('pocket');
    }
  };

  return (
    <div className="app-container">
      {/* 상단 네비게이션 헤더 & 모바일 탭바 */}
      <Navigation
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        selectedCountry={selectedCountry}
        onCountryChange={setSelectedCountry}
        onNewTrip={() => handleOpenNewTrip()}
        onOpenSettings={() => setIsSettingsOpen(true)}
        visitedCount={visitedSummaryMap.size}
        totalCount={totalDistrictsCount}
        isDarkMode={isDarkMode}
        onToggleTheme={handleToggleTheme}
      />

      {/* 🚀 실시간 위치 & 오늘 날짜 자동 매칭 스마트 라이브 배너 */}
      {activeMatchResult?.matchedTrip && !isMatchBannerDismissed && (
        <div
          style={{
            maxWidth: '1200px',
            margin: '12px auto 0',
            padding: '0 20px',
            width: '100%',
          }}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              color: '#ffffff',
              borderRadius: '20px',
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 10px 25px rgba(0,0,0,0.18)',
              border: '1px solid rgba(255,255,255,0.1)',
              animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: selectedCountry === 'JP' ? '#f43f5e' : '#3182f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                  flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(49, 130, 246, 0.4)',
                }}
              >
                📍
              </div>

              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#38bdf8', fontWeight: 800 }}>
                  <Sparkles size={13} />
                  <span>현재 위치 & 날짜 일치 여행 자동 연결됨</span>
                  {activeMatchResult.currentDistrict && (
                    <span style={{ background: 'rgba(56, 189, 248, 0.2)', padding: '2px 8px', borderRadius: '9999px' }}>
                      {activeMatchResult.currentDistrict.fullName}
                    </span>
                  )}
                </div>

                <div style={{ fontSize: '0.98rem', fontWeight: 800, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {activeMatchResult.matchedTrip.title}
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500, marginLeft: '8px' }}>
                    ({activeMatchResult.matchedTrip.startDate} ~ {activeMatchResult.matchedTrip.endDate})
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={handleGoToMatchedTrip}
                style={{
                  background: '#3182f6',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '8px 16px',
                  fontSize: '0.84rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 14px rgba(49, 130, 246, 0.4)',
                }}
              >
                <span>일정/QR 보기</span>
                <ArrowRight size={14} />
              </button>

              <button
                onClick={() => setIsMatchBannerDismissed(true)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '10px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#94a3b8',
                  cursor: 'pointer',
                }}
                title="배너 닫기"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="app-main">
        {isLoading ? (
          <div className="loading-state">
            <div className="loading-spinner" />
            <p>여행 기록을 불러오는 중입니다...</p>
          </div>
        ) : (
          <>
            {currentTab === 'home' && (
              <TossHomeView
                country={selectedCountry}
                trips={currentCountryTrips}
                photos={currentCountryPhotos}
                visitedSummaryMap={visitedSummaryMap}
                totalDistrictsCount={totalDistrictsCount}
                onSelectTrip={handleSelectTrip}
                onNewTrip={() => handleOpenNewTrip()}
                onSelectDistrict={handleOpenNewTrip}
                onOpenPhoto={handleOpenPhoto}
              />
            )}

            {currentTab === 'map' && (
              selectedCountry === 'JP' ? (
                <JapanMapViewer
                  trips={currentCountryTrips}
                  photos={currentCountryPhotos}
                  visitedSummaryMap={visitedSummaryMap}
                  onSelectTrip={handleSelectTrip}
                  onNewTripForDistrict={handleOpenNewTrip}
                />
              ) : (
                <MapViewer
                  trips={currentCountryTrips}
                  photos={currentCountryPhotos}
                  visitedSummaryMap={visitedSummaryMap}
                  onSelectTrip={handleSelectTrip}
                  onNewTripForDistrict={handleOpenNewTrip}
                />
              )
            )}

            {currentTab === 'timeline' && (
              <TripTimeline
                trips={currentCountryTrips}
                photos={currentCountryPhotos}
                onSelectTrip={handleSelectTrip}
                onNewTrip={() => handleOpenNewTrip()}
              />
            )}

            {currentTab === 'photos' && (
              <PhotoGallery
                photos={currentCountryPhotos}
                trips={currentCountryTrips}
                onPhotoClick={handleOpenPhoto}
              />
            )}

            {currentTab === 'pocket' && (
              <TravelPocketView
                trips={currentCountryTrips}
                defaultTripId={activeMatchResult?.matchedTrip?.id}
                onUpdateTrip={handleUpdateTrip}
                onOpenNewTripPlan={() => handleOpenNewTrip()}
              />
            )}

            {currentTab === 'stats' && (
              <StatsDashboard
                country={selectedCountry}
                trips={currentCountryTrips}
                photos={currentCountryPhotos}
                visitedSummaryMap={visitedSummaryMap}
              />
            )}
          </>
        )}
      </main>

      {/* 여행 작성/수정 모달 */}
      <TripEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSaveTrip}
        editingTrip={editingTrip}
        initialDistrict={initialDistrictForTrip}
        defaultCountry={selectedCountry}
      />

      {/* 여행 상세 모달 */}
      {selectedTripForDetail && (
        <TripDetailModal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          trip={selectedTripForDetail}
          photos={photos.filter(p => p.tripId === selectedTripForDetail.id)}
          onEdit={() => {
            setIsDetailOpen(false);
            handleOpenEditTrip(selectedTripForDetail);
          }}
          onDelete={() => {
            setIsDetailOpen(false);
            handleDeleteTrip(selectedTripForDetail.id);
          }}
          onPhotoClick={handleOpenPhoto}
        />
      )}

      {/* 고화질 사진 라이트박스 모달 */}
      {selectedPhotoForLightbox && (
        <PhotoLightbox
          isOpen={isLightboxOpen}
          onClose={() => setIsLightboxOpen(false)}
          photo={selectedPhotoForLightbox}
        />
      )}

      {/* 백업 및 설정 모달 */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onDataChanged={loadData}
      />
    </div>
  );
};
export default App;
