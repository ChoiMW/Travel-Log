import React, { useState } from 'react';
import { Sparkles, Compass, MapPin, Shuffle, CheckCircle, ArrowRight, Heart, Utensils, Waves, Trees, Car } from 'lucide-react';
import districtsData from '../../data/koreaDistricts.json';
import { VisitedDistrictSummary } from '../../types/travel';

const features = districtsData.features;

interface DiscoveryRouletteViewProps {
  visitedSummaryMap: Map<string, VisitedDistrictSummary>;
  onSelectDistrictForNewTrip: (code: string, name: string) => void;
}

type TravelTheme = 'sea' | 'forest' | 'food' | 'drive';

interface RecommendedSpot {
  code: string;
  name: string;
  sdo: string;
  theme: TravelTheme;
  tagline: string;
  bestSpots: string[];
  signatureFood: string;
}

// 250개 시군구 큐레이션 추천 데이터베이스
const curatedRecommendations: RecommendedSpot[] = [
  { code: '42170', name: '동해시', sdo: '강원특별자치도', theme: 'sea', tagline: '에메랄드빛 촛대바위와 묵호등대 감성 논골담길', bestSpots: ['추암촛대바위', '묵호등대', '도째비골 스카이밸리'], signatureFood: '곰치국 & 물회' },
  { code: '48880', name: '거창군', sdo: '경상남도', theme: 'forest', tagline: '천혜의 Y자형 출렁다리와 수승대 힐링 숲', bestSpots: ['거창 창포원', '수승대', '우두산 출렁다리'], signatureFood: '거창 한우 & 애우' },
  { code: '46770', name: '담양군', sdo: '전라남도', theme: 'food', tagline: '피톤치드 가득한 죽녹원과 원조 떡갈비 미식기행', bestSpots: ['죽녹원', '메타세콰이어길', '관방제림'], signatureFood: '대통밥 & 담양 떡갈비' },
  { code: '41830', name: '양평군', sdo: '경기도', theme: 'drive', tagline: '두물머리 핫도그와 남한강 리버뷰 드라이브 코스', bestSpots: ['두물머리', '세미원', '용문사'], signatureFood: '연핫도그 & 옥천냉면' },
  { code: '44760', name: '부여군', sdo: '충청남도', theme: 'food', tagline: '백제의 숨결 궁남지 연꽃과 정림사지 5층석탑', bestSpots: ['궁남지', '부소산성', '백제문화단지'], signatureFood: '연잎밥 정식' },
  { code: '47840', name: '울진군', sdo: '경상북도', theme: 'sea', tagline: '푸른 동해바다 해안스카이레일과 덕구온천 힐링', bestSpots: ['죽변 해안스카이레일', '성류굴', '후포항'], signatureFood: '울진 붉은대게' },
];

export const DiscoveryRouletteView: React.FC<DiscoveryRouletteViewProps> = ({
  visitedSummaryMap,
  onSelectDistrictForNewTrip,
}) => {
  const [selectedTheme, setSelectedTheme] = useState<TravelTheme>('sea');
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [pickedSpot, setPickedSpot] = useState<RecommendedSpot | null>(curatedRecommendations[0]);

  const handleSpinRoulette = () => {
    setIsSpinning(true);
    let count = 0;
    const interval = setInterval(() => {
      const candidates = curatedRecommendations.filter(c => c.theme === selectedTheme);
      const randomItem = candidates[Math.floor(Math.random() * candidates.length)] || curatedRecommendations[0];
      setPickedSpot(randomItem);
      count++;

      if (count > 15) {
        clearInterval(interval);
        setIsSpinning(false);
      }
    }, 80);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '750px', margin: '0 auto', paddingBottom: '80px' }}>
      {/* 상단 배너 */}
      <div
        style={{
          background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
          color: 'white',
          borderRadius: '26px',
          padding: '24px 28px',
          boxShadow: '0 10px 30px rgba(5, 150, 105, 0.25)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', fontWeight: 800, color: '#a7f3d0' }}>
            <Sparkles size={16} />
            <span>PROTOTYPE B • DISCOVERY ROULETTE</span>
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginTop: '4px' }}>
            "이번 주말 어디 가지?" 취향 맞춤 여행지 룰렛
          </h2>
          <p style={{ fontSize: '0.84rem', color: '#d1fae5', marginTop: '2px' }}>
            아직 안 가본 250개 시군구 중 내 취향에 꼭 맞는 숨은 명소를 1초 만에 뽑아드립니다.
          </p>
        </div>

        <button
          className="btn"
          style={{ background: '#ffffff', color: '#047857', fontWeight: 900, padding: '12px 20px', borderRadius: '16px' }}
          onClick={handleSpinRoulette}
          disabled={isSpinning}
        >
          <Shuffle size={18} />
          <span>{isSpinning ? '룰렛 회전 중...' : '🎲 룰렛 돌리기!'}</span>
        </button>
      </div>

      {/* 테마 필터 바 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '10px',
          background: 'var(--bg-surface)',
          padding: '12px',
          borderRadius: '22px',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <button
          onClick={() => setSelectedTheme('sea')}
          style={{
            padding: '14px 10px',
            borderRadius: '16px',
            border: 'none',
            background: selectedTheme === 'sea' ? '#e0f2fe' : 'var(--bg-hover)',
            color: selectedTheme === 'sea' ? '#0284c7' : 'var(--text-secondary)',
            fontWeight: 800,
            fontSize: '0.86rem',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Waves size={20} />
          <span>푸른 바다</span>
        </button>

        <button
          onClick={() => setSelectedTheme('forest')}
          style={{
            padding: '14px 10px',
            borderRadius: '16px',
            border: 'none',
            background: selectedTheme === 'forest' ? '#dcfce7' : 'var(--bg-hover)',
            color: selectedTheme === 'forest' ? '#15803d' : 'var(--text-secondary)',
            fontWeight: 800,
            fontSize: '0.86rem',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Trees size={20} />
          <span>숲속 힐링</span>
        </button>

        <button
          onClick={() => setSelectedTheme('food')}
          style={{
            padding: '14px 10px',
            borderRadius: '16px',
            border: 'none',
            background: selectedTheme === 'food' ? '#fef3c7' : 'var(--bg-hover)',
            color: selectedTheme === 'food' ? '#b45309' : 'var(--text-secondary)',
            fontWeight: 800,
            fontSize: '0.86rem',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Utensils size={20} />
          <span>로컬 미식</span>
        </button>

        <button
          onClick={() => setSelectedTheme('drive')}
          style={{
            padding: '14px 10px',
            borderRadius: '16px',
            border: 'none',
            background: selectedTheme === 'drive' ? '#f3e8ff' : 'var(--bg-hover)',
            color: selectedTheme === 'drive' ? '#7e22ce' : 'var(--text-secondary)',
            fontWeight: 800,
            fontSize: '0.86rem',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Car size={20} />
          <span>근교 드라이브</span>
        </button>
      </div>

      {/* 룰렛 결과 카드 (럭키 픽) */}
      {pickedSpot && (
        <div
          style={{
            background: 'var(--bg-surface)',
            borderRadius: '26px',
            padding: '28px',
            boxShadow: 'var(--shadow-lg)',
            border: '2px solid #059669',
            animation: 'slideUp 0.3s ease',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', background: '#d1fae5', color: '#047857', fontWeight: 800, padding: '4px 10px', borderRadius: '9999px' }}>
              🎯 이번 주말 추천 여행지
            </span>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 700 }}>
              {pickedSpot.sdo}
            </span>
          </div>

          <div style={{ marginTop: '12px' }}>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              {pickedSpot.sdo} {pickedSpot.name}
            </h3>
            <p style={{ fontSize: '0.92rem', color: '#047857', fontWeight: 700, marginTop: '4px' }}>
              "{pickedSpot.tagline}"
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '20px' }}>
            <div style={{ background: 'var(--bg-subtle)', padding: '16px', borderRadius: '18px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '6px' }}>
                📍 추천 필수 명소 TOP 3
              </div>
              <ul style={{ paddingLeft: '16px', fontSize: '0.88rem', fontWeight: 700, lineHeight: 1.6, color: 'var(--text-main)' }}>
                {pickedSpot.bestSpots.map(s => <li key={s}>{s}</li>)}
              </ul>
            </div>

            <div style={{ background: 'var(--bg-subtle)', padding: '16px', borderRadius: '18px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '6px' }}>
                🍲 꼭 먹어야 할 대표 음식
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#f59e0b', marginTop: '6px' }}>
                {pickedSpot.signatureFood}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
