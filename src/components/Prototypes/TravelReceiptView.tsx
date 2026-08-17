import React, { useState, useRef } from 'react';
import { Download, Sparkles, Share2, MapPin, Calendar, Heart, Camera, Check } from 'lucide-react';
import { Trip, PhotoItem } from '../../types/travel';

interface TravelReceiptViewProps {
  trips: Trip[];
  photos: PhotoItem[];
}

export const TravelReceiptView: React.FC<TravelReceiptViewProps> = ({
  trips,
  photos,
}) => {
  const [selectedTripId, setSelectedTripId] = useState<string>(trips[0]?.id || '');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const receiptRef = useRef<HTMLDivElement | null>(null);

  const activeTrip = trips.find(t => t.id === selectedTripId) || trips[0];
  const tripPhotos = photos.filter(p => p.tripId === activeTrip?.id);
  const primaryPhoto = tripPhotos[0];
  const primaryPhotoUrl = primaryPhoto?.thumbnailUrl || (primaryPhoto?.blob ? URL.createObjectURL(primaryPhoto.blob) : 'https://images.unsplash.com/photo-1578637387939-43c525550085?w=600&auto=format&fit=crop&q=60');

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '720px', margin: '0 auto', paddingBottom: '80px' }}>
      {/* 상단 배너 */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: 'white',
          borderRadius: '26px',
          padding: '24px 28px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', fontWeight: 800, color: '#38bdf8' }}>
            <Sparkles size={16} />
            <span>PROTOTYPE 3 • TRAVEL RECEIPT GENERATOR</span>
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginTop: '4px' }}>
            인스타/카톡 자랑용 감성 여행 영수증 티켓
          </h2>
          <p style={{ fontSize: '0.84rem', color: '#94a3b8', marginTop: '2px' }}>
            여행 기록을 실물 종이 영수증 및 여권 스탬프 스타일로 즉시 발행하여 소장하세요.
          </p>
        </div>

        {trips.length > 0 && (
          <select
            value={selectedTripId}
            onChange={e => setSelectedTripId(e.target.value)}
            style={{
              padding: '10px 16px',
              borderRadius: '14px',
              background: 'rgba(255,255,255,0.15)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.2)',
              fontWeight: 700,
              fontSize: '0.88rem',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            {trips.map(t => (
              <option key={t.id} value={t.id} style={{ background: '#1e293b', color: 'white' }}>
                {t.title}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* 영수증 카드 실물 렌더링 컨테이너 */}
      <div
        ref={receiptRef}
        style={{
          maxWidth: '420px',
          margin: '0 auto',
          background: '#ffffff',
          color: '#191f28',
          borderRadius: '4px',
          boxShadow: '0 16px 40px rgba(0,0,0,0.18)',
          fontFamily: "'Pretendard', monospace, sans-serif",
          position: 'relative',
          overflow: 'hidden',
          borderTop: '6px solid #3182f6',
        }}
      >
        {/* 상단 톱니바퀴 펀칭 룩앤필 */}
        <div style={{ padding: '28px 24px 18px', textAlign: 'center', borderBottom: '1px dashed #cbd5e1' }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '-0.03em' }}>
            TRAVEL RECEIPT
          </div>
          <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700, letterSpacing: '0.1em', marginTop: '2px' }}>
            대한민국 여행 기록 증명서 • NO. {activeTrip?.id.slice(-6).toUpperCase() || 'TRV2026'}
          </div>
        </div>

        {/* 메인 사진 영역 */}
        <div style={{ padding: '16px 24px', background: '#fafafa', borderBottom: '1px dashed #cbd5e1' }}>
          <div style={{ width: '100%', height: '180px', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
            <img
              src={primaryPhotoUrl}
              alt="receipt photo"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'rgba(0,0,0,0.7)',
                color: 'white',
                padding: '3px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
              }}
            >
              📷 {tripPhotos.length || 1} PHOTOS
            </div>
          </div>
        </div>

        {/* 세부 내역 테이블 */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
            <span style={{ color: '#64748b', fontWeight: 600 }}>여행 제목</span>
            <span style={{ fontWeight: 800 }}>{activeTrip?.title || '부산 다대포 힐링 여행'}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
            <span style={{ color: '#64748b', fontWeight: 600 }}>방문 지역</span>
            <span style={{ fontWeight: 800, color: '#3182f6' }}>
              📍 {activeTrip?.districtNames?.join(', ') || '부산광역시 사하구'}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
            <span style={{ color: '#64748b', fontWeight: 600 }}>여행 일자</span>
            <span style={{ fontWeight: 700 }}>{activeTrip?.startDate || '2026-08-16'}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
            <span style={{ color: '#64748b', fontWeight: 600 }}>여행 만족도</span>
            <span style={{ fontWeight: 800, color: '#f59e0b' }}>
              {'★'.repeat(activeTrip?.rating || 5)} ({(activeTrip?.rating || 5)}.0)
            </span>
          </div>

          {activeTrip?.memo && (
            <div style={{ marginTop: '6px', padding: '12px', background: '#f1f5f9', borderRadius: '8px', fontSize: '0.82rem', color: '#334155', lineHeight: 1.4 }}>
              "{activeTrip.memo}"
            </div>
          )}

          {/* 구분선 */}
          <div style={{ borderTop: '2px dashed #94a3b8', margin: '8px 0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: '1rem', fontWeight: 900 }}>TOTAL HAPPINESS</span>
            <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#3182f6' }}>
              100% UNLIMITED
            </span>
          </div>
        </div>

        {/* 바코드 & 인스타 공유 하단부 */}
        <div style={{ padding: '18px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
          {/* 가상 바코드 */}
          <div
            style={{
              height: '34px',
              background: 'repeating-linear-gradient(90deg, #191f28 0px, #191f28 2px, transparent 2px, transparent 4px, #191f28 4px, #191f28 7px, transparent 7px, transparent 9px)',
              margin: '0 auto 8px',
              maxWidth: '220px',
            }}
          />
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', letterSpacing: '0.15em', fontWeight: 700 }}>
            TRAVEL-LOG-KOREA-AUTHENTICATED
          </div>
        </div>
      </div>

      {/* 액션 버튼 */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '10px' }}>
        <button className="btn btn-primary" style={{ padding: '12px 24px' }} onClick={handleCopyLink}>
          {isCopied ? <Check size={18} /> : <Share2 size={18} />}
          <span>{isCopied ? '링크 복사됨!' : '인스타/카톡 공유하기'}</span>
        </button>
      </div>
    </div>
  );
};
