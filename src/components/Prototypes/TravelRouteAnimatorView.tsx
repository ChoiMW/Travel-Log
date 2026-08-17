import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Plane, Train, Sparkles, MapPin, Flag } from 'lucide-react';
import { Trip } from '../../types/travel';
import districtsData from '../../data/koreaDistricts.json';

const features = districtsData.features;

interface TravelRouteAnimatorViewProps {
  trips: Trip[];
}

export const TravelRouteAnimatorView: React.FC<TravelRouteAnimatorViewProps> = ({
  trips,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0); // 0 ~ 100

  // 데모 루트 경로: 서울 종로 -> 강릉 -> 전주 -> 부산
  const sampleRoutePoints = [
    { name: '서울', x: 270, y: 220, code: '11110' },
    { name: '강릉', x: 530, y: 210, code: '42150' },
    { name: '전주', x: 330, y: 550, code: '45111' },
    { name: '부산', x: 580, y: 720, code: '26380' },
  ];

  // 애니메이션 루프
  useEffect(() => {
    let animId: number;
    if (isPlaying) {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) return 0;
          return prev + 1;
        });
      }, 50);
      return () => clearInterval(interval);
    }
  }, [isPlaying]);

  // 비행기 현재 위치 계산 (4개 포인트를 지나는 베지어 곡선 보간)
  const currentPlanePos = () => {
    const totalSegments = sampleRoutePoints.length - 1;
    const segmentIndex = Math.min(Math.floor((progress / 100) * totalSegments), totalSegments - 1);
    const segmentProgress = ((progress / 100) * totalSegments) - segmentIndex;

    const p1 = sampleRoutePoints[segmentIndex];
    const p2 = sampleRoutePoints[segmentIndex + 1];

    const currentX = p1.x + (p2.x - p1.x) * segmentProgress;
    const currentY = p1.y + (p2.y - p1.y) * segmentProgress;

    // 비행기 회전각 계산
    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * (180 / Math.PI);

    return { x: currentX, y: currentY, angle };
  };

  const plane = currentPlanePos();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '800px', margin: '0 auto', paddingBottom: '80px' }}>
      {/* 상단 배너 */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
          color: 'white',
          borderRadius: '26px',
          padding: '24px 28px',
          boxShadow: '0 10px 30px rgba(2, 132, 199, 0.25)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', fontWeight: 800, color: '#bae6fd' }}>
            <Sparkles size={16} />
            <span>PROTOTYPE 4 • 3D ROUTE ANIMATOR</span>
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginTop: '4px' }}>
            비행기가 날아가는 3D 여행 루트 5초 숏폼 애니메이션
          </h2>
          <p style={{ fontSize: '0.84rem', color: '#e0f2fe', marginTop: '2px' }}>
            내 여행 이동 경로를 인디아나 존스/릴스 영상처럼 지도 위에서 생생하게 재생합니다.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn"
            style={{ background: 'white', color: '#0369a1', fontWeight: 800 }}
            onClick={() => setIsPlaying(prev => !prev)}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            <span>{isPlaying ? '일시정지' : '애니메이션 재생'}</span>
          </button>
          <button
            className="btn"
            style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}
            onClick={() => setProgress(0)}
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* 지도 위 비행기 경로 애니메이션 캔버스 */}
      <div
        style={{
          background: '#0f172a',
          borderRadius: '26px',
          overflow: 'hidden',
          position: 'relative',
          height: '560px',
          boxShadow: '0 12px 30px rgba(0,0,0,0.2)',
        }}
      >
        <svg style={{ width: '100%', height: '100%' }} viewBox="0 0 800 1000">
          {/* 대한민국 베이스 지도 */}
          <g opacity={0.4}>
            {features.map((f: any) => (
              <path key={f.properties.code} d={f.properties.path} fill="#1e293b" stroke="#334155" strokeWidth={0.5} />
            ))}
          </g>

          {/* 여행 경로 점선 (Dashed Curve Route Path) */}
          <path
            d={`M ${sampleRoutePoints[0].x} ${sampleRoutePoints[0].y} Q 400 150 ${sampleRoutePoints[1].x} ${sampleRoutePoints[1].y} Q 450 400 ${sampleRoutePoints[2].x} ${sampleRoutePoints[2].y} Q 480 650 ${sampleRoutePoints[3].x} ${sampleRoutePoints[3].y}`}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="4"
            strokeDasharray="8 8"
            style={{ filter: 'drop-shadow(0 0 8px #38bdf8)' }}
          />

          {/* 거점 도시 핀 & 깃발 */}
          {sampleRoutePoints.map((pt, idx) => (
            <g key={pt.name} transform={`translate(${pt.x}, ${pt.y})`}>
              <circle r="10" fill="#38bdf8" opacity={0.3} />
              <circle r="6" fill="#ffffff" stroke="#0284c7" strokeWidth="2" />
              <text
                y="-14"
                textAnchor="middle"
                style={{ fontSize: '13px', fontWeight: 900, fill: '#ffffff', stroke: '#0f172a', strokeWidth: '3px', paintOrder: 'stroke fill' }}
              >
                {idx + 1}. {pt.name}
              </text>
            </g>
          ))}

          {/* 날아가는 비행기 아이콘 */}
          <g
            transform={`translate(${plane.x}, ${plane.y}) rotate(${plane.angle})`}
            style={{ filter: 'drop-shadow(0 4px 12px rgba(56, 189, 248, 0.8))' }}
          >
            <circle r="18" fill="#38bdf8" />
            <path
              d="M 0 -8 L 6 8 L 0 5 L -6 8 Z"
              fill="#ffffff"
              transform="rotate(90)"
            />
          </g>
        </svg>

        {/* 하단 진행도 바 */}
        <div style={{ position: 'absolute', bottom: '20px', left: '20px', right: '20px', background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(10px)', padding: '14px 20px', borderRadius: '18px', display: 'flex', alignItems: 'center', gap: '14px', color: 'white' }}>
          <Plane size={20} color="#38bdf8" />
          <div style={{ flex: 1, background: '#334155', height: '6px', borderRadius: '9999px', overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: '#38bdf8', borderRadius: '9999px' }} />
          </div>
          <span style={{ fontSize: '0.82rem', fontWeight: 800 }}>{progress}% 완주</span>
        </div>
      </div>
    </div>
  );
};
