import React, { useState } from 'react';
import { X, Calendar, MapPin, Edit3, Trash2, Image as ImageIcon, Star, Compass, QrCode, Navigation2, Copy, Check } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Trip, PhotoItem, ItineraryItem } from '../../types/travel';

interface TripDetailModalProps {
  trip: Trip | null;
  photos: PhotoItem[];
  isOpen: boolean;
  onClose: () => void;
  onEdit: (trip: Trip) => void;
  onDelete: (tripId: string) => void;
  onPhotoClick: (photo: PhotoItem) => void;
}

export const TripDetailModal: React.FC<TripDetailModalProps> = ({
  trip,
  photos,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onPhotoClick,
}) => {
  const [selectedQRItem, setSelectedQRItem] = useState<ItineraryItem | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  if (!isOpen || !trip) return null;

  const tripPhotos = photos.filter(p => p.tripId === trip.id);
  const isJapan = trip.country === 'JP';
  const brandColor = isJapan ? '#f43f5e' : '#3182f6';

  const handleDelete = () => {
    if (window.confirm(`'${trip.title}' 여행 기록과 첨부된 사진을 모두 삭제하시겠습니까?`)) {
      onDelete(trip.id);
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 100 }}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '720px',
          maxHeight: '92vh',
          borderRadius: '30px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.25)',
        }}
      >
        {/* 모달 상단 컬러 바 */}
        <div style={{ height: '6px', background: trip.color || brandColor }} />

        <div className="modal-header" style={{ padding: '22px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
            <span style={{ fontSize: '1.4rem' }}>{isJapan ? '🗾' : '🗺️'}</span>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {trip.title}
            </h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <button
              className="btn-icon"
              onClick={() => {
                onEdit(trip);
                onClose();
              }}
              title="수정하기"
            >
              <Edit3 size={18} />
            </button>
            <button
              className="btn-icon"
              style={{ color: '#ef4444' }}
              onClick={handleDelete}
              title="삭제하기"
            >
              <Trash2 size={18} />
            </button>
            <button className="btn-icon" onClick={onClose} title="닫기">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="modal-body" style={{ padding: '26px 28px 32px', gap: '22px' }}>
          {/* 날짜, 지역, 만족도 메타데이터 카드 */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '16px',
              padding: '16px 20px',
              background: 'var(--bg-hover)',
              borderRadius: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.92rem' }}>
              <Calendar size={18} style={{ color: brandColor }} />
              <span style={{ fontWeight: 800, color: 'var(--text-main)' }}>
                {trip.startDate} {trip.startDate !== trip.endDate ? `~ ${trip.endDate}` : ''}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.92rem' }}>
              <MapPin size={18} style={{ color: '#10b981' }} />
              <span style={{ fontWeight: 800, color: 'var(--text-main)' }}>
                {trip.districtNames?.join(', ') || '지역 미지정'}
              </span>
            </div>

            {trip.rating && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.92rem', color: '#f59e0b' }}>
                <Star size={18} fill="#f59e0b" />
                <span style={{ fontWeight: 800 }}>{trip.rating}.0 / 5.0</span>
              </div>
            )}
          </div>

          {/* 태그 목록 */}
          {trip.tags && trip.tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {trip.tags.map(tag => (
                <span
                  key={tag}
                  className={`district-tag-badge ${isJapan ? 'jp-badge' : ''}`}
                  style={{ fontSize: '0.84rem', padding: '6px 14px' }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* 메모 본문 */}
          {trip.memo && (
            <div style={{ background: 'var(--bg-surface)', padding: '20px', borderRadius: '22px', border: '1px solid var(--border-light)', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
              <h4 style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '-0.01em' }}>
                여행 메모 & 기록
              </h4>
              <p style={{ fontSize: '0.98rem', color: 'var(--text-main)', lineHeight: 1.75, whiteSpace: 'pre-wrap', margin: 0 }}>
                {trip.memo}
              </p>
            </div>
          )}

          {/* 일정 & 동선 목록 (티켓 캡처 사진 썸네일 포함) */}
          {trip.itinerary && trip.itinerary.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h4 style={{ fontSize: '0.96rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)', margin: 0 }}>
                  <Compass size={18} style={{ color: brandColor }} />
                  <span>여행 일정 & 모바일 패스 ({trip.itinerary.length}곳)</span>
                </h4>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  티켓 썸네일을 누르면 캡처 사진/바코드가 바로 열립니다.
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {trip.itinerary.map((item, idx) => {
                  const passImg = item.ticketImageUrl || item.qrImageUrl;
                  const hasPass = Boolean(passImg || item.qrCodeData);
                  return (
                    <div
                      key={item.id || idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        padding: '12px 16px',
                        background: 'var(--bg-surface)',
                        borderRadius: '16px',
                        border: '1px solid var(--border-light)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                        <span
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: brandColor,
                            color: 'white',
                            fontSize: '0.75rem',
                            fontWeight: 900,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {item.day ? `D${item.day}` : idx + 1}
                        </span>

                        {item.time && (
                          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: brandColor, flexShrink: 0 }}>
                            {item.time}
                          </span>
                        )}

                        <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.placeName}
                        </span>

                        {item.memo && (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            • {item.memo}
                          </span>
                        )}
                      </div>

                      {/* 티켓/캡처 미니 썸네일 & 버튼 */}
                      {hasPass && (
                        <div
                          onClick={() => setSelectedQRItem(item)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '3px 6px',
                            background: '#ffffff',
                            borderRadius: '10px',
                            border: `1.5px solid ${isJapan ? 'rgba(244, 63, 94, 0.4)' : 'rgba(49, 130, 246, 0.4)'}`,
                            cursor: 'pointer',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                            flexShrink: 0,
                            transition: 'transform 0.15s ease',
                          }}
                          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
                          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                          title="클릭하여 대형 티켓/패스 열기"
                        >
                          <div style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: '4px' }}>
                            {passImg ? (
                              <img src={passImg} alt="Pass" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : item.qrCodeData ? (
                              <QRCodeSVG value={item.qrCodeData} size={26} level="L" bgColor="#ffffff" fgColor="#000000" />
                            ) : null}
                          </div>
                          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: brandColor, paddingRight: '4px' }}>
                            패스 ↗
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 사진 갤러리 */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h4 style={{ fontSize: '0.96rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)', margin: 0 }}>
                <ImageIcon size={18} style={{ color: brandColor }} />
                <span>여행 사진 ({tripPhotos.length}장)</span>
              </h4>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                사진을 클릭하면 원본과 EXIF 정보를 볼 수 있습니다.
              </span>
            </div>

            {tripPhotos.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '12px' }}>
                {tripPhotos.map(photo => (
                  <div
                    key={photo.id}
                    onClick={() => onPhotoClick(photo)}
                    style={{
                      aspectRatio: '1',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      boxShadow: 'var(--shadow-sm)',
                      transition: 'transform 0.15s ease',
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <img
                      src={photo.thumbnailUrl || (photo.blob ? URL.createObjectURL(photo.blob) : '')}
                      alt={photo.fileName}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem', background: 'var(--bg-hover)', borderRadius: '18px' }}>
                등록된 사진이 없습니다.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 대형 QR 팝업 모달 */}
      {selectedQRItem && (
        <div
          className="modal-backdrop"
          onClick={() => setSelectedQRItem(null)}
          style={{ background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)', zIndex: 120 }}
        >
          <div
            className="modal-content"
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: '420px',
              background: '#ffffff',
              borderRadius: '28px',
              overflow: 'hidden',
              boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
              animation: 'slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: brandColor, background: isJapan ? 'rgba(244, 63, 94, 0.1)' : 'rgba(49, 130, 246, 0.1)', padding: '4px 12px', borderRadius: '9999px' }}>
                📱 현장 스캔 퀵패스
              </span>
              <button className="btn-icon" onClick={() => setSelectedQRItem(null)} style={{ width: '36px', height: '36px' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                  {selectedQRItem.placeName}
                </h3>
                <div style={{ fontSize: '0.84rem', color: '#64748b', fontWeight: 700, marginTop: '4px' }}>
                  {selectedQRItem.time ? `• ${selectedQRItem.time}` : ''}
                </div>
              </div>

              <div style={{ width: '100%', minHeight: '200px', background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: '20px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {(selectedQRItem.ticketImageUrl || selectedQRItem.qrImageUrl) ? (
                  <img
                    src={selectedQRItem.ticketImageUrl || selectedQRItem.qrImageUrl}
                    alt="Ticket Pass"
                    style={{ maxWidth: '100%', maxHeight: '280px', objectFit: 'contain', borderRadius: '12px', boxShadow: '0 4px 14px rgba(0,0,0,0.08)' }}
                  />
                ) : selectedQRItem.qrCodeData ? (
                  <div style={{ padding: '12px', background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                    <QRCodeSVG value={selectedQRItem.qrCodeData} size={200} level="Q" bgColor="#ffffff" fgColor="#000000" />
                  </div>
                ) : (
                  <p style={{ fontSize: '0.86rem', color: '#94a3b8' }}>등록된 티켓 정보가 없습니다.</p>
                )}
              </div>

              {selectedQRItem.qrCodeData && (
                <div style={{ width: '100%', background: '#f1f5f9', padding: '10px 14px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                  <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#334155', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    {selectedQRItem.qrCodeData}
                  </span>
                  <button
                    type="button"
                    className="btn btn-subtle"
                    style={{ padding: '4px 8px', fontSize: '0.76rem' }}
                    onClick={() => {
                      navigator.clipboard.writeText(selectedQRItem.qrCodeData || '');
                      setIsCopied(true);
                      setTimeout(() => setIsCopied(false), 2000);
                    }}
                  >
                    {isCopied ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                    <span>{isCopied ? '복사됨' : '복사'}</span>
                  </button>
                </div>
              )}
            </div>

            <div style={{ padding: '14px 24px', background: '#f8fafc', borderTop: '1px solid #f1f5f9' }}>
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%', minHeight: '44px', fontWeight: 800, background: brandColor }}
                onClick={() => setSelectedQRItem(null)}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
