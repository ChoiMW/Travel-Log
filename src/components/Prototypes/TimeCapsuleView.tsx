import React, { useState } from 'react';
import { Lock, Unlock, Sparkles, Send, Calendar, Heart, Clock, Gift, ShieldAlert } from 'lucide-react';
import { Trip, PhotoItem } from '../../types/travel';

interface TimeCapsuleItem {
  id: string;
  tripTitle: string;
  location: string;
  sealedDate: string;
  openDate: string;
  secretMessage: string;
  isUnlocked: boolean;
  photoUrl?: string;
}

export const TimeCapsuleView: React.FC = () => {
  const [capsules, setCapsules] = useState<TimeCapsuleItem[]>([
    {
      id: 'c1',
      tripTitle: '부산 다대포 낙조분수 여행',
      location: '부산광역시 사하구',
      sealedDate: '2025.08.16',
      openDate: '2026.08.16 (오늘 개봉 가능!)',
      secretMessage: '1년 전 오늘, 다대포 해변에서 마셨던 시원한 밀면과 환상적인 일몰을 기억하니? 미래의 나야, 여전히 가슴 뛰는 여행을 하고 있길 바래!',
      isUnlocked: true,
      photoUrl: 'https://images.unsplash.com/photo-1578637387939-43c525550085?w=500&auto=format&fit=crop&q=60',
    },
    {
      id: 'c2',
      tripTitle: '제주 비자림 힐링 여행',
      location: '제주특별자치도 제주시',
      sealedDate: '2026.04.10',
      openDate: '2027.04.10 (D-236일)',
      secretMessage: '봉인된 비밀 메시지입니다. 2027년 4월 10일에 자동으로 열립니다.',
      isUnlocked: false,
      photoUrl: 'https://images.unsplash.com/photo-1548115184-bc6544d06a58?w=500&auto=format&fit=crop&q=60',
    },
  ]);

  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newMessage, setNewMessage] = useState('');

  const handleCreateCapsule = () => {
    if (!newTitle.trim() || !newMessage.trim()) return;
    const now = new Date();
    const openDate = new Date(now.setFullYear(now.getFullYear() + 1)).toISOString().split('T')[0];

    setCapsules(prev => [
      {
        id: `cap_${Date.now()}`,
        tripTitle: newTitle.trim(),
        location: newLocation.trim() || '대한민국 여행지',
        sealedDate: new Date().toISOString().split('T')[0],
        openDate: `${openDate} (D-365일)`,
        secretMessage: newMessage.trim(),
        isUnlocked: false,
        photoUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=500&auto=format&fit=crop&q=60',
      },
      ...prev,
    ]);

    setNewTitle('');
    setNewLocation('');
    setNewMessage('');
    setIsCreating(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '750px', margin: '0 auto', paddingBottom: '80px' }}>
      {/* 상단 배너 */}
      <div
        style={{
          background: 'linear-gradient(135deg, #831843 0%, #be185d 100%)',
          color: 'white',
          borderRadius: '26px',
          padding: '24px 28px',
          boxShadow: '0 10px 30px rgba(190, 24, 93, 0.25)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', fontWeight: 800, color: '#fbcfe8' }}>
            <Sparkles size={16} />
            <span>PROTOTYPE D • TRAVEL TIME CAPSULE</span>
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginTop: '4px' }}>
            여행지에서 묻어두는 '1년 뒤 타임캡슐'
          </h2>
          <p style={{ fontSize: '0.84rem', color: '#fce7f3', marginTop: '2px' }}>
            여행 현장의 생생한 감정과 비밀 메모를 봉인하고, 정확히 1년 뒤 오늘 열어보세요.
          </p>
        </div>

        <button
          className="btn"
          style={{ background: '#ffffff', color: '#be185d', fontWeight: 900, padding: '10px 18px', borderRadius: '16px' }}
          onClick={() => setIsCreating(prev => !prev)}
        >
          <Gift size={16} />
          <span>새 캡슐 봉인하기</span>
        </button>
      </div>

      {/* 새 캡슐 작성 폼 */}
      {isCreating && (
        <div style={{ background: 'var(--bg-surface)', padding: '24px', borderRadius: '26px', boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>💌 1년 뒤 미래의 나에게 캡슐 봉인</h3>
          <input
            type="text"
            placeholder="여행 제목 (예: 강릉 안목해변 일출 여행)"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            style={{ padding: '12px', borderRadius: '14px', border: '1px solid var(--border-subtle)', background: 'var(--bg-subtle)' }}
          />
          <input
            type="text"
            placeholder="여행 장소 (예: 강원도 강릉시)"
            value={newLocation}
            onChange={e => setNewLocation(e.target.value)}
            style={{ padding: '12px', borderRadius: '14px', border: '1px solid var(--border-subtle)', background: 'var(--bg-subtle)' }}
          />
          <textarea
            placeholder="1년 뒤 나에게 보낼 비밀 메모 (당시의 생각, 약속, 소망 등)"
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            rows={3}
            style={{ padding: '12px', borderRadius: '14px', border: '1px solid var(--border-subtle)', background: 'var(--bg-subtle)' }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button className="btn btn-subtle" onClick={() => setIsCreating(false)}>취소</button>
            <button className="btn btn-primary" style={{ background: '#be185d' }} onClick={handleCreateCapsule}>
              🔒 1년 뒤 날짜로 봉인하기
            </button>
          </div>
        </div>
      )}

      {/* 타임캡슐 목록 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {capsules.map(capsule => (
          <div
            key={capsule.id}
            style={{
              background: 'var(--bg-surface)',
              borderRadius: '26px',
              padding: '24px',
              boxShadow: 'var(--shadow-md)',
              border: capsule.isUnlocked ? '2px solid #be185d' : '1px solid var(--border-light)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {capsule.isUnlocked ? (
                  <span style={{ background: '#fce7f3', color: '#be185d', padding: '4px 10px', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Unlock size={14} /> 타임캡슐 개봉 완료!
                  </span>
                ) : (
                  <span style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)', padding: '4px 10px', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Lock size={14} /> 봉인 중 • {capsule.openDate}
                  </span>
                )}
              </div>

              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                봉인일: {capsule.sealedDate}
              </span>
            </div>

            <div>
              <h4 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-main)' }}>
                {capsule.tripTitle}
              </h4>
              <div style={{ fontSize: '0.82rem', color: '#be185d', fontWeight: 700, marginTop: '2px' }}>
                📍 {capsule.location}
              </div>
            </div>

            {/* 개봉된 캡슐 메시지 */}
            {capsule.isUnlocked ? (
              <div style={{ background: '#fdf2f8', padding: '18px', borderRadius: '18px', borderLeft: '4px solid #be185d' }}>
                <p style={{ fontSize: '0.92rem', color: '#831843', lineHeight: 1.6, fontWeight: 600 }}>
                  "{capsule.secretMessage}"
                </p>
              </div>
            ) : (
              <div style={{ background: 'var(--bg-hover)', padding: '18px', borderRadius: '18px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Lock size={24} style={{ margin: '0 auto 6px', opacity: 0.5 }} />
                <p style={{ fontSize: '0.84rem', fontWeight: 700 }}>비밀 메시지가 안전하게 봉인되어 있습니다.</p>
                <p style={{ fontSize: '0.76rem', marginTop: '2px' }}>개봉일({capsule.openDate})에 도달하면 자동으로 열립니다.</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
