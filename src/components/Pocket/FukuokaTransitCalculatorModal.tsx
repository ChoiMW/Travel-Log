import React, { useState, useMemo } from 'react';
import { X, Train, Bus, Car, Navigation2, Check, Sparkles, Plus, Clock, ArrowRight, DollarSign } from 'lucide-react';
import { FUKUOKA_TRANSIT_ROUTES, TransitRouteItem } from '../../data/fukuokaTransitFares';

interface FukuokaTransitCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddExpense: (expense: { title: string; amount: number; category: string }) => void;
}

export const FukuokaTransitCalculatorModal: React.FC<FukuokaTransitCalculatorModalProps> = ({
  isOpen,
  onClose,
  onAddExpense,
}) => {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedRouteId, setSelectedRouteId] = useState<string>(FUKUOKA_TRANSIT_ROUTES[0].id);

  // 승하차 커스텀 선택 모드 상태
  const [customFrom, setCustomFrom] = useState<string>('all');
  const [customTo, setCustomTo] = useState<string>('all');

  const filteredRoutes = useMemo(() => {
    return FUKUOKA_TRANSIT_ROUTES.filter(route => {
      const matchType = selectedType === 'all' || route.type === selectedType;
      const matchFrom = customFrom === 'all' || route.from.includes(customFrom);
      const matchTo = customTo === 'all' || route.to.includes(customTo);
      return matchType && matchFrom && matchTo;
    });
  }, [selectedType, customFrom, customTo]);

  const selectedRoute = useMemo(() => {
    return FUKUOKA_TRANSIT_ROUTES.find(r => r.id === selectedRouteId) || filteredRoutes[0] || null;
  }, [selectedRouteId, filteredRoutes]);

  const handleApplyToExpense = () => {
    if (!selectedRoute) return;

    onAddExpense({
      title: `[교통] ${selectedRoute.from} ➔ ${selectedRoute.to} (${selectedRoute.lineName})`,
      amount: selectedRoute.fare,
      category: '교통비',
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" style={{ background: 'rgba(0,0,0,0.82)', zIndex: 110 }}>
      <div
        className="modal-content"
        style={{
          maxWidth: '620px',
          background: 'var(--bg-surface)',
          borderRadius: '28px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* 모달 헤더 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ background: '#f43f5e', color: 'white', padding: '6px', borderRadius: '12px', display: 'flex' }}>
              <Train size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-main)' }}>
                ⚡ 후쿠오카 교통요금 스마트 계산기
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                후쿠오카 공항, 하카타, 텐진, 다자이후, 택시 요금 자동 계산 및 가계부 1초 등록
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* 1. 교통수단 탭 필터 */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
          {[
            { id: 'all', label: '전체 노선', icon: '🗾' },
            { id: 'subway', label: '후쿠오카 지하철', icon: '🚇' },
            { id: 'train', label: '니시테츠 전철', icon: '🚃' },
            { id: 'bus', label: '시내/직행 버스', icon: '🚌' },
            { id: 'taxi', label: '후쿠오카 택시', icon: '🚕' },
            { id: 'jr', label: 'JR 특급(유후인)', icon: '🚄' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setSelectedType(tab.id);
                setCustomFrom('all');
                setCustomTo('all');
              }}
              style={{
                padding: '8px 14px',
                borderRadius: '9999px',
                border: selectedType === tab.id ? '2px solid #f43f5e' : '1px solid var(--border-light)',
                background: selectedType === tab.id ? '#fff1f2' : 'var(--bg-hover)',
                color: selectedType === tab.id ? '#f43f5e' : 'var(--text-main)',
                fontSize: '0.82rem',
                fontWeight: selectedType === tab.id ? 800 : 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* 2. 노선 목록 선택 리스트 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
          {filteredRoutes.map(route => {
            const isSelected = selectedRoute?.id === route.id;
            return (
              <div
                key={route.id}
                onClick={() => setSelectedRouteId(route.id)}
                style={{
                  padding: '14px 16px',
                  borderRadius: '18px',
                  border: isSelected ? '2px solid #f43f5e' : '1px solid var(--border-subtle)',
                  background: isSelected ? 'rgba(244, 63, 94, 0.04)' : 'var(--bg-subtle)',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: '#f43f5e', fontWeight: 800 }}>
                    <span>{route.lineName}</span>
                    {route.durationMinutes > 0 && <span>• 약 {route.durationMinutes}분 소요</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.94rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '3px' }}>
                    <span>{route.from}</span>
                    <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
                    <span>{route.to}</span>
                  </div>
                  {route.tip && (
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      💡 {route.tip}
                    </div>
                  )}
                </div>

                <div style={{ textAlign: 'right', marginLeft: '12px', flexShrink: 0 }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#f43f5e' }}>
                    ¥{route.fare.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    (약 {Math.round(route.fare * 9.2).toLocaleString()}원)
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 3. 선택된 요금 요약 및 가계부 즉시 등록 배너 */}
        {selectedRoute && (
          <div
            style={{
              background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
              color: 'white',
              borderRadius: '20px',
              padding: '18px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 8px 20px rgba(0,0,0,0.18)',
            }}
          >
            <div>
              <div style={{ fontSize: '0.78rem', color: '#c7d2fe', fontWeight: 700 }}>
                선택된 교통편: {selectedRoute.lineName}
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 900, marginTop: '2px' }}>
                ¥{selectedRoute.fare.toLocaleString()} <span style={{ fontSize: '0.85rem', color: '#93c5fd', fontWeight: 600 }}>(약 {Math.round(selectedRoute.fare * 9.2).toLocaleString()}원)</span>
              </div>
            </div>

            <button
              className="btn btn-primary"
              onClick={handleApplyToExpense}
              style={{
                background: '#f43f5e',
                color: 'white',
                padding: '10px 18px',
                borderRadius: '14px',
                fontSize: '0.88rem',
                fontWeight: 800,
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(244, 63, 94, 0.4)',
              }}
            >
              <Plus size={16} />
              <span>가계부에 바로 담기</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
