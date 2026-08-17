import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Calendar, MapPin, Sparkles, Trash2, Check, Star, Tag, Clock, HelpCircle, ChevronDown, Globe, Plus } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Trip, DistrictFeatureProperties, CountryCode } from '../../types/travel';
import { sdoList, getDistrictsBySdo, getDistrictByCode } from '../../utils/geoMatcher';
import { japanRegions, japanPrefectures } from '../../utils/japanGeoMatcher';
import { parsePhotoFile, analyzePhotosForTrip, ParsedPhotoResult } from '../../utils/exif';

interface TripEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (trip: Trip, newPhotos: ParsedPhotoResult[]) => Promise<void>;
  editingTrip?: Trip | null;
  initialDistrict?: DistrictFeatureProperties | null;
  defaultCountry?: CountryCode;
}

const PRESET_COLORS = [
  '#3b82f6', // 클래식 블루
  '#10b981', // 에메랄드 민트
  '#f59e0b', // 선셋 앰버
  '#ef4444', // 코랄 레드
  '#8b5cf6', // 라벤더 퍼플
  '#06b6d4', // 오션 시안
  '#ec4899', // 로즈 핑크
  '#14b8a6', // 딥 틸
  '#f97316', // 탠저린 오렌지
  '#84cc16', // 라임 그린
  '#6366f1', // 인디고
  '#64748b', // 슬레이트 모던
];

const PRESET_TAGS = ['힐링', '맛집탐방', '자연/풍경', '호캉스', '문화/역사', '액티비티', '드라이브', '가족여행', '우정여행', '혼자여행', '해외여행', '쇼핑'];

export const TripEditorModal: React.FC<TripEditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingTrip,
  initialDistrict,
  defaultCountry = 'KR',
}) => {
  const [country, setCountry] = useState<CountryCode>(defaultCountry);
  const [title, setTitle] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedDistricts, setSelectedDistricts] = useState<DistrictFeatureProperties[]>([]);
  const [color, setColor] = useState<string>(PRESET_COLORS[0]);
  const [memo, setMemo] = useState<string>('');
  const [rating, setRating] = useState<number>(5);
  const [tags, setTags] = useState<string[]>([]);
  
  // 한국 지역 선택 상태
  const [selectedSdo, setSelectedSdo] = useState<string>('서울특별시');
  const [selectedSigCode, setSelectedSigCode] = useState<string>('');

  // 일본 지역 선택 상태
  const [selectedJapanRegion, setSelectedJapanRegion] = useState<string>('규슈 지방');
  const [selectedJapanPrefCode, setSelectedJapanPrefCode] = useState<string>('JP-40');

  // 업로드된 사진 목록 & 개별 관리
  const [uploadedPhotos, setUploadedPhotos] = useState<ParsedPhotoResult[]>([]);
  const [isAnalyzingPhotos, setIsAnalyzingPhotos] = useState<boolean>(false);
  const [exifSuggestion, setExifSuggestion] = useState<{
    startDate: string;
    endDate: string;
    districts: { code: string; name: string; count: number }[];
  } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 초기화 및 수정 모드 데이터 세팅
  useEffect(() => {
    if (editingTrip) {
      setCountry(editingTrip.country || 'KR');
      setTitle(editingTrip.title);
      setStartDate(editingTrip.startDate);
      setEndDate(editingTrip.endDate);
      setColor(editingTrip.color || PRESET_COLORS[0]);
      setMemo(editingTrip.memo || '');
      setRating(editingTrip.rating || 5);
      setTags(editingTrip.tags || []);
      
      const loadedDistricts = editingTrip.districtCodes.map((code, idx) => {
        const krDist = getDistrictByCode(code);
        if (krDist) return krDist;
        const jpPref = japanPrefectures.find(p => p.code === code);
        if (jpPref) {
          return {
            code: jpPref.code,
            name: jpPref.name,
            fullName: jpPref.fullName,
            sdoName: jpPref.regionName,
            path: jpPref.path,
            country: 'JP' as CountryCode,
          };
        }
        return {
          code,
          name: editingTrip.districtNames[idx] || code,
          fullName: editingTrip.districtNames[idx] || code,
          sdoName: '',
          path: '',
        };
      });

      setSelectedDistricts(loadedDistricts);
      setUploadedPhotos([]);
      setExifSuggestion(null);
    } else {
      const today = new Date().toISOString().split('T')[0];
      const initialCountry = initialDistrict?.country || defaultCountry || 'KR';
      setCountry(initialCountry);
      setTitle('');
      setStartDate(today);
      setEndDate(today);
      setColor(PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]);
      setMemo('');
      setRating(5);
      setTags(['힐링']);
      setUploadedPhotos([]);
      setExifSuggestion(null);

      if (initialDistrict) {
        setSelectedDistricts([initialDistrict]);
        setTitle(`${initialDistrict.fullName} 여행`);
      } else {
        setSelectedDistricts([]);
      }
    }
  }, [editingTrip, initialDistrict, defaultCountry, isOpen]);

  // 국가 변경 시 기본 세팅
  const handleCountryChange = (newCountry: CountryCode) => {
    setCountry(newCountry);
    if (!editingTrip && selectedDistricts.length === 0) {
      if (newCountry === 'JP') {
        setSelectedJapanRegion('규슈 지방');
        setSelectedJapanPrefCode('JP-40');
      } else {
        setSelectedSdo('서울특별시');
        setSelectedSigCode('');
      }
    }
  };

  // 한국 시도 변경 시 시군구 목록
  const currentSdoDistricts = getDistrictsBySdo(selectedSdo);

  // 일본 지방 변경 시 도도부현 목록
  const currentJapanPrefectures = japanPrefectures.filter(p => p.regionName === selectedJapanRegion);

  // 한국 지역 추가
  const handleAddDistrict = (district: DistrictFeatureProperties) => {
    if (!selectedDistricts.some(d => d.code === district.code)) {
      const updated = [...selectedDistricts, district];
      setSelectedDistricts(updated);
      if (!title) {
        setTitle(`${district.fullName} 여행`);
      }
    }
  };

  // 일본 도도부현 추가
  const handleAddJapanPrefecture = (prefCode: string) => {
    const pref = japanPrefectures.find(p => p.code === prefCode);
    if (!pref) return;

    const districtItem: DistrictFeatureProperties = {
      code: pref.code,
      name: pref.name,
      fullName: pref.fullName,
      sdoName: pref.regionName,
      path: pref.path,
      country: 'JP',
    };

    if (!selectedDistricts.some(d => d.code === districtItem.code)) {
      const updated = [...selectedDistricts, districtItem];
      setSelectedDistricts(updated);
      if (!title) {
        setTitle(`${pref.fullName} 여행`);
      }
    }
  };

  // 지역 삭제
  const handleRemoveDistrict = (code: string) => {
    setSelectedDistricts(prev => prev.filter(d => d.code !== code));
  };

  // 사진 업로드 및 EXIF 분석
  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsAnalyzingPhotos(true);
    try {
      const newParsedPhotos: ParsedPhotoResult[] = [];
      const fileArray = Array.from(files);

      for (const file of fileArray) {
        try {
          const parsed = await parsePhotoFile(file);
          newParsedPhotos.push(parsed);
        } catch (err) {
          console.warn('Photo parse error', err);
        }
      }

      setUploadedPhotos(prev => [...prev, ...newParsedPhotos]);

      // EXIF 기반 날짜 및 지역 추천
      const analysis = analyzePhotosForTrip([...uploadedPhotos, ...newParsedPhotos]);
      if (analysis.suggestedStartDate && analysis.suggestedEndDate) {
        setExifSuggestion({
          startDate: analysis.suggestedStartDate,
          endDate: analysis.suggestedEndDate,
          districts: analysis.suggestedDistricts,
        });
      }
    } catch (err) {
      console.error('Photo upload failed:', err);
    } finally {
      setIsAnalyzingPhotos(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // 사진 분석 제안 일괄 적용
  const handleApplyExifSuggestion = () => {
    if (!exifSuggestion) return;
    setStartDate(exifSuggestion.startDate);
    setEndDate(exifSuggestion.endDate);

    const newDistricts = [...selectedDistricts];
    exifSuggestion.districts.forEach(item => {
      const dist = getDistrictByCode(item.code);
      if (dist && !newDistricts.some(d => d.code === dist.code)) {
        newDistricts.push(dist);
      }
    });
    setSelectedDistricts(newDistricts);

    if (!title && newDistricts.length > 0) {
      setTitle(`${newDistricts[0].fullName} 여행`);
    }

    setExifSuggestion(null);
  };

  const handleRemoveUploadedPhoto = (index: number) => {
    setUploadedPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleTagToggle = (tag: string) => {
    setTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('여행 제목을 입력해주세요.');
      return;
    }
    if (selectedDistricts.length === 0) {
      alert('방문한 지역을 1곳 이상 선택해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      const tripId = editingTrip?.id || `trip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const tripData: Trip = {
        id: tripId,
        title: title.trim(),
        country,
        currency: country === 'JP' ? 'JPY' : 'KRW',
        startDate,
        endDate,
        districtCodes: selectedDistricts.map(d => d.code),
        districtNames: selectedDistricts.map(d => d.fullName),
        color,
        memo: memo.trim(),
        rating,
        tags,
        tickets: editingTrip?.tickets || [],
        packingList: editingTrip?.packingList || [],
        expenses: editingTrip?.expenses || [],
        createdAt: editingTrip?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await onSave(tripData, uploadedPhotos);

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}

      onClose();
    } catch (err) {
      console.error('Save trip failed:', err);
      alert('여행 기록 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const isJapan = country === 'JP';
  const brandColor = isJapan ? '#f43f5e' : '#3182f6';

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 100 }}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '680px',
          maxHeight: '92vh',
          borderRadius: '30px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.25)',
        }}
      >
        {/* 모달 헤더 */}
        <div className="modal-header" style={{ padding: '24px 30px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '14px',
                background: isJapan ? 'rgba(244, 63, 94, 0.12)' : 'rgba(49, 130, 246, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.3rem',
              }}
            >
              {isJapan ? '🗾' : '🗺️'}
            </div>
            <div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', margin: 0 }}>
                {editingTrip ? '여행 기록 수정' : '새 여행 기록하기'}
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                지도에 방문한 지역을 채우고 소중한 추억을 기록해보세요
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose} title="닫기">
            <X size={20} />
          </button>
        </div>

        {/* 모달 본문 폼 */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
          <div className="modal-body" style={{ padding: '26px 30px 32px', gap: '26px' }}>
            
            {/* 1. 여행 국가 선택 스위처 */}
            <div className="form-group">
              <label className="form-label">
                <span>여행 국가</span>
                <span className="form-label-desc">기록할 여행의 국가를 선택하세요</span>
              </label>
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  background: 'var(--bg-hover)',
                  padding: '5px',
                  borderRadius: '18px',
                }}
              >
                <button
                  type="button"
                  onClick={() => handleCountryChange('KR')}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    borderRadius: '14px',
                    border: 'none',
                    background: country === 'KR' ? 'var(--bg-surface)' : 'transparent',
                    color: country === 'KR' ? '#3182f6' : 'var(--text-secondary)',
                    fontWeight: 800,
                    fontSize: '0.94rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: country === 'KR' ? '0 4px 14px rgba(0,0,0,0.06)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span style={{ fontSize: '1.1rem' }}>🇰🇷</span>
                  <span>대한민국 (250곳)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCountryChange('JP')}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    borderRadius: '14px',
                    border: 'none',
                    background: country === 'JP' ? 'var(--bg-surface)' : 'transparent',
                    color: country === 'JP' ? '#f43f5e' : 'var(--text-secondary)',
                    fontWeight: 800,
                    fontSize: '0.94rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: country === 'JP' ? '0 4px 14px rgba(0,0,0,0.06)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span style={{ fontSize: '1.1rem' }}>🇯🇵</span>
                  <span>일본 (47개 도도부현)</span>
                </button>
              </div>
            </div>

            {/* 2. 여행 제목 */}
            <div className="form-group">
              <label className="form-label">
                <span>여행 제목</span>
                <span style={{ color: brandColor }}>*</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder={isJapan ? '예: 후쿠오카 & 유후인 온천 3박 4일 힐링 여행' : '예: 8월 부산 사하구 다대포 힐링 여행'}
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                style={{ fontSize: '1rem' }}
              />
            </div>

            {/* 3. 여행 날짜 (시작일 / 종료일 2열 그리드) */}
            <div className="form-row" style={{ gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">시작 날짜</label>
                <input
                  type="date"
                  className="form-input"
                  value={startDate}
                  onChange={e => {
                    setStartDate(e.target.value);
                    if (e.target.value > endDate) setEndDate(e.target.value);
                  }}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">종료 날짜</label>
                <input
                  type="date"
                  className="form-input"
                  value={endDate}
                  min={startDate}
                  onChange={e => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* 4. 방문 지역 선택 및 추가 바 */}
            <div className="form-group">
              <label className="form-label">
                <span>{isJapan ? '방문한 일본 도도부현' : '방문한 지역 (시/군/구)'}</span>
                <span style={{ color: brandColor }}>*</span>
                <span className="form-label-desc">지도에 함께 칠해질 지역을 추가하세요</span>
              </label>

              {country === 'KR' ? (
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <select
                    className="form-select"
                    value={selectedSdo}
                    onChange={e => {
                      setSelectedSdo(e.target.value);
                      setSelectedSigCode('');
                    }}
                    style={{ flex: 1.1 }}
                  >
                    {sdoList.map(sdo => (
                      <option key={sdo} value={sdo}>
                        {sdo}
                      </option>
                    ))}
                  </select>

                  <select
                    className="form-select"
                    value={selectedSigCode}
                    onChange={e => setSelectedSigCode(e.target.value)}
                    style={{ flex: 1.4 }}
                  >
                    <option value="">시/군/구 선택</option>
                    {currentSdoDistricts.map(dist => (
                      <option key={dist.code} value={dist.code}>
                        {dist.name}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ padding: '0 20px', minHeight: '48px', flexShrink: 0 }}
                    onClick={() => {
                      const dist = getDistrictByCode(selectedSigCode);
                      if (dist) handleAddDistrict(dist);
                    }}
                    disabled={!selectedSigCode}
                  >
                    <Plus size={16} strokeWidth={3} />
                    <span>추가</span>
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <select
                    className="form-select"
                    value={selectedJapanRegion}
                    onChange={e => {
                      setSelectedJapanRegion(e.target.value);
                      setSelectedJapanPrefCode('');
                    }}
                    style={{ flex: 1.1 }}
                  >
                    {japanRegions.map(reg => (
                      <option key={reg} value={reg}>
                        {reg}
                      </option>
                    ))}
                  </select>

                  <select
                    className="form-select"
                    value={selectedJapanPrefCode}
                    onChange={e => setSelectedJapanPrefCode(e.target.value)}
                    style={{ flex: 1.4 }}
                  >
                    <option value="">도도부현 선택</option>
                    {currentJapanPrefectures.map(pref => (
                      <option key={pref.code} value={pref.code}>
                        {pref.fullName}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{
                      padding: '0 20px',
                      minHeight: '48px',
                      flexShrink: 0,
                      background: '#f43f5e',
                      boxShadow: '0 4px 14px rgba(244, 63, 94, 0.3)',
                    }}
                    onClick={() => handleAddJapanPrefecture(selectedJapanPrefCode)}
                    disabled={!selectedJapanPrefCode}
                  >
                    <Plus size={16} strokeWidth={3} />
                    <span>추가</span>
                  </button>
                </div>
              )}

              {/* 선택된 지역 캡슐 태그들 */}
              {selectedDistricts.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
                  {selectedDistricts.map(dist => (
                    <span
                      key={dist.code}
                      className={`district-tag-badge ${isJapan ? 'jp-badge' : ''}`}
                    >
                      <MapPin size={13} />
                      <span>{dist.fullName}</span>
                      <button
                        type="button"
                        className="tag-remove-btn"
                        onClick={() => handleRemoveDistrict(dist.code)}
                        title="삭제"
                      >
                        <X size={13} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 5. 테마 색상 선택 */}
            <div className="form-group">
              <label className="form-label">
                <span>지도 색칠 테마 컬러</span>
                <span className="form-label-desc">지도에서 이 여행에 지정될 대표 색상입니다</span>
              </label>
              <div className="color-palette">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    className={`color-chip ${color === c ? 'selected' : ''}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                  >
                    {color === c && <Check size={16} color="#ffffff" strokeWidth={3.5} />}
                  </button>
                ))}
              </div>
            </div>

            {/* 6. 사진 업로드 및 EXIF 스마트 분석 영역 */}
            <div className="form-group">
              <label className="form-label">
                <span>여행 사진 첨부</span>
                <span className="form-label-desc">사진의 촬영 날짜와 GPS 위치(EXIF)를 자동 분석합니다</span>
              </label>

              <div
                className="photo-dropzone"
                onClick={() => fileInputRef.current?.click()}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: isJapan ? 'rgba(244, 63, 94, 0.1)' : 'rgba(49, 130, 246, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: brandColor,
                  }}
                >
                  <Upload size={22} />
                </div>
                <p style={{ fontWeight: 800, fontSize: '0.96rem', margin: '4px 0 0 0', color: 'var(--text-main)' }}>
                  사진 파일을 클릭하거나 드래그하여 업로드
                </p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                  고화질 원본 자동 압축 및 브라우저 내부 안전 보관
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={e => handleFilesSelected(e.target.files)}
                />
              </div>

              {/* 사진 스마트 분석 제안 팝업 배너 */}
              {exifSuggestion && (
                <div
                  style={{
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(245, 158, 11, 0.04) 100%)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: '20px',
                    padding: '16px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    marginTop: '4px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={18} style={{ color: '#f59e0b' }} />
                    <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-main)' }}>
                      사진 속 위치와 날짜를 스마트하게 분석했습니다!
                    </span>
                  </div>
                  <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    <div>📅 추천 일정: <b>{exifSuggestion.startDate} ~ {exifSuggestion.endDate}</b></div>
                    {exifSuggestion.districts.length > 0 && (
                      <div style={{ marginTop: '2px' }}>
                        📍 감지된 장소:{' '}
                        <b>{exifSuggestion.districts.map(d => `${d.name} (${d.count}장)`).join(', ')}</b>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{
                      alignSelf: 'flex-start',
                      fontSize: '0.86rem',
                      padding: '8px 16px',
                      background: '#f59e0b',
                      boxShadow: '0 4px 14px rgba(245, 158, 11, 0.3)',
                    }}
                    onClick={handleApplyExifSuggestion}
                  >
                    <Check size={14} strokeWidth={2.8} />
                    <span>분석 결과로 일정/지역 자동 채우기</span>
                  </button>
                </div>
              )}

              {/* 업로드된 사진 썸네일 그리드 */}
              {uploadedPhotos.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '10px', marginTop: '6px' }}>
                  {uploadedPhotos.map((photo, idx) => (
                    <div
                      key={photo.id || idx}
                      style={{
                        aspectRatio: '1',
                        borderRadius: '14px',
                        overflow: 'hidden',
                        position: 'relative',
                        boxShadow: 'var(--shadow-sm)',
                      }}
                    >
                      <img
                        src={photo.thumbnailUrl}
                        alt="preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveUploadedPhoto(idx)}
                        style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          background: 'rgba(0, 0, 0, 0.65)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '22px',
                          height: '22px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 7. 여행 만족도 및 테마 태그 */}
            <div className="form-row" style={{ gap: '20px' }}>
              <div className="form-group">
                <label className="form-label">여행 만족도</label>
                <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}
                    >
                      <Star
                        size={26}
                        fill={star <= rating ? '#f59e0b' : 'none'}
                        stroke={star <= rating ? '#f59e0b' : 'var(--text-muted)'}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">테마 태그</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {PRESET_TAGS.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      className={`district-tag-badge ${tags.includes(tag) ? (isJapan ? 'jp-badge' : '') : ''}`}
                      style={{
                        background: tags.includes(tag) ? (isJapan ? 'rgba(244, 63, 94, 0.15)' : 'rgba(49, 130, 246, 0.15)') : 'var(--bg-hover)',
                        color: tags.includes(tag) ? brandColor : 'var(--text-secondary)',
                        borderColor: tags.includes(tag) ? brandColor : 'transparent',
                        cursor: 'pointer',
                        padding: '6px 12px',
                        fontSize: '0.84rem',
                      }}
                      onClick={() => handleTagToggle(tag)}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 8. 여행 소감 및 메모 */}
            <div className="form-group">
              <label className="form-label">
                <span>여행 메모 & 소감</span>
                <span className="form-label-desc">자유롭게 기록을 남겨보세요</span>
              </label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="이번 여행에서 가장 기억에 남는 순간이나 맛집, 팁을 기록해보세요."
                value={memo}
                onChange={e => setMemo(e.target.value)}
                style={{ lineHeight: 1.6 }}
              />
            </div>

          </div>

          {/* 모달 푸터 */}
          <div className="modal-footer" style={{ padding: '18px 30px' }}>
            <button
              type="button"
              className="btn btn-subtle"
              onClick={onClose}
              disabled={isSubmitting}
              style={{ minWidth: '88px', minHeight: '48px' }}
            >
              취소
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              style={{
                minWidth: '140px',
                minHeight: '48px',
                fontSize: '0.98rem',
                fontWeight: 800,
                background: brandColor,
                boxShadow: `0 4px 14px ${isJapan ? 'rgba(244, 63, 94, 0.3)' : 'rgba(49, 130, 246, 0.3)'}`,
              }}
            >
              <span>{isSubmitting ? '저장 중...' : (editingTrip ? '수정 완료' : '기록 저장하기')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
