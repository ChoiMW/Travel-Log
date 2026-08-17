import React, { useState } from 'react';
import {
  Calendar, Plus, MapPin, Navigation2, Clock, Trash2, Edit3,
  CheckCircle2, Circle, ChevronUp, ChevronDown, Sparkles, DollarSign,
  Footprints, Compass, Layers, QrCode, X, Copy, Check, Image as ImageIcon,
  Ticket, ExternalLink, Maximize2
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Trip, ItineraryItem } from '../../types/travel';
import { PlaceEditorModal } from './PlaceEditorModal';
import { FUKUOKA_3N4D_ITINERARY } from '../../data/fukuoka3N4DRoute';

interface RoutePlannerSectionProps {
  trip: Trip;
  onUpdateTrip: (updatedTrip: Trip) => void;
  onOpenTransitCalc?: () => void;
}

const CATEGORY_MAP: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  spot: { label: '관광/명소', icon: '⛩️', color: '#2563eb', bg: '#eff6ff' },
  food: { label: '맛집/식당', icon: '🍜', color: '#ea580c', bg: '#fff7ed' },
  cafe: { label: '감성 카페', icon: '☕', color: '#7c3aed', bg: '#f5f3ff' },
  shopping: { label: '쇼핑/마트', icon: '🛍️', color: '#db2777', bg: '#fdf2f8' },
  hotel: { label: '숙소/호텔', icon: '🏨', color: '#059669', bg: '#ecfdf5' },
  transit: { label: '공항/교통', icon: '🚆', color: '#0891b2', bg: '#ecfeff' },
  etc: { label: '기타/자유', icon: '📍', color: '#4b5563', bg: '#f3f4f6' },
};

const TRANSIT_ICON_MAP: Record<string, string> = {
  walk: '🚶 도보',
  subway: '🚇 지하철',
  bus: '🚌 버스',
  taxi: '🚕 택시',
  car: '🚗 렌터카',
};

export const RoutePlannerSection: React.FC<RoutePlannerSectionProps> = ({
  trip,
  onUpdateTrip,
  onOpenTransitCalc,
}) => {
  const isJapan = trip.country === 'JP';
  const brandColor = isJapan ? '#f43f5e' : '#3182f6';
  const currencySymbol = isJapan ? '¥' : '원';

  const itinerary = trip.itinerary || [];
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<ItineraryItem | null>(null);

  // 현장 티켓/패스 대형 모달 상태
  const [selectedPlaceForPass, setSelectedPlaceForPass] = useState<ItineraryItem | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // 여행 기간(시작일~종료일) 계산으로 기본 일수 도출
  const calculateDays = () => {
    try {
      const s = new Date(trip.startDate);
      const e = new Date(trip.endDate);
      const diff = Math.max(1, Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1);
      const existingMaxDay = itinerary.reduce((max, i) => Math.max(max, i.day), 1);
      return Math.max(diff, existingMaxDay, 1);
    } catch {
      return Math.max(1, itinerary.reduce((max, i) => Math.max(max, i.day), 1));
    }
  };

  const totalDays = calculateDays();
  const dayList = Array.from({ length: totalDays }, (_, i) => i + 1);

  // 현재 일차의 날짜 텍스트 계산
  const getDayDateLabel = (dayNum: number) => {
    try {
      const d = new Date(trip.startDate);
      d.setDate(d.getDate() + (dayNum - 1));
      const month = d.getMonth() + 1;
      const date = d.getDate();
      const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
      return `${month}.${date} (${dayOfWeek})`;
    } catch {
      return '';
    }
  };

  // 현재 선택된 Day의 아이템들
  const currentDayItems = itinerary.filter(i => i.day === selectedDay);

  // 장소 추가/수정 저장
  const handleSavePlace = (savedItem: ItineraryItem) => {
    let updatedList: ItineraryItem[];
    if (editingItem) {
      updatedList = itinerary.map(i => i.id === savedItem.id ? savedItem : i);
    } else {
      updatedList = [...itinerary, savedItem];
    }
    onUpdateTrip({ ...trip, itinerary: updatedList });
    setEditingItem(null);
  };

  // 장소 삭제
  const handleDeletePlace = (id: string) => {
    onUpdateTrip({
      ...trip,
      itinerary: itinerary.filter(i => i.id !== id),
    });
  };

  // 완료 체크 토글
  const handleToggleComplete = (id: string) => {
    onUpdateTrip({
      ...trip,
      itinerary: itinerary.map(i => i.id === id ? { ...i, isCompleted: !i.isCompleted } : i),
    });
  };

  // 순서 변경 (위로 / 아래로)
  const handleMoveOrder = (index: number, direction: 'up' | 'down') => {
    const targetItems = [...currentDayItems];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= targetItems.length) return;

    const temp = targetItems[index];
    targetItems[index] = targetItems[targetIdx];
    targetItems[targetIdx] = temp;

    // 전체 리스트에 반영
    const otherItems = itinerary.filter(i => i.day !== selectedDay);
    onUpdateTrip({ ...trip, itinerary: [...otherItems, ...targetItems] });
  };

  // 3박 4일 전체 후쿠오카 코스 일괄 적용
  const handleApplyAll3N4DFukuoka = () => {
    if (itinerary.length > 0 && !window.confirm('기존 일정을 후쿠오카 3박 4일 완벽 코스로 덮어씌우시겠습니까?')) {
      return;
    }
    onUpdateTrip({
      ...trip,
      startDate: trip.startDate || '2026-08-17',
      endDate: trip.endDate || '2026-08-20',
      districtCodes: Array.from(new Set([...(trip.districtCodes || []), 'JP-40', 'JP-44'])),
      districtNames: Array.from(new Set([...(trip.districtNames || []), '후쿠오카현 (福岡県)', '오이타현 (大分県)'])),
      itinerary: FUKUOKA_3N4D_ITINERARY,
    });
  };

  // 현재 일차 코스만 로드
  const handleApplyDayFukuoka = (dayNum: number) => {
    const dayPresets = FUKUOKA_3N4D_ITINERARY.filter(i => i.day === dayNum);
    const otherItems = itinerary.filter(i => i.day !== dayNum);
    onUpdateTrip({
      ...trip,
      itinerary: [...otherItems, ...dayPresets],
    });
  };

  const handleCopyPassData = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Day 통계
  const totalCost = currentDayItems.reduce((sum, item) => sum + (item.cost || 0), 0);
  const totalTransitMin = currentDayItems.reduce((sum, item) => sum + (item.transitDuration || 0), 0);
  const completedCount = currentDayItems.filter(i => i.isCompleted).length;
  const passPlaceCount = currentDayItems.filter(i => Boolean(i.ticketImageUrl || i.qrImageUrl || i.qrCodeData)).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* 1. 일차(Day) 탭 바 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {dayList.map(dayNum => {
            const count = itinerary.filter(i => i.day === dayNum).length;
            const dateLabel = getDayDateLabel(dayNum);
            const isSelected = selectedDay === dayNum;

            return (
              <button
                key={dayNum}
                onClick={() => setSelectedDay(dayNum)}
                style={{
                  padding: '10px 18px',
                  borderRadius: '16px',
                  border: 'none',
                  background: isSelected ? brandColor : 'var(--bg-hover)',
                  color: isSelected ? '#ffffff' : 'var(--text-main)',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '2px',
                  boxShadow: isSelected ? `0 4px 14px ${isJapan ? 'rgba(244,63,94,0.3)' : 'rgba(49,130,246,0.3)'}` : 'none',
                  transition: 'all 0.2s ease',
                  flexShrink: 0,
                }}
              >
                <span>Day {dayNum} ({count})</span>
                {dateLabel && (
                  <span style={{ fontSize: '0.72rem', opacity: isSelected ? 0.9 : 0.6 }}>
                    {dateLabel}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isJapan && (
            <button
              type="button"
              className="btn btn-subtle"
              style={{
                padding: '8px 14px',
                fontSize: '0.84rem',
                fontWeight: 800,
                color: '#f43f5e',
                background: 'rgba(244, 63, 94, 0.1)',
              }}
              onClick={handleApplyAll3N4DFukuoka}
              title="Day 1부터 Day 4까지 3박 4일 전체 일정 일괄 불러오기"
            >
              <Sparkles size={15} />
              <span>✨ 3박 4일 전체 코스 불러오기</span>
            </button>
          )}

          {isJapan && onOpenTransitCalc && (
            <button
              type="button"
              className="btn btn-outline"
              style={{ padding: '8px 14px', fontSize: '0.84rem', fontWeight: 800 }}
              onClick={onOpenTransitCalc}
            >
              <span>🚇 교통요금 계산기</span>
            </button>
          )}

          <button
            type="button"
            className="btn btn-primary"
            style={{
              padding: '10px 18px',
              fontSize: '0.9rem',
              fontWeight: 800,
              background: brandColor,
              boxShadow: `0 4px 14px ${isJapan ? 'rgba(244,63,94,0.3)' : 'rgba(49,130,246,0.3)'}`,
            }}
            onClick={() => {
              setEditingItem(null);
              setIsModalOpen(true);
            }}
          >
            <Plus size={16} strokeWidth={3} />
            <span>장소 추가</span>
          </button>
        </div>
      </div>

      {/* 2. 통계 및 퀵 프리셋 배너 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          padding: '14px 20px',
          background: 'var(--bg-hover)',
          borderRadius: '18px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.86rem', color: 'var(--text-main)', fontWeight: 700, flexWrap: 'wrap' }}>
          <span>📍 총 <b>{currentDayItems.length}곳</b> ({completedCount}곳 완료)</span>
          {totalTransitMin > 0 && <span>⏱️ 이동 <b>약 {totalTransitMin}분</b></span>}
          {totalCost > 0 && <span>💰 예상 <b>{currencySymbol}{totalCost.toLocaleString()}</b></span>}
          {passPlaceCount > 0 && (
            <span
              style={{
                color: brandColor,
                background: isJapan ? 'rgba(244, 63, 94, 0.12)' : 'rgba(49, 130, 246, 0.12)',
                padding: '2px 8px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Ticket size={13} />
              <span>티켓/패스 {passPlaceCount}곳</span>
            </span>
          )}
        </div>

        {isJapan && currentDayItems.length === 0 && (
          <button
            type="button"
            className="btn btn-subtle"
            style={{
              padding: '6px 14px',
              fontSize: '0.82rem',
              fontWeight: 800,
              color: '#f43f5e',
              background: 'rgba(244, 63, 94, 0.1)',
            }}
            onClick={() => handleApplyDayFukuoka(selectedDay)}
          >
            <Sparkles size={14} />
            <span>Day {selectedDay} 추천 코스 불러오기</span>
          </button>
        )}
      </div>

      {/* 3. 트리플 스타일 버티컬 타임라인 루트 */}
      {currentDayItems.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '50px 20px',
            background: 'var(--bg-surface)',
            borderRadius: '26px',
            border: '1px solid var(--border-light)',
          }}
        >
          <Compass size={48} style={{ margin: '0 auto 12px', color: brandColor, opacity: 0.7 }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Day {selectedDay} 여행 루트가 비어있습니다
          </h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '6px', maxWidth: '420px', margin: '6px auto 20px', lineHeight: 1.5 }}>
            방문할 관광지, 맛집, 카페를 순서대로 등록하면 <b>이동 시간과 교통편이 연결된 스마트 여행 동선</b>이 완성됩니다!
          </p>
          <button
            className="btn btn-primary"
            style={{
              padding: '12px 24px',
              fontWeight: 800,
              background: brandColor,
            }}
            onClick={() => {
              setEditingItem(null);
              setIsModalOpen(true);
            }}
          >
            <Plus size={18} />
            <span>첫 번째 장소 등록하기</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
          {currentDayItems.map((item, idx) => {
            const cat = CATEGORY_MAP[item.category] || CATEGORY_MAP.spot;
            const isLast = idx === currentDayItems.length - 1;
            const passImg = item.ticketImageUrl || item.qrImageUrl;
            const hasPass = Boolean(passImg || item.qrCodeData);

            return (
              <div key={item.id} style={{ display: 'flex', flexDirection: 'column' }}>
                {/* 메인 장소 카드 로우 */}
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  {/* 좌측 핀 & 넘버 */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '36px', flexShrink: 0 }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: item.isCompleted ? '#10b981' : brandColor,
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        fontSize: '0.95rem',
                        boxShadow: `0 4px 12px ${item.isCompleted ? 'rgba(16, 185, 129, 0.3)' : (isJapan ? 'rgba(244,63,94,0.3)' : 'rgba(49,130,246,0.3)')}`,
                        zIndex: 2,
                      }}
                    >
                      {idx + 1}
                    </div>
                  </div>

                  {/* 장소 카드 컨텐츠 */}
                  <div
                    style={{
                      flex: 1,
                      background: 'var(--bg-surface)',
                      borderRadius: '22px',
                      padding: '18px 22px',
                      border: '1px solid var(--border-light)',
                      boxShadow: 'var(--shadow-sm)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      opacity: item.isCompleted ? 0.75 : 1,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flex: 1 }}>
                        <button
                          type="button"
                          onClick={() => handleToggleComplete(item.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: item.isCompleted ? '#10b981' : 'var(--text-muted)' }}
                          title={item.isCompleted ? '방문 취소' : '방문 완료 체크'}
                        >
                          {item.isCompleted ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                        </button>

                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: '10px',
                            fontSize: '0.78rem',
                            fontWeight: 800,
                            background: cat.bg,
                            color: cat.color,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <span>{cat.icon}</span>
                          <span>{cat.label}</span>
                        </span>

                        {item.time && (
                          <span style={{ fontSize: '0.82rem', fontWeight: 800, color: brandColor, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={13} />
                            <span>{item.time}</span>
                          </span>
                        )}

                        <h4
                          style={{
                            fontSize: '1.05rem',
                            fontWeight: 800,
                            color: 'var(--text-main)',
                            margin: 0,
                            textDecoration: item.isCompleted ? 'line-through' : 'none',
                          }}
                        >
                          {item.placeName}
                        </h4>

                        {/* 장소명 바로 옆 원클릭 직행 티켓/패스 태그 */}
                        {hasPass && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPlaceForPass(item);
                            }}
                            style={{
                              padding: '3px 8px',
                              borderRadius: '8px',
                              fontSize: '0.74rem',
                              fontWeight: 800,
                              color: brandColor,
                              background: isJapan ? 'rgba(244, 63, 94, 0.12)' : 'rgba(49, 130, 246, 0.12)',
                              border: `1px solid ${isJapan ? 'rgba(244, 63, 94, 0.25)' : 'rgba(49, 130, 246, 0.25)'}`,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              transition: 'all 0.15s ease',
                            }}
                            title="클릭 시 모바일 티켓/바코드 캡처 사진 열기"
                          >
                            <Ticket size={12} />
                            <span>모바일 패스</span>
                          </button>
                        )}
                      </div>

                      {/* 우측: 실제 캡처/바코드/티켓 미니 썸네일 박스 & 액션 버튼들 */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                        {/* 📱 실제 티켓/캡처 미니 썸네일 박스 */}
                        {hasPass && (
                          <div
                            onClick={() => setSelectedPlaceForPass(item)}
                            style={{
                              width: '46px',
                              height: '46px',
                              borderRadius: '12px',
                              background: '#ffffff',
                              border: `1.5px solid ${isJapan ? 'rgba(244, 63, 94, 0.35)' : 'rgba(49, 130, 246, 0.35)'}`,
                              padding: '2px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                              position: 'relative',
                              flexShrink: 0,
                              overflow: 'hidden',
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.transform = 'scale(1.1)';
                              e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.15)';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.transform = 'scale(1)';
                              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
                            }}
                            title="🔍 클릭하여 티켓/캡처 사진 전체화면 열기"
                          >
                            {passImg ? (
                              <img
                                src={passImg}
                                alt="Pass Mini Thumbnail"
                                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
                              />
                            ) : item.qrCodeData ? (
                              <QRCodeSVG
                                value={item.qrCodeData}
                                size={38}
                                level="L"
                                bgColor="#ffffff"
                                fgColor="#000000"
                              />
                            ) : null}
                            <span
                              style={{
                                position: 'absolute',
                                bottom: '0px',
                                right: '0px',
                                background: brandColor,
                                color: 'white',
                                fontSize: '0.54rem',
                                fontWeight: 900,
                                padding: '1px 3px',
                                borderTopLeftRadius: '5px',
                                lineHeight: 1,
                              }}
                            >
                              PASS
                            </span>
                          </div>
                        )}

                        {/* 액션 버튼들 */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <button
                            type="button"
                            className="btn-icon"
                            style={{ width: '32px', height: '32px' }}
                            onClick={() => handleMoveOrder(idx, 'up')}
                            disabled={idx === 0}
                            title="위로 이동"
                          >
                            <ChevronUp size={16} />
                          </button>
                          <button
                            type="button"
                            className="btn-icon"
                            style={{ width: '32px', height: '32px' }}
                            onClick={() => handleMoveOrder(idx, 'down')}
                            disabled={isLast}
                            title="아래로 이동"
                          >
                            <ChevronDown size={16} />
                          </button>
                          <button
                            type="button"
                            className="btn-icon"
                            style={{ width: '32px', height: '32px' }}
                            onClick={() => {
                              setEditingItem(item);
                              setIsModalOpen(true);
                            }}
                            title="수정"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            type="button"
                            className="btn-icon"
                            style={{ width: '32px', height: '32px', color: '#ef4444' }}
                            onClick={() => handleDeletePlace(item.id)}
                            title="삭제"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 메모 & 비용 & 길찾기 & 패스 뷰어 버튼 */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', paddingTop: '4px' }}>
                      <div style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        {item.memo && <span>📝 {item.memo}</span>}
                        {item.cost && <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>💰 {currencySymbol}{item.cost.toLocaleString()}</span>}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {/* 🎟️ 현장 모바일 패스 열기 버튼 */}
                        {hasPass && (
                          <button
                            type="button"
                            className="btn btn-subtle"
                            style={{
                              padding: '6px 12px',
                              fontSize: '0.8rem',
                              fontWeight: 800,
                              color: brandColor,
                              background: isJapan ? 'rgba(244, 63, 94, 0.1)' : 'rgba(49, 130, 246, 0.1)',
                              border: `1px solid ${isJapan ? 'rgba(244, 63, 94, 0.25)' : 'rgba(49, 130, 246, 0.25)'}`,
                              minHeight: '34px',
                            }}
                            onClick={() => setSelectedPlaceForPass(item)}
                            title="현장 모바일 티켓/캡처 사진 열기"
                          >
                            <Ticket size={14} />
                            <span>모바일 패스 ↗</span>
                          </button>
                        )}

                        {item.mapUrl && (
                          <a
                            href={item.mapUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-subtle"
                            style={{
                              padding: '6px 12px',
                              fontSize: '0.78rem',
                              fontWeight: 800,
                              textDecoration: 'none',
                              minHeight: '34px',
                            }}
                          >
                            <Navigation2 size={12} />
                            <span>지도 길찾기 ↗</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 다음 장소 사이 이동 커넥터 뱃지 (트리플 시그니처) */}
                {!isLast && (
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center', minHeight: '44px', margin: '4px 0' }}>
                    {/* 세로 연결선 */}
                    <div style={{ width: '36px', display: 'flex', justifyContent: 'center' }}>
                      <div style={{ width: '3px', height: '100%', minHeight: '40px', background: 'var(--border-subtle)', borderRadius: '2px' }} />
                    </div>

                    {/* 이동 수단 배지 */}
                    {item.transitType ? (
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 14px',
                          borderRadius: '12px',
                          background: 'var(--bg-hover)',
                          border: '1px solid var(--border-light)',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                        }}
                        onClick={() => {
                          setEditingItem(item);
                          setIsModalOpen(true);
                        }}
                        title="클릭하여 이동 정보 수정"
                      >
                        <span>{TRANSIT_ICON_MAP[item.transitType] || '🚶'}</span>
                        <span>{item.transitDuration || 15}분</span>
                        {item.transitFare && <span>({currencySymbol}{item.transitFare.toLocaleString()})</span>}
                      </div>
                    ) : (
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '2px 8px',
                          borderRadius: '8px',
                          background: 'var(--bg-hover)',
                        }}
                        onClick={() => {
                          setEditingItem(item);
                          setIsModalOpen(true);
                        }}
                      >
                        + 이동 정보 추가
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 장소 편집 모달 */}
      <PlaceEditorModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSavePlace}
        editingItem={editingItem}
        day={selectedDay}
        country={trip.country}
      />

      {/* 🎟️ 현장 스캔용 모바일 티켓 / 캡처 사진 대형 뷰어 모달 */}
      {selectedPlaceForPass && (
        <div
          className="modal-backdrop"
          onClick={() => setSelectedPlaceForPass(null)}
          style={{ background: 'rgba(0, 0, 0, 0.88)', backdropFilter: 'blur(10px)', zIndex: 120 }}
        >
          <div
            className="modal-content"
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: '460px',
              background: '#ffffff',
              borderRadius: '28px',
              overflow: 'hidden',
              boxShadow: '0 25px 70px rgba(0,0,0,0.6)',
              animation: 'slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* 상단 헤더 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px', borderBottom: '1px solid #f1f5f9' }}>
              <span
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  color: brandColor,
                  background: isJapan ? 'rgba(244, 63, 94, 0.1)' : 'rgba(49, 130, 246, 0.1)',
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Ticket size={14} />
                <span>현장 모바일 패스 / 바우처</span>
              </span>
              <button
                className="btn-icon"
                onClick={() => setSelectedPlaceForPass(null)}
                style={{ width: '36px', height: '36px' }}
                title="닫기"
              >
                <X size={20} />
              </button>
            </div>

            {/* 본문: 대형 캡처 사진 / 바코드 / QR */}
            <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                  {selectedPlaceForPass.placeName}
                </h3>
                <div style={{ fontSize: '0.84rem', color: '#64748b', fontWeight: 700, marginTop: '4px' }}>
                  Day {selectedPlaceForPass.day} {selectedPlaceForPass.time ? `• ${selectedPlaceForPass.time}` : ''}
                </div>
              </div>

              {/* 이미지 / QR 뷰어 박스 */}
              <div
                style={{
                  width: '100%',
                  minHeight: '220px',
                  background: '#f8fafc',
                  border: '2px solid #e2e8f0',
                  borderRadius: '20px',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.03)',
                  overflow: 'hidden',
                }}
              >
                {selectedPlaceForPass.ticketImageUrl || selectedPlaceForPass.qrImageUrl ? (
                  <img
                    src={selectedPlaceForPass.ticketImageUrl || selectedPlaceForPass.qrImageUrl}
                    alt="Ticket Pass"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '360px',
                      objectFit: 'contain',
                      borderRadius: '12px',
                      boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
                    }}
                  />
                ) : selectedPlaceForPass.qrCodeData ? (
                  <div style={{ padding: '16px', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <QRCodeSVG
                      value={selectedPlaceForPass.qrCodeData}
                      size={210}
                      level="Q"
                      bgColor="#ffffff"
                      fgColor="#000000"
                    />
                  </div>
                ) : (
                  <div style={{ color: '#94a3b8', padding: '24px 0' }}>
                    <ImageIcon size={54} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                    <p style={{ fontSize: '0.88rem', fontWeight: 700, margin: 0 }}>등록된 티켓 사진이 없습니다.</p>
                  </div>
                )}
              </div>

              {/* 텍스트 / 예약번호 복사 */}
              {selectedPlaceForPass.qrCodeData && (
                <div
                  style={{
                    width: '100%',
                    background: '#f1f5f9',
                    padding: '10px 14px',
                    borderRadius: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                  }}
                >
                  <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#334155', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    {selectedPlaceForPass.qrCodeData}
                  </span>
                  <button
                    type="button"
                    className="btn btn-subtle"
                    style={{ padding: '6px 10px', fontSize: '0.78rem', minHeight: '32px', flexShrink: 0 }}
                    onClick={() => handleCopyPassData(selectedPlaceForPass.qrCodeData || '')}
                  >
                    {isCopied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                    <span>{isCopied ? '복사됨' : '복사'}</span>
                  </button>
                </div>
              )}

              {selectedPlaceForPass.memo && (
                <p style={{ fontSize: '0.84rem', color: '#64748b', margin: 0 }}>
                  💡 {selectedPlaceForPass.memo}
                </p>
              )}
            </div>

            <div style={{ padding: '16px 24px', background: '#f8fafc', borderTop: '1px solid #f1f5f9' }}>
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%', minHeight: '46px', fontWeight: 800, background: brandColor }}
                onClick={() => setSelectedPlaceForPass(null)}
              >
                확인 완료 (닫기)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
