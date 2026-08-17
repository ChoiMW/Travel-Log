import React from 'react';
import { X, Calendar, MapPin, Camera, Compass, Download, Tag } from 'lucide-react';
import { PhotoItem, Trip } from '../../types/travel';

interface PhotoLightboxProps {
  photo: PhotoItem | null;
  trip?: Trip | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PhotoLightbox: React.FC<PhotoLightboxProps> = ({
  photo,
  trip,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !photo) return null;

  const displayUrl = photo.dataUrl || (photo.blob ? URL.createObjectURL(photo.blob) : photo.thumbnailUrl || '');

  const handleDownload = () => {
    if (photo.blob) {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(photo.blob);
      a.download = photo.fileName || 'photo.jpg';
      a.click();
    } else if (photo.dataUrl) {
      const a = document.createElement('a');
      a.href = photo.dataUrl;
      a.download = photo.fileName || 'photo.jpg';
      a.click();
    }
  };

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      style={{
        background: 'rgba(5, 8, 15, 0.92)',
        zIndex: 110,
        padding: '12px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          display: 'flex',
          flexDirection: 'column',
          maxWidth: '1000px',
          width: '100%',
          maxHeight: '94vh',
          background: '#0f172a',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* 상단 툴바 */}
        <div
          style={{
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            color: 'white',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Camera size={18} style={{ color: '#38bdf8' }} />
            <span style={{ fontSize: '0.92rem', fontWeight: 600 }}>{photo.fileName}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              className="btn-icon"
              style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}
              onClick={handleDownload}
              title="사진 다운로드"
            >
              <Download size={18} />
            </button>
            <button
              className="btn-icon"
              style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}
              onClick={onClose}
              title="닫기"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* 본문: 사진 + EXIF 메타데이터 패널 */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            flex: 1,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#020617',
              padding: '16px',
              minHeight: '320px',
              maxHeight: '60vh',
            }}
          >
            <img
              src={displayUrl}
              alt={photo.fileName}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                borderRadius: 'var(--radius-sm)',
              }}
            />
          </div>

          {/* EXIF 상세 정보 바 */}
          <div
            style={{
              padding: '16px 20px',
              background: '#0f172a',
              color: 'white',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
            }}
          >
            {/* 촬영 일시 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ padding: '8px', borderRadius: 'var(--radius-sm)', background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa' }}>
                <Calendar size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>촬영 일시 (EXIF)</div>
                <div style={{ fontSize: '0.86rem', fontWeight: 600 }}>
                  {photo.takenAt ? new Date(photo.takenAt).toLocaleString('ko-KR') : '정보 없음'}
                </div>
              </div>
            </div>

            {/* 촬영 지역 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ padding: '8px', borderRadius: 'var(--radius-sm)', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>
                <MapPin size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>방문 지역 (시군구)</div>
                <div style={{ fontSize: '0.86rem', fontWeight: 600 }}>
                  {photo.districtName || '위치 미지정'}
                </div>
              </div>
            </div>

            {/* GPS 좌표 */}
            {photo.latitude && photo.longitude && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ padding: '8px', borderRadius: 'var(--radius-sm)', background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24' }}>
                  <Compass size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>GPS 좌표</div>
                  <div style={{ fontSize: '0.82rem', fontFamily: 'monospace' }}>
                    {photo.latitude.toFixed(4)}°N, {photo.longitude.toFixed(4)}°E
                  </div>
                </div>
              </div>
            )}

            {/* 카메라/스마트폰 모델 */}
            {(photo.make || photo.model) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ padding: '8px', borderRadius: 'var(--radius-sm)', background: 'rgba(139, 92, 246, 0.2)', color: '#a78bfa' }}>
                  <Camera size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>촬영 기기</div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 500 }}>
                    {[photo.make, photo.model].filter(Boolean).join(' ')}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
