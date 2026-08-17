import React, { useState } from 'react';
import { Award, CheckCircle2, Lock, Sparkles, MapPin, Compass, ShieldCheck, Flame, ChevronRight, Trophy } from 'lucide-react';
import { Trip, VisitedDistrictSummary } from '../../types/travel';

interface QuestStampRPGViewProps {
  trips: Trip[];
  visitedSummaryMap: Map<string, VisitedDistrictSummary>;
  onSelectQuest: (questTitle: string) => void;
}

interface QuestItem {
  id: string;
  title: string;
  category: string;
  description: string;
  requiredCodes: string[];
  requiredNames: string[];
  rewardBadge: string;
  rewardExp: number;
}

const sampleQuests: QuestItem[] = [
  {
    id: 'q1',
    title: '🌊 7번 국도 동해안 종주',
    category: '로드 트립',
    description: '강원도 강릉부터 부산 해운대까지 낭만 넘치는 동해안 바닷길 종주',
    requiredCodes: ['42150', '42170', '42230', '47111', '31140', '26350'],
    requiredNames: ['강릉시', '동해시', '삼척시', '포항시', '울산 남구', '부산 해운대구'],
    rewardBadge: '🌊 동해안 마스터 칭호',
    rewardExp: 500,
  },
  {
    id: 'q2',
    title: '🍲 전라도 5대 미식 성지 도장깨기',
    category: '미식 탐험',
    description: '비빔밥, 떡갈비, 꼬막정식! 대한민국 맛의 본고장 5곳 정복',
    requiredCodes: ['45111', '46130', '46150', '46770', '46810'],
    requiredNames: ['전주시', '여수시', '순천시', '담양군', '보성군'],
    rewardBadge: '🍲 전라도 미식가 뱃지',
    rewardExp: 450,
  },
  {
    id: 'q3',
    title: '🏰 한양 5대 궁궐 & 수도권 정복',
    category: '역사 문화',
    description: '조선 600년 역사의 중심 서울 종로와 수도권 핵심 지역 정복',
    requiredCodes: ['11110', '11140', '11170', '41110', '41130'],
    requiredNames: ['서울 종로구', '서울 중구', '서울 용산구', '수원시', '성남시'],
    rewardBadge: '🏰 한양 수호자 골드 뱃지',
    rewardExp: 400,
  },
  {
    id: 'q4',
    title: '🌴 제주 아일랜드 4개 권역 정복',
    category: '섬 여행',
    description: '돌하르방과 푸른 바다의 섬, 제주시와 서귀포시 전역 완주',
    requiredCodes: ['50110', '50130'],
    requiredNames: ['제주시', '서귀포시'],
    rewardBadge: '🌴 제주 탐험왕 칭호',
    rewardExp: 300,
  },
];

// 250개 시군구 대표 스탬프 일러스트 샘플
const sampleStamps = [
  { code: '26380', name: '부산 사하구', icon: '🌅', sub: '다대포 낙조분수' },
  { code: '11680', name: '서울 강남구', icon: '🏙️', sub: '스타필드 코엑스' },
  { code: '45111', name: '전북 전주시', icon: '🍲', sub: '전주비빔밥' },
  { code: '42150', name: '강원 강릉시', icon: '☕', sub: '안목해변 커피' },
  { code: '50110', name: '제주 제주시', icon: '🗿', sub: '제주 돌하르방' },
  { code: '47130', name: '경북 경주시', icon: '🏮', sub: '첨성대 & 불국사' },
  { code: '41135', name: '경기 성남시', icon: '💻', sub: '판교 테크노밸리' },
  { code: '46130', name: '전남 여수시', icon: '⚓', sub: '여수 밤바다' },
];

export const QuestStampRPGView: React.FC<QuestStampRPGViewProps> = ({
  trips,
  visitedSummaryMap,
}) => {
  const visitedCount = visitedSummaryMap.size;
  const userLevel = Math.min(Math.floor(visitedCount / 3) + 1, 99);
  const totalExp = visitedCount * 100;
  const nextLevelExp = userLevel * 300;
  const expPercent = Math.min(((totalExp % 300) / 300) * 100, 100).toFixed(0);

  const getLevelTitle = (lvl: number) => {
    if (lvl >= 10) return '👑 대동여지도 김정호';
    if (lvl >= 7) return '🧭 대한민국 대탐험가';
    if (lvl >= 4) return '🎒 전국구 방랑 여행자';
    if (lvl >= 2) return '🚶 길 위의 나그네';
    return '🌱 새싹 여행자';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '850px', margin: '0 auto', paddingBottom: '70px' }}>
      {/* 1. 상단 RPG 캐릭터 프로필 카드 */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: 'white',
          borderRadius: '26px',
          padding: '28px',
          boxShadow: '0 12px 30px rgba(15, 23, 42, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 20px rgba(245, 158, 11, 0.4)',
              }}
            >
              <Trophy size={32} color="white" />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.8rem', background: '#3b82f6', color: 'white', fontWeight: 800, padding: '2px 8px', borderRadius: '6px' }}>
                  LV. {userLevel}
                </span>
                <span style={{ fontSize: '0.86rem', color: '#94a3b8', fontWeight: 700 }}>
                  {getLevelTitle(userLevel)}
                </span>
              </div>
              <h1 style={{ fontSize: '1.7rem', fontWeight: 900, marginTop: '4px', letterSpacing: '-0.02em' }}>
                대한민국 탐험가 도감
              </h1>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#f59e0b' }}>
              {visitedCount} <span style={{ fontSize: '1rem', color: '#94a3b8' }}>/ 250 스탬프</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>총 획득 경험치: {totalExp} EXP</div>
          </div>
        </div>

        {/* EXP 게이지 */}
        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: '#94a3b8', marginBottom: '6px' }}>
            <span>다음 레벨 (Lv.{userLevel + 1})까지</span>
            <span>{expPercent}%</span>
          </div>
          <div style={{ background: '#334155', height: '8px', borderRadius: '9999px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${expPercent}%`,
                background: 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)',
                borderRadius: '9999px',
                boxShadow: '0 0 10px rgba(245, 158, 11, 0.5)',
              }}
            />
          </div>
        </div>
      </div>

      {/* 2. 테마별 완주 퀘스트 (도장깨기) */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <Flame size={20} color="#ef4444" />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
            진행 중인 테마별 완주 퀘스트
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '14px' }}>
          {sampleQuests.map(quest => {
            const completedCount = quest.requiredCodes.filter(c => visitedSummaryMap.has(c)).length;
            const isCompleted = completedCount === quest.requiredCodes.length;
            const progress = ((completedCount / quest.requiredCodes.length) * 100).toFixed(0);

            return (
              <div
                key={quest.id}
                style={{
                  background: 'var(--bg-surface)',
                  borderRadius: '22px',
                  padding: '20px',
                  border: isCompleted ? '2px solid #22c55e' : '1px solid var(--border-light)',
                  boxShadow: 'var(--shadow-md)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#3182f6', background: '#e8f3ff', padding: '3px 8px', borderRadius: '8px' }}>
                      {quest.category}
                    </span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: isCompleted ? '#22c55e' : 'var(--text-muted)' }}>
                      {isCompleted ? '✓ 퀘스트 완주!' : `${completedCount}/${quest.requiredCodes.length} 완료`}
                    </span>
                  </div>

                  <h4 style={{ fontSize: '1.05rem', fontWeight: 800, marginTop: '8px', color: 'var(--text-main)' }}>
                    {quest.title}
                  </h4>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.4 }}>
                    {quest.description}
                  </p>
                </div>

                {/* 퀘스트 진행도 바 */}
                <div>
                  <div style={{ background: 'var(--bg-hover)', height: '8px', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${progress}%`,
                        background: isCompleted ? '#22c55e' : '#3182f6',
                        borderRadius: '9999px',
                        transition: 'width 0.5s ease',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', fontSize: '0.78rem' }}>
                    <span style={{ color: '#f59e0b', fontWeight: 700 }}>
                      🎁 보상: {quest.rewardBadge}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
                      +{quest.rewardExp} EXP
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. 250개 시군구 고유 레트로 일러스트 도장 수집함 */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={20} color="#f59e0b" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
              지역별 시그니처 스탬프 수집함
            </h3>
          </div>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 700 }}>
            {visitedCount}개 도장 활성화됨
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px' }}>
          {sampleStamps.map(stamp => {
            const isUnlocked = visitedSummaryMap.has(stamp.code);

            return (
              <div
                key={stamp.code}
                style={{
                  background: 'var(--bg-surface)',
                  borderRadius: '20px',
                  padding: '16px 12px',
                  textAlign: 'center',
                  border: isUnlocked ? '2px solid #f59e0b' : '1px dashed var(--border-subtle)',
                  boxShadow: isUnlocked ? '0 6px 18px rgba(245, 158, 11, 0.15)' : 'none',
                  opacity: isUnlocked ? 1 : 0.45,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    background: isUnlocked ? '#fffbeb' : 'var(--bg-hover)',
                    border: isUnlocked ? '2px solid #f59e0b' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                  }}
                >
                  {isUnlocked ? stamp.icon : <Lock size={18} color="var(--text-muted)" />}
                </div>

                <div style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {stamp.name}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  {stamp.sub}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
