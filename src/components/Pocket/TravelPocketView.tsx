import React, { useState, useEffect } from 'react';
import {
  Ticket, QrCode, Plus, Trash2, CheckSquare, Square, Users,
  Sparkles, Calendar, MapPin, ExternalLink, Image as ImageIcon,
  CheckCircle2, Clock, Luggage, Wallet, Compass, Plane, ChevronRight,
  Navigation2, Utensils, Coffee, Bed, Landmark
} from 'lucide-react';
import { QRPassModal, MobileTicketItem } from './QRPassModal';
import { FukuokaTransitCalculatorModal } from './FukuokaTransitCalculatorModal';
import { Trip, PackingItem, ExpenseItem, ItineraryItem } from '../../types/travel';
import { RoutePlannerSection } from './RoutePlannerSection';
import { FUKUOKA_3N4D_TRIP_SAMPLE } from '../../data/fukuoka3N4DRoute';

interface TravelPocketViewProps {
  trips: Trip[];
  defaultTripId?: string;
  onUpdateTrip: (updatedTrip: Trip) => void;
  onOpenNewTripPlan: () => void;
}

export const TravelPocketView: React.FC<TravelPocketViewProps> = ({
  trips = [],
  defaultTripId,
  onUpdateTrip,
  onOpenNewTripPlan,
}) => {
  const [selectedTripId, setSelectedTripId] = useState<string>(() => defaultTripId || trips[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'itinerary' | 'tickets' | 'packing' | 'expense'>('itinerary');
  const [isTransitCalcOpen, setIsTransitCalcOpen] = useState<boolean>(false);

  // defaultTripId가 외부에서 변경될 때 자동 전환
  useEffect(() => {
    if (defaultTripId && trips.some(t => t.id === defaultTripId)) {
      setSelectedTripId(defaultTripId);
    }
  }, [defaultTripId, trips]);

  // 현재 선택된 여행 (안전한 방어 코드)
  const currentTrip = trips.find(t => t.id === selectedTripId) || (trips.length > 0 ? trips[0] : null);

  useEffect(() => {
    if ((!selectedTripId || !trips.some(t => t.id === selectedTripId)) && trips.length > 0) {
      setSelectedTripId(defaultTripId || trips[0].id);
    }
  }, [trips, selectedTripId, defaultTripId]);

  // ==========================================
  // D-Day 계산 헬퍼
  // ==========================================
  const getDDayBadge = (dateStr?: string) => {
    if (!dateStr) return { label: '일정 미정', color: '#64748b', bg: '#f1f5f9' };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return { label: '⚡ D-Day 오늘 출발!', color: '#ef4444', bg: '#fee2e2' };
    if (diffDays > 0) return { label: `🛫 D-${diffDays}일 전`, color: '#3182f6', bg: '#e8f3ff' };
    return { label: `✓ ${Math.abs(diffDays)}일 전 다녀옴`, color: '#64748b', bg: '#f1f5f9' };
  };

  // ==========================================
  // 1. 일자별 여행 루트 플래너 (Itinerary)
  // ==========================================
  const itinerary = currentTrip?.itinerary || [];

  // ==========================================
  // 2. 모바일 티켓 & QR 퀵패스 월렛 핸들러
  // ==========================================
  const tickets = currentTrip?.tickets || [];
  const [selectedTicketForQR, setSelectedTicketForQR] = useState<MobileTicketItem | null>(null);
  const [isQRModalOpen, setIsQRModalOpen] = useState<boolean>(false);

  const [isAddingTicket, setIsAddingTicket] = useState<boolean>(false);
  const [newTicketTitle, setNewTicketTitle] = useState('');
  const [newTicketCategory, setNewTicketCategory] = useState<'ktx' | 'flight' | 'hotel' | 'ticket' | 'etc'>('ktx');
  const [newTicketDate, setNewTicketDate] = useState(currentTrip?.startDate || new Date().toISOString().split('T')[0]);
  const [newTicketTime, setNewTicketTime] = useState('');
  const [newTicketLocation, setNewTicketLocation] = useState(currentTrip?.districtNames?.join(', ') || '');
  const [newBookingNumber, setNewBookingNumber] = useState('');
  const [newTicketMemo, setNewTicketMemo] = useState('');
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [newImagePreview, setNewImagePreview] = useState<string>('');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewImageFile(file);
      setNewImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSaveNewTicket = () => {
    if (!newTicketTitle.trim() || !currentTrip) return;

    const newTicket: MobileTicketItem = {
      id: `ticket_${Date.now()}`,
      title: newTicketTitle.trim(),
      category: newTicketCategory,
      date: newTicketDate,
      time: newTicketTime.trim(),
      location: newTicketLocation.trim(),
      bookingNumber: newBookingNumber.trim(),
      memo: newTicketMemo.trim(),
      blob: newImageFile ? new Blob([newImageFile], { type: newImageFile.type }) : undefined,
      imageUrl: newImagePreview || undefined,
      isUsed: false,
    };

    const updated: Trip = {
      ...currentTrip,
      tickets: [newTicket, ...(currentTrip.tickets || [])],
    };
    onUpdateTrip(updated);

    setNewTicketTitle('');
    setNewTicketTime('');
    setNewBookingNumber('');
    setNewTicketMemo('');
    setNewImageFile(null);
    setNewImagePreview('');
    setIsAddingTicket(false);
  };

  const toggleTicketUsed = (ticketId: string) => {
    if (!currentTrip) return;
    const updated: Trip = {
      ...currentTrip,
      tickets: (currentTrip.tickets || []).map(t => t.id === ticketId ? { ...t, isUsed: !t.isUsed } : t),
    };
    onUpdateTrip(updated);
  };

  const deleteTicket = (ticketId: string) => {
    if (!currentTrip) return;
    const updated: Trip = {
      ...currentTrip,
      tickets: (currentTrip.tickets || []).filter(t => t.id !== ticketId),
    };
    onUpdateTrip(updated);
  };

  // ==========================================
  // 3. 스마트 짐싸기 체크리스트 핸들러
  // ==========================================
  const defaultPacking: PackingItem[] = [
    { id: '1', text: '신분증 & 운전면허증', category: '필수', checked: false },
    { id: '2', text: '스마트폰 고속 충전기 & 보조배터리', category: '전자기기', checked: false },
    { id: '3', text: '세면도구 & 스킨케어 키트', category: '생활용품', checked: false },
    { id: '4', text: '비상 상비약 (소화제, 타이레놀, 밴드)', category: '건강', checked: false },
    { id: '5', text: '여벌 옷 & 양말 (2박용)', category: '의류', checked: false },
    { id: '6', text: '삼각대 & 블루투스 리모컨', category: '전자기기', checked: false },
  ];

  const packingList = currentTrip?.packingList && currentTrip.packingList.length > 0
    ? currentTrip.packingList
    : defaultPacking;

  const [newPackingText, setNewPackingText] = useState('');

  const togglePackingCheck = (id: string) => {
    if (!currentTrip) return;
    const updated: Trip = {
      ...currentTrip,
      packingList: packingList.map(item => item.id === id ? { ...item, checked: !item.checked } : item),
    };
    onUpdateTrip(updated);
  };

  const addPackingItem = () => {
    if (!newPackingText.trim() || !currentTrip) return;
    const updated: Trip = {
      ...currentTrip,
      packingList: [...packingList, { id: `p_${Date.now()}`, text: newPackingText.trim(), category: '기타', checked: false }],
    };
    onUpdateTrip(updated);
    setNewPackingText('');
  };

  const deletePackingItem = (id: string) => {
    if (!currentTrip) return;
    const updated: Trip = {
      ...currentTrip,
      packingList: packingList.filter(item => item.id !== id),
    };
    onUpdateTrip(updated);
  };

  const packedCount = packingList.filter(i => i.checked).length;

  // ==========================================
  // 4. 1/N 정산 가계부 핸들러
  // ==========================================
  const expenses = currentTrip?.expenses || [];
  const [peopleCount, setPeopleCount] = useState<number>(2);
  const [newExpenseTitle, setNewExpenseTitle] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');

  const addExpenseItem = () => {
    const amt = parseInt(newExpenseAmount, 10);
    if (!newExpenseTitle.trim() || isNaN(amt) || amt <= 0 || !currentTrip) return;
    const updated: Trip = {
      ...currentTrip,
      expenses: [...expenses, { id: `e_${Date.now()}`, title: newExpenseTitle.trim(), amount: amt, category: '기타' }],
    };
    onUpdateTrip(updated);
    setNewExpenseTitle('');
    setNewExpenseAmount('');
  };

  const deleteExpenseItem = (id: string) => {
    if (!currentTrip) return;
    const updated: Trip = {
      ...currentTrip,
      expenses: expenses.filter(item => item.id !== id),
    };
    onUpdateTrip(updated);
  };

  const isJapan = currentTrip?.country === 'JP';
  const currencySymbol = isJapan ? '¥' : '원';
  const currencyPrefix = isJapan ? '¥' : '';
  const currencySuffix = isJapan ? '엔' : '원';

  const totalExpense = expenses.reduce((sum, item) => sum + (item.amount || 0), 0);
  const perPersonAmount = peopleCount > 0 ? Math.round(totalExpense / peopleCount) : totalExpense;

  // 등록된 여행이 하나도 없는 경우 (안전한 방어 뷰)
  if (!currentTrip || trips.length === 0) {
    return (
      <div style={{ maxWidth: '680px', margin: '0 auto', textAlign: 'center', padding: '60px 20px', background: 'var(--bg-surface)', borderRadius: '26px', boxShadow: 'var(--shadow-md)' }}>
        <Luggage size={54} color="#3182f6" style={{ margin: '0 auto 16px' }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-main)' }}>
          계획된 여행이 아직 없습니다
        </h2>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '8px', maxWidth: '440px', margin: '8px auto 24px', lineHeight: 1.5 }}>
          여행을 떠나기 전, 여행지와 날짜를 먼저 정하고 <b>일정표, KTX/항공권 QR 티켓, 짐싸기 체크리스트</b>를 미리 준비해 보세요!
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            style={{ padding: '14px 28px', fontSize: '0.98rem', fontWeight: 800 }}
            onClick={onOpenNewTripPlan}
          >
            <Plus size={20} />
            <span>새 여행 계획 등록하기</span>
          </button>

          <button
            className="btn btn-subtle"
            style={{
              padding: '14px 24px',
              fontSize: '0.95rem',
              fontWeight: 800,
              color: '#f43f5e',
              background: 'rgba(244, 63, 94, 0.1)',
            }}
            onClick={() => onUpdateTrip(FUKUOKA_3N4D_TRIP_SAMPLE)}
          >
            <Sparkles size={18} />
            <span>✨ 후쿠오카 3박 4일 샘플 생성</span>
          </button>
        </div>
      </div>
    );
  }

  const dDay = getDDayBadge(currentTrip.startDate);

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'food': return <Utensils size={16} color="#f59e0b" />;
      case 'cafe': return <Coffee size={16} color="#8b5cf6" />;
      case 'hotel': return <Bed size={16} color="#10b981" />;
      default: return <Landmark size={16} color="#3182f6" />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '800px', margin: '0 auto', paddingBottom: '80px' }}>
      {/* 1. 여행 선택 셀렉터 & 상단 헤더 배너 */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          color: 'white',
          borderRadius: '26px',
          padding: '24px 28px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        <div style={{ flex: 1, minWidth: '260px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: dDay.color, background: dDay.bg, padding: '3px 10px', borderRadius: '9999px' }}>
              {dDay.label}
            </span>
          </div>

          <div style={{ marginTop: '10px' }}>
            <select
              value={selectedTripId}
              onChange={e => {
                if (e.target.value === 'NEW') {
                  onOpenNewTripPlan();
                } else {
                  setSelectedTripId(e.target.value);
                }
              }}
              style={{
                width: '100%',
                maxWidth: '420px',
                padding: '10px 14px',
                borderRadius: '14px',
                background: 'rgba(255,255,255,0.15)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.25)',
                fontSize: '1.15rem',
                fontWeight: 900,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {trips.map(trip => (
                <option key={trip.id} value={trip.id} style={{ background: '#1e293b', color: 'white' }}>
                  {trip.startDate} • {trip.title} ({trip.districtNames?.join(', ') || '지역'})
                </option>
              ))}
              <option value="NEW" style={{ background: '#3182f6', color: 'white', fontWeight: 'bold' }}>
                ➕ 새로운 여행 일정 계획하기...
              </option>
            </select>
          </div>
        </div>

        {/* 4대 서브 탭 스위처 */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.12)', padding: '4px', borderRadius: '16px', overflowX: 'auto' }}>
          <button
            onClick={() => setActiveTab('itinerary')}
            style={{
              padding: '8px 16px',
              borderRadius: '12px',
              border: 'none',
              background: activeTab === 'itinerary' ? (currentTrip.country === 'JP' ? '#f43f5e' : '#3182f6') : 'transparent',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '0.86rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
            }}
          >
            <Compass size={16} />
            <span>일정/루트 ({itinerary.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('tickets')}
            style={{
              padding: '8px 14px',
              borderRadius: '12px',
              border: 'none',
              background: activeTab === 'tickets' ? (currentTrip.country === 'JP' ? '#f43f5e' : '#3182f6') : 'transparent',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '0.84rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
            }}
          >
            <Ticket size={15} />
            <span>티켓/QR ({tickets.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('packing')}
            style={{
              padding: '8px 14px',
              borderRadius: '12px',
              border: 'none',
              background: activeTab === 'packing' ? (currentTrip.country === 'JP' ? '#f43f5e' : '#3182f6') : 'transparent',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '0.84rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
            }}
          >
            <CheckSquare size={15} />
            <span>짐싸기 ({packedCount}/{packingList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('expense')}
            style={{
              padding: '8px 14px',
              borderRadius: '12px',
              border: 'none',
              background: activeTab === 'expense' ? (currentTrip.country === 'JP' ? '#f43f5e' : '#3182f6') : 'transparent',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '0.84rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
            }}
          >
            <Wallet size={15} />
            <span>1/N 가계부</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          탭 1: 🧭 [트리플 스타일] 일자별 여행 루트 플래너 (Itinerary / Route Planner)
          ========================================================================= */}
      {activeTab === 'itinerary' && (
        <RoutePlannerSection
          trip={currentTrip}
          onUpdateTrip={onUpdateTrip}
          onOpenTransitCalc={() => setIsTransitCalcOpen(true)}
        />
      )}

      {/* =========================================================================
          탭 2: 🎟️ 모바일 티켓 & QR 퀵패스 월렛
          ========================================================================= */}
      {activeTab === 'tickets' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-secondary)' }}>
              🎟️ [{currentTrip.title}] 티켓/바우처 ({tickets.length}장)
            </span>

            <button
              className="btn btn-primary"
              style={{ padding: '8px 16px', fontSize: '0.86rem' }}
              onClick={() => setIsAddingTicket(prev => !prev)}
            >
              <Plus size={16} />
              <span>이 여행에 티켓/QR 추가</span>
            </button>
          </div>

          {/* 티켓 등록 폼 */}
          {isAddingTicket && (
            <div
              style={{
                background: 'var(--bg-surface)',
                borderRadius: '24px',
                padding: '22px',
                boxShadow: 'var(--shadow-lg)',
                border: '2px solid #3182f6',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                animation: 'slideUp 0.25s ease',
              }}
            >
              <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-main)' }}>
                [{currentTrip.title}] 새 모바일 티켓 등록
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
                <div>
                  <label className="form-label">티켓 종류</label>
                  <select
                    className="form-select"
                    value={newTicketCategory}
                    onChange={e => setNewTicketCategory(e.target.value as any)}
                  >
                    <option value="ktx">🚄 KTX / 기차표</option>
                    <option value="flight">✈️ 항공권 / 비행기표</option>
                    <option value="hotel">🏨 숙소 예약 바우처</option>
                    <option value="ticket">🎡 테마파크 / 입장권</option>
                    <option value="etc">🎟️ 기타 모바일 티켓</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">사용 일자</label>
                  <input
                    type="date"
                    className="form-input"
                    value={newTicketDate}
                    onChange={e => setNewTicketDate(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="form-label">티켓 이름 / 탑승권</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="예: KTX 123호 (서울 -> 부산) 또는 롯데월드 자유이용권"
                  value={newTicketTitle}
                  onChange={e => setNewTicketTitle(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="form-label">시간 (선택)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="예: 09:30 탑승 또는 15:00 체크인"
                    value={newTicketTime}
                    onChange={e => setNewTicketTime(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">예약/승차권 번호 (선택)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="예: 8294-1029-4821"
                    value={newBookingNumber}
                    onChange={e => setNewBookingNumber(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="form-label">QR코드 / 바코드 캡처 사진</label>
                <div
                  style={{
                    border: '2px dashed var(--border-subtle)',
                    borderRadius: '16px',
                    padding: '18px',
                    textAlign: 'center',
                    background: 'var(--bg-subtle)',
                    cursor: 'pointer',
                  }}
                  onClick={() => document.getElementById('ticket-qr-upload')?.click()}
                >
                  <input
                    id="ticket-qr-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                  {newImagePreview ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                      <img src={newImagePreview} alt="preview" style={{ height: '60px', borderRadius: '8px', objectFit: 'cover' }} />
                      <span style={{ fontSize: '0.84rem', color: '#3182f6', fontWeight: 700 }}>사진 변경하기</span>
                    </div>
                  ) : (
                    <div style={{ color: 'var(--text-muted)' }}>
                      <QrCode size={28} style={{ margin: '0 auto 6px', color: '#3182f6' }} />
                      <div style={{ fontSize: '0.86rem', fontWeight: 700 }}>QR코드/바코드 캡처 사진 첨부하기</div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="form-label">메모 (좌석, 비밀번호 등)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="예: 5호차 12A 좌석, 도어락 비밀번호 1234#"
                  value={newTicketMemo}
                  onChange={e => setNewTicketMemo(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button className="btn btn-subtle" onClick={() => setIsAddingTicket(false)}>취소</button>
                <button className="btn btn-primary" onClick={handleSaveNewTicket}>
                  <span>티켓 월렛에 저장</span>
                </button>
              </div>
            </div>
          )}

          {/* 티켓 목록 */}
          {tickets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--bg-surface)', borderRadius: '24px' }}>
              <QrCode size={48} style={{ margin: '0 auto 10px', color: 'var(--text-muted)', opacity: 0.5 }} />
              <p style={{ fontWeight: 800, color: 'var(--text-main)' }}>이 여행에 등록된 티켓이 없습니다</p>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                KTX 기차표나 숙소 예약 QR을 등록해두면 현장 탑승구 앞에서 1초 만에 스캔할 수 있습니다.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '12px' }}>
              {tickets.map(ticket => (
                <div
                  key={ticket.id}
                  style={{
                    background: 'var(--bg-surface)',
                    borderRadius: '22px',
                    padding: '18px 20px',
                    boxShadow: 'var(--shadow-md)',
                    border: '1px solid var(--border-light)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '12px',
                    opacity: ticket.isUsed ? 0.55 : 1,
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.74rem', fontWeight: 800, background: '#e8f3ff', color: '#3182f6', padding: '3px 8px', borderRadius: '8px' }}>
                        {ticket.category.toUpperCase()}
                      </span>
                      <button
                        onClick={() => deleteTicket(ticket.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <h4 style={{ fontSize: '1.05rem', fontWeight: 900, marginTop: '8px', color: 'var(--text-main)' }}>
                      {ticket.title}
                    </h4>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 600 }}>
                      <Calendar size={13} />
                      <span>{ticket.date} {ticket.time ? `• ${ticket.time}` : ''}</span>
                    </div>

                    {ticket.memo && (
                      <p style={{ fontSize: '0.82rem', color: '#475569', background: 'var(--bg-subtle)', padding: '8px 12px', borderRadius: '10px', marginTop: '8px' }}>
                        💡 {ticket.memo}
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-light)', paddingTop: '10px' }}>
                    <button
                      className="btn btn-primary"
                      style={{ flex: 1, padding: '10px', fontSize: '0.88rem', fontWeight: 800 }}
                      onClick={() => {
                        setSelectedTicketForQR(ticket);
                        setIsQRModalOpen(true);
                      }}
                    >
                      <QrCode size={18} />
                      <span>현장 QR / 바코드 띄우기</span>
                    </button>

                    <button
                      className="btn btn-subtle"
                      style={{ padding: '10px 14px', fontSize: '0.82rem', fontWeight: 700 }}
                      onClick={() => toggleTicketUsed(ticket.id)}
                    >
                      {ticket.isUsed ? '사용됨' : '완료'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          탭 3: 🎒 스마트 짐싸기 체크리스트
          ========================================================================= */}
      {activeTab === 'packing' && (
        <div style={{ background: 'var(--bg-surface)', borderRadius: '26px', padding: '24px', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                [{currentTrip.title}] 짐싸기 체크리스트
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                여행지: {currentTrip.districtNames?.join(', ')} • 출발일: {currentTrip.startDate}
              </p>
            </div>
            <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#3182f6' }}>
              {Math.round((packedCount / (packingList.length || 1)) * 100)}% 완료
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <input
              type="text"
              placeholder="이 여행에 추가할 준비물 (예: 선글라스, 수영복, 방수팩)"
              value={newPackingText}
              onChange={e => setNewPackingText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addPackingItem()}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: '14px',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-subtle)',
                color: 'var(--text-main)',
                fontSize: '0.92rem',
                outline: 'none',
              }}
            />
            <button className="btn btn-primary" onClick={addPackingItem}>
              <Plus size={16} />
              <span>추가</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {packingList.map(item => (
              <div
                key={item.id}
                onClick={() => togglePackingCheck(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: '16px',
                  background: item.checked ? 'var(--bg-hover)' : 'var(--bg-subtle)',
                  cursor: 'pointer',
                  opacity: item.checked ? 0.6 : 1,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {item.checked ? <CheckSquare size={20} color="#3182f6" /> : <Square size={20} color="var(--text-muted)" />}
                  <span style={{ fontSize: '0.92rem', fontWeight: 700, textDecoration: item.checked ? 'line-through' : 'none' }}>
                    {item.text}
                  </span>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); deletePackingItem(item.id); }}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          탭 4: 💰 1/N 정산 가계부
          ========================================================================= */}
      {activeTab === 'expense' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
              color: 'white',
              borderRadius: '24px',
              padding: '24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div>
              <div style={{ fontSize: '0.82rem', color: '#c7d2fe', fontWeight: 700 }}>
                [{currentTrip.title}] 총 지출 합계
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 900, marginTop: '2px' }}>
                {currencyPrefix}{totalExpense.toLocaleString()}{currencySuffix}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end', fontSize: '0.82rem', color: '#c7d2fe' }}>
                <Users size={14} />
                <span>총 <b>{peopleCount}명</b> 정산 시 1인당</span>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#38bdf8', marginTop: '2px' }}>
                {currencyPrefix}{perPersonAmount.toLocaleString()}{currencySuffix}
              </div>
            </div>
          </div>

          {/* ⚡ 후쿠오카/일본 교통요금 스마트 계산기 배너 */}
          <div
            style={{
              background: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)',
              border: '1px solid #fecdd3',
              borderRadius: '20px',
              padding: '16px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(244, 63, 94, 0.08)',
              transition: 'transform 0.15s ease',
            }}
            onClick={() => setIsTransitCalcOpen(true)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: '#f43f5e', color: 'white', padding: '10px', borderRadius: '14px', fontSize: '1.2rem' }}>
                ⚡
              </div>
              <div>
                <div style={{ fontSize: '0.96rem', fontWeight: 800, color: '#9f1239' }}>
                  후쿠오카 교통요금 스마트 자동 계산기
                </div>
                <div style={{ fontSize: '0.78rem', color: '#be123c', marginTop: '2px' }}>
                  후쿠오카 공항, 하카타, 텐진, 다자이후, 택시 요금 선택 시 가계부에 엔화(¥)로 1초 자동 등록!
                </div>
              </div>
            </div>

            <button
              className="btn btn-primary"
              style={{
                background: '#f43f5e',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '12px',
                fontSize: '0.84rem',
                fontWeight: 800,
                border: 'none',
                flexShrink: 0,
              }}
              onClick={e => {
                e.stopPropagation();
                setIsTransitCalcOpen(true);
              }}
            >
              요금 계산기 열기
            </button>
          </div>

          <div style={{ background: 'var(--bg-surface)', borderRadius: '26px', padding: '24px', boxShadow: 'var(--shadow-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                지출 내역 목록 ({expenses.length}건)
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-muted)' }}>정산 인원:</span>
                <select
                  value={peopleCount}
                  onChange={e => setPeopleCount(parseInt(e.target.value, 10))}
                  style={{ padding: '6px 12px', borderRadius: '10px', background: 'var(--bg-hover)', color: 'var(--text-main)', border: 'none', fontWeight: 800 }}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(n => <option key={n} value={n}>{n}명</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr auto', gap: '8px', marginBottom: '16px' }}>
              <input
                type="text"
                placeholder={isJapan ? "지출 항목 (예: 신칸센, 돈키호테)" : "지출 항목 (예: 렌트카, 맛집)"}
                value={newExpenseTitle}
                onChange={e => setNewExpenseTitle(e.target.value)}
                style={{ padding: '12px', borderRadius: '14px', border: '1px solid var(--border-subtle)', background: 'var(--bg-subtle)', color: 'var(--text-main)', outline: 'none' }}
              />
              <input
                type="number"
                placeholder={`금액 (${currencySuffix})`}
                value={newExpenseAmount}
                onChange={e => setNewExpenseAmount(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addExpenseItem()}
                style={{ padding: '12px', borderRadius: '14px', border: '1px solid var(--border-subtle)', background: 'var(--bg-subtle)', color: 'var(--text-main)', outline: 'none' }}
              />
              <button className="btn btn-primary" onClick={addExpenseItem}>
                <Plus size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {expenses.map(item => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '16px',
                    background: 'var(--bg-subtle)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '0.74rem', background: '#e0e7ff', color: '#3182f6', padding: '2px 8px', borderRadius: '8px', fontWeight: 800 }}>
                      {item.category}
                    </span>
                    <span style={{ fontSize: '0.94rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      {item.title}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: 900, color: 'var(--text-main)' }}>
                      {currencyPrefix}{item.amount.toLocaleString()}{currencySuffix}
                    </span>
                    <button onClick={() => deleteExpenseItem(item.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 풀스크린 대형 QR/바코드 팝업 모달 */}
      <QRPassModal
        ticket={selectedTicketForQR}
        isOpen={isQRModalOpen}
        onClose={() => {
          setIsQRModalOpen(false);
          setSelectedTicketForQR(null);
        }}
      />

      {/* ⚡ 후쿠오카 교통요금 자동 계산기 모달 */}
      <FukuokaTransitCalculatorModal
        isOpen={isTransitCalcOpen}
        onClose={() => setIsTransitCalcOpen(false)}
        onAddExpense={(expense) => {
          if (!currentTrip) return;
          const newExpItem: ExpenseItem = {
            id: `exp_${Date.now()}`,
            title: expense.title,
            amount: expense.amount,
            category: expense.category,
            currency: currentTrip.country === 'JP' ? 'JPY' : 'KRW',
          };
          const updated: Trip = {
            ...currentTrip,
            expenses: [...(currentTrip.expenses || []), newExpItem],
          };
          onUpdateTrip(updated);
        }}
      />
    </div>
  );
};
