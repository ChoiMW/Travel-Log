import React, { useState, useRef, useEffect } from 'react';
import { Download, Upload, ShieldCheck, Smartphone, RefreshCw, Trash2, CheckCircle2, AlertTriangle, FileArchive, FileText, Sparkles, HardDrive, Database, X } from 'lucide-react';
import { exportToJson, exportToZip, importFromJson, importFromZip } from '../../utils/backup';
import { clearAllData, saveTrip } from '../../db';
import { Trip } from '../../types/travel';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataChanged: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onDataChanged,
}) => {
  const [isExportingZip, setIsExportingZip] = useState<boolean>(false);
  const [zipProgress, setZipProgress] = useState<{ percent: number; text: string }>({ percent: 0, text: '' });
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importMode, setImportMode] = useState<'merge' | 'overwrite'>('merge');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 스토리지 용량 정보 상태
  const [storageUsage, setStorageUsage] = useState<{ usageMB: number; quotaMB: number; percent: number } | null>(null);

  const jsonInputRef = useRef<HTMLInputElement | null>(null);
  const zipInputRef = useRef<HTMLInputElement | null>(null);

  // 스토리지 사용량 측정
  const updateStorageEstimate = async () => {
    if (navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        const usageMB = Number(((estimate.usage || 0) / (1024 * 1024)).toFixed(2));
        const quotaMB = Number(((estimate.quota || 0) / (1024 * 1024)).toFixed(0));
        const percent = quotaMB > 0 ? (usageMB / quotaMB) * 100 : 0;
        setStorageUsage({ usageMB, quotaMB, percent });
      } catch (err) {
        console.warn('Storage estimate failed', err);
      }
    }
  };

  useEffect(() => {
    updateStorageEstimate();
  }, []);

  const handleExportJson = async () => {
    try {
      await exportToJson();
      setStatusMessage({ type: 'success', text: '여행 기록 JSON 파일이 다운로드되었습니다.' });
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'JSON 내보내기 중 오류가 발생했습니다.' });
    }
  };

  const handleExportZip = async () => {
    setIsExportingZip(true);
    try {
      await exportToZip((percent, text) => {
        setZipProgress({ percent, text });
      });
      setStatusMessage({ type: 'success', text: '사진 원본이 포함된 풀 백업 ZIP 파일이 생성되었습니다.' });
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: 'error', text: 'ZIP 백업 파일 생성 중 오류가 발생했습니다.' });
    } finally {
      setIsExportingZip(false);
    }
  };

  const handleImportJsonFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const res = await importFromJson(file, importMode);
      setStatusMessage({ type: 'success', text: `JSON 복원 완료! (여행 ${res.tripsCount}개, 사진 ${res.photosCount}개)` });
      onDataChanged();
      updateStorageEstimate();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'JSON 파일 불러오기 실패' });
    } finally {
      setIsImporting(false);
      if (jsonInputRef.current) jsonInputRef.current.value = '';
    }
  };

  const handleImportZipFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const res = await importFromZip(file, importMode, (percent, text) => {
        setZipProgress({ percent, text });
      });
      setStatusMessage({ type: 'success', text: `ZIP 백업 복원 완료! (여행 ${res.tripsCount}개, 사진 ${res.photosCount}개)` });
      onDataChanged();
      updateStorageEstimate();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'ZIP 파일 복원 실패' });
    } finally {
      setIsImporting(false);
      if (zipInputRef.current) zipInputRef.current.value = '';
    }
  };

  // 샘플 데이터 로드
  const handleLoadSampleData = async () => {
    if (!window.confirm('예시 여행 기록 샘플 데이터를 추가하시겠습니까?')) return;

    try {
      const sampleTrips: Trip[] = [
        {
          id: 'trip_sample_busan',
          title: '부산 사하구 다대포 일몰 & 낙동강 하구 여행',
          startDate: '2026-08-16',
          endDate: '2026-08-17',
          districtCodes: ['21110'], // 부산 사하구
          districtNames: ['부산광역시 사하구'],
          color: '#ff6b6b',
          memo: '다대포 해수욕장의 아름다운 낙조 분수와 몰운대 산책길을 걸었습니다. 낙동강하구에코센터에서 철새 관찰도 하고, 생선회도 맛있게 먹은 완벽한 1박 2일 사하구 여행!',
          rating: 5,
          tags: ['자연/풍경', '맛집탐방', '힐링'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'trip_sample_seoul',
          title: '서울 종로 & 성북 역사 골목 산책',
          startDate: '2026-05-02',
          endDate: '2026-05-03',
          districtCodes: ['11010', '11080'], // 서울 종로구, 성북구
          districtNames: ['서울특별시 종로구', '서울특별시 성북구'],
          color: '#3b82f6',
          memo: '경복궁 야간개장 관람 후 삼청동과 한양도성 성곽길을 따라 걸었습니다. 고즈넉한 한옥 카페에서의 여유가 인상 깊었습니다.',
          rating: 5,
          tags: ['문화/역사', '드라이브'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'trip_sample_jeju',
          title: '제주도 서귀포 올레길 힐링 투어',
          startDate: '2026-03-10',
          endDate: '2026-03-13',
          districtCodes: ['39020'], // 제주 서귀포시
          districtNames: ['제주특별자치도 서귀포시'],
          color: '#10b981',
          memo: '성산일출봉과 쇠소깍, 외돌개를 둘러보는 서귀포 여행. 바다를 보며 걷는 올레길이 정말 환상적이었습니다.',
          rating: 5,
          tags: ['힐링', '자연/풍경', '액티비티'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      for (const trip of sampleTrips) {
        await saveTrip(trip);
      }

      setStatusMessage({ type: 'success', text: '예시 여행 데이터가 성공적으로 등록되었습니다!' });
      onDataChanged();
      updateStorageEstimate();
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: 'error', text: '샘플 데이터 로딩 중 오류가 발생했습니다.' });
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('정말 모든 여행 기록과 사진 데이터를 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      await clearAllData();
      setStatusMessage({ type: 'success', text: '모든 데이터가 초기화되었습니다.' });
      onDataChanged();
      updateStorageEstimate();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 100 }}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '720px',
          maxHeight: '90vh',
          overflowY: 'auto',
          borderRadius: '26px',
          padding: '26px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          background: 'var(--bg-surface)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
              ⚙️ 백업 및 데이터 설정
            </h2>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              개인정보 로컬 보관 및 백업/복원, 브라우저 저장 용량 확인
            </p>
          </div>

          <button className="btn-icon" onClick={onClose} title="닫기">
            <X size={20} />
          </button>
        </div>

      {statusMessage && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            background: statusMessage.type === 'success' ? '#ecfdf5' : '#fef2f2',
            color: statusMessage.type === 'success' ? '#065f46' : '#991b1b',
            border: `1px solid ${statusMessage.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
            fontSize: '0.88rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {statusMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* 로컬 스토리지 사용량 실시간 게이지 */}
      {storageUsage && (
        <div style={{ background: 'var(--bg-surface)', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.95rem' }}>
              <HardDrive size={18} style={{ color: 'var(--primary)' }} />
              <span>기기 내부 로컬 저장 공간 현황</span>
            </div>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              <b>{storageUsage.usageMB} MB</b> 사용 중
            </span>
          </div>

          <div style={{ background: 'var(--bg-subtle)', height: '10px', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${Math.max(storageUsage.percent, 0.5)}%`,
                background: 'linear-gradient(90deg, #3b82f6 0%, #10b981 100%)',
                borderRadius: 'var(--radius-full)',
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            <span>IndexedDB 암호화 로컬 보관소</span>
            <span>최대 허용 용량: 약 {storageUsage.quotaMB} MB</span>
          </div>
        </div>
      )}

      {/* 보안 & 프라이버시 보증 카드 */}
      <div
        style={{
          background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)',
          border: '1px solid #bfdbfe',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          display: 'flex',
          gap: '16px',
          alignItems: 'flex-start',
        }}
      >
        <div style={{ padding: '10px', background: '#3b82f6', color: 'white', borderRadius: 'var(--radius-md)' }}>
          <ShieldCheck size={26} />
        </div>
        <div>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e3a8a' }}>
            100% 프라이빗 & 서버리스(Serverless) 보장
          </h4>
          <p style={{ fontSize: '0.84rem', color: '#334155', marginTop: '6px', lineHeight: 1.6 }}>
            본 서비스는 백엔드 서버가 전혀 없는 <b>정적 웹 애플리케이션</b>입니다. 사용자가 등록한 모든 여행 기록, 메모, 고화질 사진은 <b>오직 사용자의 기기 내부(IndexedDB)</b>에만 안전하게 로컬 저장되며, 외부로 개인정보가 단 1바이트도 전송되지 않으므로 안심하고 사용하실 수 있습니다.
          </p>
        </div>
      </div>

      {/* 데이터 백업 (내보내기) 섹션 */}
      <div style={{ background: 'var(--bg-surface)', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Download size={18} style={{ color: 'var(--primary)' }} />
          <span>데이터 백업 내보내기 (Export)</span>
        </h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
          기기를 변경하거나 보관할 때 데이터를 파일로 안전하게 다운로드합니다.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
          {/* JSON 내보내기 */}
          <div style={{ padding: '16px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.92rem' }}>
              <FileText size={16} style={{ color: '#3b82f6' }} />
              <span>텍스트 기록 백업 (JSON)</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              여행 다이어리, 방문 지역, 날짜, 메모가 포함된 초경량 백업 파일
            </p>
            <button className="btn btn-outline" style={{ marginTop: 'auto' }} onClick={handleExportJson}>
              JSON 다운로드
            </button>
          </div>

          {/* ZIP 풀 백업 */}
          <div style={{ padding: '16px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.92rem' }}>
              <FileArchive size={16} style={{ color: '#10b981' }} />
              <span>사진 포함 전체 백업 (ZIP)</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              고화질 사진 원본 파일과 모든 메타데이터를 압축한 풀 패키지 백업
            </p>
            <button className="btn btn-primary" style={{ marginTop: 'auto' }} onClick={handleExportZip} disabled={isExportingZip}>
              {isExportingZip ? `압축 중... (${zipProgress.percent}%)` : 'ZIP 풀 백업 다운로드'}
            </button>
          </div>
        </div>

        {isExportingZip && (
          <div style={{ marginTop: '12px', fontSize: '0.82rem', color: 'var(--primary)' }}>
            {zipProgress.text}
          </div>
        )}
      </div>

      {/* 데이터 복원 (불러오기) 섹션 */}
      <div style={{ background: 'var(--bg-surface)', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Upload size={18} style={{ color: '#10b981' }} />
          <span>데이터 복원 및 불러오기 (Import)</span>
        </h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
          기존 백업 파일(.json 또는 .zip)을 불러와 여행 기록을 복원합니다.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '14px', fontSize: '0.85rem' }}>
          <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>복원 방식:</span>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input
              type="radio"
              name="importMode"
              checked={importMode === 'merge'}
              onChange={() => setImportMode('merge')}
            />
            <span>기존 데이터와 합치기 (Merge)</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input
              type="radio"
              name="importMode"
              checked={importMode === 'overwrite'}
              onChange={() => setImportMode('overwrite')}
            />
            <span style={{ color: '#ef4444' }}>전체 덮어쓰기 (Overwrite)</span>
          </label>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <input
            type="file"
            ref={jsonInputRef}
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleImportJsonFile}
          />
          <input
            type="file"
            ref={zipInputRef}
            accept=".zip"
            style={{ display: 'none' }}
            onChange={handleImportZipFile}
          />

          <button className="btn btn-outline" onClick={() => jsonInputRef.current?.click()} disabled={isImporting}>
            <FileText size={16} />
            <span>JSON 파일 불러오기</span>
          </button>

          <button className="btn btn-outline" onClick={() => zipInputRef.current?.click()} disabled={isImporting}>
            <FileArchive size={16} />
            <span>ZIP 백업 복원하기</span>
          </button>
        </div>

        {isImporting && (
          <div style={{ marginTop: '12px', fontSize: '0.82rem', color: 'var(--primary)' }}>
            데이터를 읽고 복원하는 중입니다...
          </div>
        )}
      </div>

      {/* iOS 홈 화면 추가(PWA) 가이드 */}
      <div style={{ background: 'var(--bg-surface)', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Smartphone size={18} style={{ color: '#f59e0b' }} />
          <span>iOS (iPhone / iPad) 앱처럼 설치하기</span>
        </h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
          Xcode나 앱스토어 설치 없이, 사파리에서 3초 만에 네이티브 앱처럼 전체화면으로 설치할 수 있습니다.
        </p>

        <div style={{ background: 'var(--bg-subtle)', padding: '14px', borderRadius: 'var(--radius-md)', fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          1. iPhone의 <b>Safari(사파리)</b> 브라우저로 본 웹사이트에 접속합니다.<br />
          2. 하단 중앙의 <b>[공유(사각형에 위 화살표 아이콘)]</b> 버튼을 탭합니다.<br />
          3. 메뉴에서 <b>[홈 화면에 추가]</b>를 선택한 후 우측 상단 <b>[추가]</b>를 누릅니다.<br />
          4. 홈 화면에 생성된 아이콘을 누르면 주소창 없는 <b>전체화면 네이티브 앱</b>으로 실행됩니다!
        </div>
      </div>

      {/* 샘플 데이터 & 초기화 도구 */}
      <div style={{ background: 'var(--bg-surface)', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>체험용 샘플 데이터 추가</h4>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            부산 사하구, 서울 종로구, 제주 서귀포시 예시 여행 기록을 불러옵니다.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-outline" onClick={handleLoadSampleData}>
            <Sparkles size={16} />
            <span>샘플 데이터 추가</span>
          </button>
          <button className="btn btn-subtle" style={{ color: '#ef4444' }} onClick={handleClearAll}>
            <Trash2 size={16} />
            <span>데이터 전체 초기화</span>
          </button>
        </div>
      </div>
      </div>
    </div>
  );
};
