import React, { useState } from 'react';
import { X, Calendar, MapPin, Edit3, Trash2, Image as ImageIcon, Camera, Clock, Star } from 'lucide-react';
import { Trip, PhotoItem } from '../../types/travel';

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
  if (!isOpen || !trip) return null;

  const tripPhotos = photos.filter(p => p.tripId === trip.id);

  const handleDelete = () => {
    if (window.confirm(`'${trip.title}' 여행 기록과 첨부된 사진을 모두 삭제하시겠습니까?`)) {
      onDelete(trip.id);
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '720px' }}
      >
        {/* 모달 상단 컬러 바 */}
        <div style={{ height: '8px', background: trip.color || '#3b82f6' }} />

        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 className="modal-title">{trip.title}</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
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

        <div className="modal-body">
          {/* 날짜, 지역, 만족도 메타데이터 */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', padding: '12px 16px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.86rem' }}>
              <Calendar size={16} style={{ color: 'var(--primary)' }} />
              <span style={{ fontWeight: 600 }}>
                {trip.startDate} {trip.startDate !== trip.endDate ? `~ ${trip.endDate}` : ''}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.86rem' }}>
              <MapPin size={16} style={{ color: '#10b981' }} />
              <span style={{ fontWeight: 600 }}>{trip.districtNames?.join(', ') || '지역 미지정'}</span>
            </div>

            {trip.rating && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.86rem', color: '#f59e0b' }}>
                <Star size={16} fill="#f59e0b" />
                <span style={{ fontWeight: 700 }}>{trip.rating}.0 / 5.0</span>
              </div>
            )}
          </div>

          {/* 태그 목록 */}
          {trip.tags && trip.tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {trip.tags.map(tag => (
                <span
                  key={tag}
                  style={{
                    background: 'var(--primary-light)',
                    color: 'var(--primary)',
                    fontSize: '0.78rem',
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-full)',
                    fontWeight: 600,
                  }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* 메모 본문 */}
          {trip.memo && (
            <div style={{ background: 'var(--bg-surface)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
                여행 메모 & 기록
              </h4>
              <p style={{ fontSize: '0.94rem', color: 'var(--text-main)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                {trip.memo}
              </p>
            </div>
          )}

          {/* 사진 갤러리 */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <h4 style={{ fontSize: '0.92rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ImageIcon size={16} />
                <span>여행 사진 ({tripPhotos.length}장)</span>
              </h4>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                사진을 클릭하면 EXIF 상세 정보를 볼 수 있습니다.
              </span>
            </div>

            {tripPhotos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
                첨부된 사진이 없습니다. [수정하기]에서 사진을 추가해보세요.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
                {tripPhotos.map(photo => {
                  const displayUrl = photo.thumbnailUrl || (photo.blob ? URL.createObjectURL(photo.blob) : '');

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
                        transition: 'transform var(--transition-fast)',
                      }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <img
                        src={displayUrl}
                        alt={photo.fileName}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      {photo.takenAt && (
                        <div
                          style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            background: 'rgba(15, 23, 42, 0.75)',
                            color: 'white',
                            fontSize: '9px',
                            padding: '3px 6px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                          }}
                        >
                          <Clock size={10} />
                          <span>{photo.takenAt.split('T')[0]}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>
            확인
          </button>
        </div>
      </div>
    </div>
  );
};
