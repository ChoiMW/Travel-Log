import React, { useMemo } from 'react';
import { Award, Compass, MapPin, Calendar, Image as ImageIcon, TrendingUp, CheckCircle2, Sparkles, Heart, Activity, Flame } from 'lucide-react';
import { Trip, PhotoItem, VisitedDistrictSummary, DistrictGeoJSONFeature, CountryCode } from '../../types/travel';
import districtsData from '../../data/koreaDistricts.json';
import japanData from '../../data/japanPrefectures.json';
import { sdoList } from '../../utils/geoMatcher';

const krFeatures = (districtsData.features as unknown) as DistrictGeoJSONFeature[];
const jpFeatures = japanData.features;

const JAPAN_REGIONS = [
  '간토 지방',
  '간사이 지방',
  '규슈 지방',
  '홋카이도 지방',
  '주부 지방',
  '도호쿠 지방',
  '주고쿠 지방',
  '시코쿠 지방',
];

interface StatsDashboardProps {
  country?: CountryCode;
  trips: Trip[];
  photos: PhotoItem[];
  visitedSummaryMap: Map<string, VisitedDistrictSummary>;
}

export const StatsDashboard: React.FC<StatsDashboardProps> = ({
  country = 'KR',
  trips,
  photos,
  visitedSummaryMap,
}) => {
  const isJapan = country === 'JP';
  const totalDistrictsCount = isJapan ? 47 : krFeatures.length;
  const visitedDistrictsCount = visitedSummaryMap.size;
  const conquestRate = totalDistrictsCount > 0 ? (visitedDistrictsCount / totalDistrictsCount) * 100 : 0;

  // 지역별/지방별 통계 계산
  const regionStats = useMemo(() => {
    if (isJapan) {
      return JAPAN_REGIONS.map(regName => {
        const regDistricts = jpFeatures.filter(f => f.properties.regionName === regName);
        const total = regDistricts.length;
        const visited = regDistricts.filter(f => visitedSummaryMap.has(f.properties.code)).length;
        const percent = total > 0 ? (visited / total) * 100 : 0;
        return {
          name: regName,
          total,
          visited,
          percent,
        };
      }).sort((a, b) => b.percent - a.percent || b.visited - a.visited);
    } else {
      return sdoList.map(sdoName => {
        const sdoDistricts = krFeatures.filter(f => f.properties.sdoName === sdoName);
        const totalInSdo = sdoDistricts.length;
        const visitedInSdo = sdoDistricts.filter(f => visitedSummaryMap.has(f.properties.code)).length;
        const percent = totalInSdo > 0 ? (visitedInSdo / totalInSdo) * 100 : 0;

        return {
          name: sdoName,
          total: totalInSdo,
          visited: visitedInSdo,
          percent,
        };
      }).sort((a, b) => b.percent - a.percent || b.visited - a.visited);
    }
  }, [visitedSummaryMap, isJapan]);

  // 성취 레벨 및 칭호
  const userRank = useMemo(() => {
    if (isJapan) {
      if (visitedDistrictsCount >= 30) return { title: '일본 열도 종단 마스터', icon: '👑', desc: '일본 47개 도도부현의 과반을 섭렵한 진정한 여행 마스터!' };
      if (visitedDistrictsCount >= 15) return { title: '일본 방방곡곡 탐험가', icon: '🏆', desc: '15곳 이상의 도도부현을 누빈 베테랑 일본 여행자!' };
      if (visitedDistrictsCount >= 5) return { title: '규슈 & 간사이 핫플러', icon: '🚄', desc: '도쿄, 오사카, 후쿠오카를 중심으로 일본을 넓혀가는 중!' };
      if (visitedDistrictsCount >= 1) return { title: '설레는 일본 첫걸음', icon: '🗾', desc: '첫 번째 일본 여행 기록을 성공적으로 남겼습니다.' };
      return { title: '일본 여행을 꿈꾸는 방랑자', icon: '✈️', desc: '후쿠오카, 도쿄, 오사카 등 첫 일본 여행을 기록해보세요!' };
    } else {
      if (visitedDistrictsCount >= 100) return { title: '대한민국 국토대장정 마스터', icon: '👑', desc: '전국의 절반 가까이를 섭렵한 진정한 여행의 신!' };
      if (visitedDistrictsCount >= 50) return { title: '전국 방방곡곡 마스터', icon: '🏆', desc: '50곳 이상의 시·군·구를 정복한 베테랑 여행자!' };
      if (visitedDistrictsCount >= 20) return { title: '열정의 국내여행 탐험가', icon: '🧭', desc: '20곳 이상을 누비며 지도를 풍성하게 채우는 중!' };
      if (visitedDistrictsCount >= 5) return { title: '설레는 여행 모험가', icon: '✈️', desc: '본격적으로 전국 지도를 색칠하기 시작했어요!' };
      if (visitedDistrictsCount >= 1) return { title: '첫 발을 뗀 여행 꿈나무', icon: '🌱', desc: '첫 번째 기록을 남기며 여행의 시작을 알렸습니다.' };
      return { title: '여행을 준비하는 방랑자', icon: '🗺️', desc: '첫 여행을 기록하고 전국 지도를 채워보세요!' };
    }
  }, [visitedDistrictsCount, isJapan]);

  // AI 여행 DNA & 성향 분석 (Persona)
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
        name: isJapan ? '후쿠오카 & 도쿄 미식 탐험가' : '로컬 미식 탐험가',
        tagline: isJapan ? '라멘, 스시, 야키니쿠 등 현지 찐맛집을 정복하는 미식가' : '전국 팔도 숨은 맛집을 찾아 떠나는 미식 기행파',
        badge: '🍜',
        color: '#f59e0b',
        bg: '#fef3c7',
        topTag: '맛집탐방',
        seasonCounts,
      };
    } else if (topTag === '자연/풍경' || topTag === '힐링') {
      return {
        name: isJapan ? '온천 & 료칸 힐링 러버' : '피톤치드 힐링 러버',
        tagline: isJapan ? '유후인/벳푸 온천과 후지산 절경에서 온전한 쉼을 찾는 힐링파' : '바다와 숲속 자연에서 온전한 쉼을 찾는 힐링파',
        badge: '♨️',
        color: '#10b981',
        bg: '#d1fae5',
        topTag: topTag || '힐링',
        seasonCounts,
      };
    } else if (topTag === '쇼핑' || topTag === '액티비티') {
      return {
        name: isJapan ? '돈키호테 & 핫플 어드벤처러' : '로드트립 어드벤처러',
        tagline: isJapan ? '텐진 지하상가, 시부야, 테마파크를 종횡무진 누비는 트렌드세터' : '해안도로 드라이브와 짜릿한 체험을 즐기는 활동파',
        badge: '🛍️',
        color: '#3b82f6',
        bg: '#dbeafe',
        topTag: topTag || '쇼핑',
        seasonCounts,
      };
    }

    return {
      name: isJapan ? '낭만 일본 여행자' : '낭만 여행자',
      tagline: '일상에서 벗어나 새로운 풍경과 소중한 추억을 아카이빙하는 감성파',
      badge: '✨',
      color: isJapan ? '#f43f5e' : '#ec4899',
      bg: isJapan ? '#fff1f2' : '#fce7f3',
      topTag: '자유여행',
      seasonCounts,
    };
  }, [trips, isJapan]);

  const brandColor = isJapan ? '#f43f5e' : '#3182f6';

  return (
    <div className="stats-dashboard" style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '60px' }}>
      {/* 1. 최상단 마스터 정복 칭호 카드 */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          color: 'white',
          borderRadius: '28px',
          padding: '28px',
          boxShadow: '0 12px 30px rgba(0, 0, 0, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} style={{ color: '#fbbf24' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.05em' }}>
              {isJapan ? 'TRAVEL LOG JAPAN RATING' : 'TRAVEL LOG KOREA RATING'}
            </span>
          </div>
          <span style={{ fontSize: '0.8rem', background: 'rgba(255, 255, 255, 0.1)', padding: '4px 10px', borderRadius: '9999px' }}>
            {isJapan ? '일본 47개 도도부현 기준' : '전국 250개 시군구 기준'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ fontSize: '3rem', background: 'rgba(255, 255, 255, 0.1)', width: '72px', height: '72px', borderRadius: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {userRank.icon}
          </div>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#ffffff' }}>
              {userRank.title}
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '4px' }}>
              {userRank.desc}
            </p>
          </div>
        </div>

        {/* 대형 프로그레스 바 */}
        <div style={{ marginTop: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', fontWeight: 800, marginBottom: '8px' }}>
            <span>{isJapan ? '일본 정복률' : '전국 정복률'}</span>
            <span style={{ color: brandColor }}>
              {visitedDistrictsCount} / {totalDistrictsCount} ({conquestRate.toFixed(1)}%)
            </span>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.15)', height: '12px', borderRadius: '9999px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${Math.min(conquestRate, 100)}%`,
                height: '100%',
                background: brandColor,
                borderRadius: '9999px',
                transition: 'width 1s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            />
          </div>
        </div>
      </div>

      {/* 2. AI 여행 페르소나 리포트 카드 */}
      <div
        style={{
          background: 'var(--bg-surface)',
          borderRadius: '26px',
          padding: '26px',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--border-light)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Flame size={20} style={{ color: personaAnalysis.color }} />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
            나의 {isJapan ? '일본' : '국내'} 여행 성향 분석
          </h3>
        </div>

        <div
          style={{
            background: personaAnalysis.bg,
            borderRadius: '20px',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div style={{ fontSize: '2.5rem' }}>{personaAnalysis.badge}</div>
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: personaAnalysis.color }}>
              {personaAnalysis.name}
            </div>
            <div style={{ fontSize: '0.84rem', color: '#475569', marginTop: '2px', fontWeight: 600 }}>
              {personaAnalysis.tagline}
            </div>
          </div>
        </div>
      </div>

      {/* 3. 지역별 세부 정복 통계 */}
      <div
        style={{
          background: 'var(--bg-surface)',
          borderRadius: '26px',
          padding: '26px',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--border-light)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {isJapan ? '8대 지방별 정복 현황' : '17개 광역시·도별 정복 현황'}
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>정복률 순</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
          {regionStats.map(reg => (
            <div
              key={reg.name}
              style={{
                background: 'var(--bg-subtle)',
                borderRadius: '16px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                  {reg.name}
                </span>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: brandColor }}>
                  {reg.visited} / {reg.total} ({reg.percent.toFixed(0)}%)
                </span>
              </div>

              <div style={{ background: 'var(--bg-hover)', height: '6px', borderRadius: '9999px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${reg.percent}%`,
                    height: '100%',
                    background: reg.percent === 100 ? '#10b981' : brandColor,
                    borderRadius: '9999px',
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
