import React, { useState, useEffect, useRef } from 'react';
import {
  X, MapPin, Clock, Navigation2, DollarSign, Plus, Check,
  Upload, Image as ImageIcon, Trash2, QrCode, FileText, Sparkles, RefreshCw
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { ItineraryItem, CountryCode } from '../../types/travel';

interface PlaceEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: ItineraryItem) => void;
  editingItem?: ItineraryItem | null;
  day: number;
  country?: CountryCode;
}

const CATEGORIES = [
  { id: 'spot', label: '관광/명소', icon: '⛩️' },
  { id: 'food', label: '맛집/식당', icon: '🍜' },
  { id: 'cafe', label: '감성 카페', icon: '☕' },
  { id: 'shopping', label: '쇼핑/마트', icon: '🛍️' },
  { id: 'hotel', label: '숙소/호텔', icon: '🏨' },
  { id: 'transit', label: '공항/교통', icon: '🚆' },
  { id: 'etc', label: '기타/자유', icon: '📍' },
] as const;

const TRANSIT_TYPES = [
  { id: 'walk', label: '도보', icon: '🚶' },
  { id: 'subway', label: '지하철/철도', icon: '🚇' },
  { id: 'bus', label: '버스', icon: '🚌' },
  { id: 'taxi', label: '택시', icon: '🚕' },
  { id: 'car', label: '렌터카/차량', icon: '🚗' },
] as const;

export const PlaceEditorModal: React.FC<PlaceEditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingItem,
  day,
  country = 'KR',
}) => {
  const [placeName, setPlaceName] = useState('');
  const [category, setCategory] = useState<ItineraryItem['category']>('spot');
  const [time, setTime] = useState('');
  const [memo, setMemo] = useState('');
  const [cost, setCost] = useState<string>('');
  
  // 🎟️ 모바일 티켓 / 캡처 사진 / 바코드 / QR 상태
  const [hasPassImage, setHasPassImage] = useState(false);
  const [ticketImageUrl, setTicketImageUrl] = useState('');
  const [ticketImageName, setTicketImageName] = useState('');
  const [qrCodeData, setQrCodeData] = useState('');
  const [showQrTextInput, setShowQrTextInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 다음 장소까지 이동 정보
  const [hasTransit, setHasTransit] = useState(false);
  const [transitType, setTransitType] = useState<'walk' | 'subway' | 'bus' | 'taxi' | 'car'>('subway');
  const [transitDuration, setTransitDuration] = useState<string>('15');
  const [transitFare, setTransitFare] = useState<string>('');

  const isJapan = country === 'JP';
  const currencySymbol = isJapan ? '¥' : '원';
  const brandColor = isJapan ? '#f43f5e' : '#3182f6';

  useEffect(() => {
    if (editingItem) {
      setPlaceName(editingItem.placeName);
      setCategory(editingItem.category || 'spot');
      setTime(editingItem.time || '');
      setMemo(editingItem.memo || '');
      setCost(editingItem.cost ? String(editingItem.cost) : '');
      
      // 티켓 캡처 사진 및 QR 데이터 복원
      const imgUrl = editingItem.ticketImageUrl || editingItem.qrImageUrl || '';
      const qrData = editingItem.qrCodeData || '';
      
      if (imgUrl || qrData) {
        setHasPassImage(true);
        setTicketImageUrl(imgUrl);
        setTicketImageName(editingItem.ticketImageName || '첨부된 티켓/캡처 사진');
        setQrCodeData(qrData);
        setShowQrTextInput(Boolean(qrData && !imgUrl));
      } else {
        setHasPassImage(false);
        setTicketImageUrl('');
        setTicketImageName('');
        setQrCodeData('');
        setShowQrTextInput(false);
      }

      // 이동 정보 복원
      if (editingItem.transitType) {
        setHasTransit(true);
        setTransitType(editingItem.transitType);
        setTransitDuration(editingItem.transitDuration ? String(editingItem.transitDuration) : '15');
        setTransitFare(editingItem.transitFare ? String(editingItem.transitFare) : '');
      } else {
        setHasTransit(false);
        setTransitDuration('15');
        setTransitFare('');
      }
    } else {
      setPlaceName('');
      setCategory('spot');
      setTime('');
      setMemo('');
      setCost('');
      setHasPassImage(false);
      setTicketImageUrl('');
      setTicketImageName('');
      setQrCodeData('');
      setShowQrTextInput(false);
      setHasTransit(false);
      setTransitType(isJapan ? 'subway' : 'walk');
      setTransitDuration('15');
      setTransitFare('');
    }
  }, [editingItem, isOpen, isJapan]);

  const handleImageUpload = (file: File) => {
    if (!file) return;
    setTicketImageName(file.name);
    setHasPassImage(true);

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setTicketImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!placeName.trim()) {
      alert('장소명을 입력해주세요.');
      return;
    }

    const mapUrl = isJapan
      ? `https://www.google.com/maps/search/${encodeURIComponent(placeName.trim())}`
      : `https://map.naver.com/v5/search/${encodeURIComponent(placeName.trim())}`;

    const newItem: ItineraryItem = {
      id: editingItem?.id || `itin_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      day,
      time: time.trim(),
      placeName: placeName.trim(),
      category,
      memo: memo.trim(),
      mapUrl,
      isCompleted: editingItem?.isCompleted || false,
      cost: cost ? parseInt(cost, 10) : undefined,
      ticketImageUrl: hasPassImage && ticketImageUrl ? ticketImageUrl : undefined,
      ticketImageName: hasPassImage && ticketImageName ? ticketImageName : undefined,
      qrImageUrl: hasPassImage && ticketImageUrl ? ticketImageUrl : undefined, // 호환용
      qrCodeData: hasPassImage && qrCodeData.trim() ? qrCodeData.trim() : undefined,
      transitType: hasTransit ? transitType : undefined,
      transitDuration: hasTransit && transitDuration ? parseInt(transitDuration, 10) : undefined,
      transitFare: hasTransit && transitFare ? parseInt(transitFare, 10) : undefined,
    };

    onSave(newItem);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 110 }}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '600px',
          maxHeight: '92vh',
          borderRadius: '28px',
          boxShadow: '0 25px 70px rgba(0,0,0,0.3)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div className="modal-header" style={{ padding: '22px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                background: isJapan ? 'rgba(244, 63, 94, 0.12)' : 'rgba(49, 130, 246, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
              }}
            >
              📍
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                {editingItem ? '일정 장소 수정' : `Day ${day} 방문 장소 추가`}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                루트에 장소를 등록하고 모바일 티켓/바코드 캡처 사진을 연결하세요
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose} title="닫기">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
          <div className="modal-body" style={{ padding: '24px 28px', gap: '20px', overflowY: 'auto' }}>
            {/* 1. 카테고리 칩 선택 */}
            <div className="form-group">
              <label className="form-label">장소 분류</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '14px',
                      border: category === cat.id ? `2px solid ${brandColor}` : '1px solid var(--border-light)',
                      background: category === cat.id ? (isJapan ? 'rgba(244, 63, 94, 0.1)' : 'rgba(49, 130, 246, 0.1)') : 'var(--bg-hover)',
                      color: category === cat.id ? brandColor : 'var(--text-main)',
                      fontWeight: 800,
                      fontSize: '0.86rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. 장소명 & 방문 시간 */}
            <div className="form-row" style={{ gap: '14px' }}>
              <div className="form-group" style={{ flex: 1.5 }}>
                <label className="form-label">
                  <span>장소 / 목적지 명칭</span>
                  <span style={{ color: brandColor }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={isJapan ? '예: 후쿠오카 공항, 하카타 잇푸도 라멘' : '예: 광안리 해수욕장, 해운대 암소갈비'}
                  value={placeName}
                  onChange={e => setPlaceName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">방문 시간 (선택)</label>
                <input
                  type="time"
                  className="form-input"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                />
              </div>
            </div>

            {/* 3. 메모 및 예상 비용 */}
            <div className="form-row" style={{ gap: '14px' }}>
              <div className="form-group" style={{ flex: 1.5 }}>
                <label className="form-label">메모 (추천 메뉴, 팁 등)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="예: 모바일 탑승권 준비, 라멘 교자 세트"
                  value={memo}
                  onChange={e => setMemo(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">예상 지출 ({currencySymbol})</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder={isJapan ? '예: 1350' : '예: 25000'}
                  value={cost}
                  onChange={e => setCost(e.target.value)}
                />
              </div>
            </div>

            {/* 4. 🎟️ 모바일 티켓 / 바코드 / 화면 캡처 사진 첨부 (범용 이미지 업로더) */}
            <div
              style={{
                background: hasPassImage ? (isJapan ? 'rgba(244, 63, 94, 0.04)' : 'rgba(49, 130, 246, 0.04)') : 'var(--bg-hover)',
                borderRadius: '20px',
                padding: '18px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                border: hasPassImage ? `1.5px solid ${brandColor}` : '1px solid var(--border-light)',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ImageIcon size={18} style={{ color: brandColor }} />
                  <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    모바일 티켓 / 바코드 / 화면 캡처 사진 첨부
                  </span>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.84rem', fontWeight: 800, color: hasPassImage ? brandColor : 'var(--text-secondary)' }}>
                  <input
                    type="checkbox"
                    checked={hasPassImage}
                    onChange={e => setHasPassImage(e.target.checked)}
                    style={{ width: '17px', height: '17px', accentColor: brandColor }}
                  />
                  <span>티켓 패스 사용</span>
                </label>
              </div>

              {hasPassImage && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', animation: 'slideUp 0.15s ease' }}>
                  {/* 이미지 드롭존 / 업로드 영역 */}
                  {!ticketImageUrl && !qrCodeData ? (
                    <div
                      onDragOver={e => e.preventDefault()}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        border: '2px dashed var(--border-light)',
                        borderRadius: '16px',
                        padding: '24px 20px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        background: 'var(--bg-surface)',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = brandColor}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-light)'}
                    >
                      <Upload size={28} style={{ color: brandColor, opacity: 0.8 }} />
                      <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)' }}>
                        클릭하거나 화면 캡처 사진을 여기에 끌어다 놓으세요
                      </div>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                        모바일 탑승권, 입장 바코드, 예약 확인서, 쿠폰 캡처 사진 (PNG, JPG)
                      </p>
                    </div>
                  ) : (
                    /* 이미지가 첨부된 상태의 카드 */
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        padding: '14px 18px',
                        background: 'var(--bg-surface)',
                        borderRadius: '16px',
                        border: '1px solid var(--border-subtle)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                      }}
                    >
                      {/* 이미지 썸네일 */}
                      <div
                        style={{
                          width: '74px',
                          height: '74px',
                          borderRadius: '12px',
                          overflow: 'hidden',
                          background: '#ffffff',
                          border: '1px solid #e2e8f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {ticketImageUrl ? (
                          <img
                            src={ticketImageUrl}
                            alt="Ticket Preview"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : qrCodeData ? (
                          <QRCodeSVG value={qrCodeData} size={64} level="M" bgColor="#ffffff" fgColor="#000000" />
                        ) : null}
                      </div>

                      {/* 이미지 정보 및 버튼 */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '0.84rem', fontWeight: 800, color: brandColor }}>
                            ✓ 티켓 사진 등록 완료
                          </span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {ticketImageName || qrCodeData || '모바일 티켓 이미지'}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                          <button
                            type="button"
                            className="btn btn-subtle"
                            style={{ padding: '4px 10px', fontSize: '0.76rem', minHeight: '28px' }}
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <RefreshCw size={12} />
                            <span>사진 변경</span>
                          </button>
                          <button
                            type="button"
                            className="btn btn-subtle"
                            style={{ padding: '4px 10px', fontSize: '0.76rem', color: '#ef4444', minHeight: '28px' }}
                            onClick={() => {
                              setTicketImageUrl('');
                              setTicketImageName('');
                              setQrCodeData('');
                            }}
                          >
                            <Trash2 size={12} />
                            <span>삭제</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />

                  {/* 보조 옵션: 텍스트 QR / 예약번호로 생성하기 */}
                  <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setShowQrTextInput(!showQrTextInput)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: 0,
                      }}
                    >
                      <QrCode size={13} />
                      <span>{showQrTextInput ? '▲ QR 텍스트 입력 접기' : '▼ 또는 QR 텍스트 / 예약번호로 직접 생성하기'}</span>
                    </button>

                    {showQrTextInput && (
                      <div style={{ marginTop: '8px', animation: 'slideUp 0.15s ease' }}>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="예: KE-787-FUK, https://booking.com/voucher/12345"
                          value={qrCodeData}
                          onChange={e => setQrCodeData(e.target.value)}
                          style={{ padding: '8px 12px', fontSize: '0.86rem' }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 5. 다음 장소까지 이동 정보 */}
            <div
              style={{
                background: 'var(--bg-hover)',
                borderRadius: '20px',
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                border: '1px solid var(--border-light)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Navigation2 size={16} style={{ color: brandColor }} />
                  <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    다음 장소까지 이동 정보 연결
                  </span>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  <input
                    type="checkbox"
                    checked={hasTransit}
                    onChange={e => setHasTransit(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: brandColor }}
                  />
                  <span>이동 경로 표시</span>
                </label>
              </div>

              {hasTransit && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px', animation: 'slideUp 0.15s ease' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {TRANSIT_TYPES.map(tr => (
                      <button
                        key={tr.id}
                        type="button"
                        onClick={() => setTransitType(tr.id)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '10px',
                          border: transitType === tr.id ? `2px solid ${brandColor}` : '1px solid var(--border-subtle)',
                          background: transitType === tr.id ? 'var(--bg-surface)' : 'transparent',
                          color: transitType === tr.id ? brandColor : 'var(--text-main)',
                          fontWeight: 800,
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <span>{tr.icon}</span>
                        <span>{tr.label}</span>
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                        예상 소요 시간 (분)
                      </label>
                      <input
                        type="number"
                        className="form-input"
                        placeholder="예: 15"
                        value={transitDuration}
                        onChange={e => setTransitDuration(e.target.value)}
                        style={{ padding: '8px 12px', minHeight: '40px' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                        예상 교통 요금 ({currencySymbol})
                      </label>
                      <input
                        type="number"
                        className="form-input"
                        placeholder={isJapan ? '예: 260' : '예: 1400'}
                        value={transitFare}
                        onChange={e => setTransitFare(e.target.value)}
                        style={{ padding: '8px 12px', minHeight: '40px' }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer" style={{ padding: '16px 28px' }}>
            <button type="button" className="btn btn-subtle" onClick={onClose} style={{ minHeight: '44px' }}>
              취소
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{
                minHeight: '44px',
                padding: '0 24px',
                fontWeight: 800,
                background: brandColor,
                boxShadow: `0 4px 14px ${isJapan ? 'rgba(244,63,94,0.3)' : 'rgba(49, 130, 246, 0.3)'}`,
              }}
            >
              <Check size={16} strokeWidth={2.8} />
              <span>{editingItem ? '수정 완료' : '루트에 추가'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
