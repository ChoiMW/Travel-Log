import React, { useState } from 'react';
import { X, Copy, Check, Maximize2, QrCode, Calendar, MapPin, Ticket } from 'lucide-react';

export interface MobileTicketItem {
  id: string;
  title: string;
  category: 'ktx' | 'flight' | 'hotel' | 'ticket' | 'etc';
  date: string;
  time?: string;
  location?: string;
  bookingNumber?: string;
  memo?: string;
  imageUrl?: string;
  blob?: Blob;
  isUsed: boolean;
}

interface QRPassModalProps {
  ticket: MobileTicketItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const QRPassModal: React.FC<QRPassModalProps> = ({
  ticket,
  isOpen,
  onClose,
}) => {
  const [isCopied, setIsCopied] = useState<boolean>(false);

  if (!isOpen || !ticket) return null;

  const handleCopyBookingNum = () => {
    if (!ticket.bookingNumber) return;
    navigator.clipboard.writeText(ticket.bookingNumber);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'ktx': return { label: '🚄 KTX/기차표', color: '#0284c7', bg: '#e0f2fe' };
      case 'flight': return { label: '✈️ 항공권/탑승권', color: '#4f46e5', bg: '#e0e7ff' };
      case 'hotel': return { label: '🏨 숙소 예약 바우처', color: '#059669', bg: '#d1fae5' };
      case 'ticket': return { label: '🎡 테마파크/입장권', color: '#d97706', bg: '#fef3c7' };
      default: return { label: '🎟️ 모바일 티켓', color: '#3182f6', bg: '#e8f3ff' };
    }
  };

  const badge = getCategoryBadge(ticket.category);
  const imageUrl = ticket.imageUrl || (ticket.blob ? URL.createObjectURL(ticket.blob) : '');

  return (
    <div className="modal-backdrop" style={{ background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(10px)', zIndex: 120 }}>
      <div
        className="modal-content"
        style={{
          maxWidth: '440px',
          background: '#ffffff',
          borderRadius: '28px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* 상단 닫기 & 카테고리 헤더 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px', borderBottom: '1px solid #f1f5f9' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 800, color: badge.color, background: badge.bg, padding: '4px 10px', borderRadius: '9999px' }}>
            {badge.label}
          </span>
          <button className="btn-icon" onClick={onClose} style={{ width: '36px', height: '36px' }}>
            <X size={20} />
          </button>
        </div>

        {/* 바디: 대형 QR / 바코드 캡처 이미지 영역 (스캐너 인식 최적화) */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>
              {ticket.title}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.84rem', color: '#64748b', fontWeight: 700, marginTop: '4px' }}>
              <Calendar size={14} />
              <span>{ticket.date} {ticket.time ? `• ${ticket.time}` : ''}</span>
              {ticket.location && <span>• {ticket.location}</span>}
            </div>
          </div>

          {/* QR/바코드 이미지 카드 */}
          <div
            style={{
              width: '100%',
              minHeight: '220px',
              maxHeight: '320px',
              background: '#f8fafc',
              border: '2px solid #e2e8f0',
              borderRadius: '20px',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.03)',
            }}
          >
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="QR / Barcode Ticket"
                style={{ width: '100%', height: '100%', maxHeight: '290px', objectFit: 'contain', borderRadius: '12px' }}
              />
            ) : (
              <div style={{ padding: '30px', color: '#94a3b8' }}>
                <QrCode size={64} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                <p style={{ fontSize: '0.88rem', fontWeight: 700 }}>등록된 QR 이미지가 없습니다.</p>
                <p style={{ fontSize: '0.78rem', marginTop: '2px' }}>예약번호를 확인해 주세요.</p>
              </div>
            )}
          </div>

          {/* 예약번호 원터치 복사 */}
          {ticket.bookingNumber && (
            <div
              style={{
                width: '100%',
                background: '#f1f5f9',
                borderRadius: '16px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>예약/승차권 번호</div>
                <div style={{ fontSize: '1rem', fontWeight: 900, color: '#0f172a', letterSpacing: '0.05em' }}>
                  {ticket.bookingNumber}
                </div>
              </div>

              <button
                className="btn btn-subtle"
                style={{ padding: '8px 12px', fontSize: '0.8rem', fontWeight: 800, borderRadius: '10px' }}
                onClick={handleCopyBookingNum}
              >
                {isCopied ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
                <span>{isCopied ? '복사 완료' : '번호 복사'}</span>
              </button>
            </div>
          )}

          {ticket.memo && (
            <p style={{ fontSize: '0.84rem', color: '#475569', background: '#faf5ff', padding: '10px 14px', borderRadius: '12px', width: '100%', textAlign: 'left', lineHeight: 1.4 }}>
              💡 {ticket.memo}
            </p>
          )}
        </div>

        {/* 푸터 */}
        <div style={{ padding: '14px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'center' }}>
          <button
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '0.95rem', fontWeight: 800 }}
            onClick={onClose}
          >
            확인 완료
          </button>
        </div>
      </div>
    </div>
  );
};
