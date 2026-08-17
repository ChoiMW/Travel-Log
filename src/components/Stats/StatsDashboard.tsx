import React, { useMemo } from 'react';
import { Award, Compass, MapPin, Calendar, Image as ImageIcon, TrendingUp, CheckCircle2, Sparkles, Heart, Activity, Flame } from 'lucide-react';
import { Trip, PhotoItem, VisitedDistrictSummary, DistrictGeoJSONFeature } from '../../types/travel';
import districtsData from '../../data/koreaDistricts.json';
import { sdoList } from '../../utils/geoMatcher';

const features = (districtsData.features as unknown) as DistrictGeoJSONFeature[];

interface StatsDashboardProps {
  trips: Trip[];
  photos: PhotoItem[];
  visitedSummaryMap: Map<string, VisitedDistrictSummary>;
}

export const StatsDashboard: React.FC<StatsDashboardProps> = ({
  trips,
  photos,
  visitedSummaryMap,
}) => {
  const totalDistrictsCount = features.length;
  const visitedDistrictsCount = visitedSummaryMap.size;
  const conquestRate = totalDistrictsCount > 0 ? (visitedDistrictsCount / totalDistrictsCount) * 100 : 0;

  // 광역시도별 통계 계산
  const sdoStats = useMemo(() => {
    return sdoList.map(sdoName => {
      const sdoDistricts = features.filter(f => f.properties.sdoName === sdoName);
      const totalInSdo = sdoDistricts.length;
      const visitedInSdo = sdoDistricts.filter(f => visitedSummaryMap.has(f.properties.code)).length;
      const percent = totalInSdo > 0 ? (visitedInSdo / totalInSdo) * 100 : 0;

      return {
        sdoName,
        total: totalInSdo,
        visited: visitedInSdo,
        percent,
      };
    }).sort((a, b) => b.percent - a.percent || b.visited - a.visited);
  }, [visitedSummaryMap]);

  // 성취 레벨 및 칭호
  const userRank = useMemo(() => {
    if (visitedDistrictsCount >= 100) return { title: '대한민국 국토대장정 마스터', icon: '👑', desc: '전국의 절반 가까이를 섭렵한 진정한 여행의 신!' };
    if (visitedDistrictsCount >= 50) return { title: '전국 방방곡곡 마스터', icon: '🏆', desc: '50곳 이상의 시·군·구를 정복한 베테랑 여행자!' };
    if (visitedDistrictsCount >= 20) return { title: '열정의 국내여행 탐험가', icon: '🧭', desc: '20곳 이상을 누비며 지도를 풍성하게 채우는 중!' };
    if (visitedDistrictsCount >= 5) return { title: '설레는 여행 모험가', icon: '✈️', desc: '본격적으로 전국 지도를 색칠하기 시작했어요!' };
    if (visitedDistrictsCount >= 1) return { title: '첫 발을 뗀 여행 꿈나무', icon: '🌱', desc: '첫 번째 기록을 남기며 여행의 시작을 알렸습니다.' };
    return { title: '여행을 준비하는 방랑자', icon: '🗺️', desc: '첫 여행을 기록하고 전국 지도를 채워보세요!' };
  }, [visitedDistrictsCount]);

  // ==========================================
  // [신규 2단계] AI 여행 DNA & 성향 분석 (Persona)
  // ==========================================
  const personaAnalysis = useMemo(() => {
    const tagCountMap: Record<string, number> = {};
    let totalTags = 0;

    trips.forEach(t => {
      (t.tags || []).forEach(tag => {
        tagCountMap[tag] = (tagCountMap[tag] || 0) + 1;
        totalTags++;
      });
    });

    const topTag = Object.entries(tagCountMap).sort((a, b) => b[1] - a[1])[0]?.[0];

    // 계절별 여행 수
    const seasonCounts = { spring: 0, summer: 0, autumn: 0, winter: 0 };
    trips.forEach(t => {
      const month = parseInt((t.startDate || '').split('-')[1], 10);
      if (month >= 3 && month <= 5) seasonCounts.spring++;
      else if (month >= 6 && month <= 8) seasonCounts.summer++;
      else if (month >= 9 && month <= 11) seasonCounts.autumn++;
      else if (month === 12 || month <= 2) seasonCounts.winter++;
    });

    if (topTag === '맛집탐방') {
      return {
        name: '로컬 미식 탐험가',
        tagline: '전국 팔도 숨은 맛집을 찾아 떠나는 미식 기행파',
        badge: '🍲',
        color: '#f59e0b',
        bg: '#fef3c7',
        topTag: '맛집탐방',
        seasonCounts,
      };
    } else if (topTag === '자연/풍경' || topTag === '힐링') {
      return {
        name: '피톤치드 힐링 러버',
        tagline: '바다와 숲속 자연에서 온전한 쉼을 찾는 힐링파',
        badge: '🌲',
        color: '#10b981',
        bg: '#d1fae5',
        topTag: topTag || '자연/풍경',
        seasonCounts,
      };
    } else if (topTag === '드라이브' || topTag === '액티비티') {
      return {
        name: '로드트립 어드벤처러',
        tagline: '해안도로 드라이브와 짜릿한 체험을 즐기는 활동파',
        badge: '🚗',
        color: '#3182f6',
        bg: '#e0f2fe',
        topTag: topTag || '드라이브',
        seasonCounts,
      };
    } else {
      return {
        name: '낭만적인 감성 여행자',
        tagline: '발길 닿는 곳마다 나만의 추억과 사진을 남기는 여행자',
        badge: '✨',
        color: '#8b5cf6',
        bg: '#f3e8ff',
        topTag: '감성여행',
        seasonCounts,
      };
    }
  }, [trips]);

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '80px' }}>
      {/* 상단 타이틀 */}
      <div>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
          나의 여행 통계 및 달성도
        </h2>
        <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
          전국 250개 시·군·구 방문 현황과 여행 DNA 분석 리포트
        </p>
      </div>

      {/* 랭크 & 전국 정복률 메인 카드 */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          color: 'white',
          boxShadow: 'var(--shadow-lg)',
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ fontSize: '3rem', background: 'rgba(255,255,255,0.1)', width: '70px', height: '70px', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {userRank.icon}
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>현재 여행 칭호</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#38bdf8', marginTop: '2px' }}>
                {userRank.title}
              </h3>
              <p style={{ fontSize: '0.82rem', color: '#cbd5e1', marginTop: '4px' }}>{userRank.desc}</p>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>전국 정복률</div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#10b981' }}>
              {conquestRate.toFixed(1)}%
            </div>
            <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
              <b>{visitedDistrictsCount}</b> / {totalDistrictsCount} 개 시·군·구
            </div>
          </div>
        </div>

        {/* 대형 프로그레스 바 */}
        <div style={{ background: 'rgba(255, 255, 255, 0.1)', height: '12px', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${Math.min(conquestRate, 100)}%`,
              background: 'linear-gradient(90deg, #3b82f6 0%, #10b981 100%)',
              borderRadius: 'var(--radius-full)',
              transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />
        </div>
      </div>

      {/* [신규 2단계] AI 여행 DNA 페르소나 카드 */}
      <div
        style={{
          background: 'var(--bg-surface)',
          borderRadius: '24px',
          padding: '24px',
          boxShadow: 'var(--shadow-md)',
          border: `2px solid ${personaAnalysis.color}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ fontSize: '2.8rem', background: personaAnalysis.bg, width: '64px', height: '64px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {personaAnalysis.badge}
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: personaAnalysis.color, background: personaAnalysis.bg, padding: '3px 8px', borderRadius: '6px' }}>
              TRAVEL DNA REPORT
            </span>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-main)', marginTop: '4px' }}>
              {personaAnalysis.name}
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              "{personaAnalysis.tagline}"
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', fontSize: '0.82rem', fontWeight: 700 }}>
          <div style={{ background: 'var(--bg-subtle)', padding: '10px 14px', borderRadius: '14px', textAlign: 'center' }}>
            <div style={{ color: 'var(--text-muted)' }}>🌸 봄</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-main)', marginTop: '2px' }}>{personaAnalysis.seasonCounts.spring}회</div>
          </div>
          <div style={{ background: 'var(--bg-subtle)', padding: '10px 14px', borderRadius: '14px', textAlign: 'center' }}>
            <div style={{ color: 'var(--text-muted)' }}>🌊 여름</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-main)', marginTop: '2px' }}>{personaAnalysis.seasonCounts.summer}회</div>
          </div>
          <div style={{ background: 'var(--bg-subtle)', padding: '10px 14px', borderRadius: '14px', textAlign: 'center' }}>
            <div style={{ color: 'var(--text-muted)' }}>🍁 가을</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-main)', marginTop: '2px' }}>{personaAnalysis.seasonCounts.autumn}회</div>
          </div>
          <div style={{ background: 'var(--bg-subtle)', padding: '10px 14px', borderRadius: '14px', textAlign: 'center' }}>
            <div style={{ color: 'var(--text-muted)' }}>❄️ 겨울</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-main)', marginTop: '2px' }}>{personaAnalysis.seasonCounts.winter}회</div>
          </div>
        </div>
      </div>

      {/* 3가지 요약 지표 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div style={{ background: 'var(--bg-surface)', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--primary)', marginBottom: '8px' }}>
            <Compass size={22} />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>총 여행 기록</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{trips.length}회</div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '4px' }}>누적 다이어리 작성 수</div>
        </div>

        <div style={{ background: 'var(--bg-surface)', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#10b981', marginBottom: '8px' }}>
            <MapPin size={22} />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>정복한 시·군·구</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{visitedDistrictsCount}곳</div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '4px' }}>색칠 완료된 행정구역</div>
        </div>

        <div style={{ background: 'var(--bg-surface)', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#f59e0b', marginBottom: '8px' }}>
            <ImageIcon size={22} />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>보관된 사진</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{photos.length}장</div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '4px' }}>EXIF 위치/날짜 분석 완료</div>
        </div>
      </div>

      {/* 광역시도별 방문율 차트 */}
      <div style={{ background: 'var(--bg-surface)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingUp size={18} style={{ color: 'var(--primary)' }} />
          <span>광역시·도별 여행 정복 랭킹</span>
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
          {sdoStats.map(stat => (
            <div
              key={stat.sdoName}
              style={{
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>{stat.sdoName}</span>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: stat.visited > 0 ? 'var(--primary)' : 'var(--text-muted)' }}>
                  {stat.visited} / {stat.total} 곳 ({stat.percent.toFixed(0)}%)
                </span>
              </div>

              <div style={{ background: 'var(--border-light)', height: '6px', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${stat.percent}%`,
                    background: stat.percent === 100 ? '#10b981' : '#3b82f6',
                    borderRadius: 'var(--radius-full)',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
