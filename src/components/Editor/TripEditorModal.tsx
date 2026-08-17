import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Calendar, MapPin, Sparkles, Trash2, Check, Star, Tag, Clock, HelpCircle, ChevronDown, Globe } from 'lucide-react';
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
  const [selectedJapanRegion, setSelectedJapanRegion] = useState<string>('간토 지방');
  const [selectedJapanPrefCode, setSelectedJapanPrefCode] = useState<string>('JP-13');

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
      setTags([]);
      setUploadedPhotos([]);
      setExifSuggestion(null);

      if (initialDistrict) {
        setSelectedDistricts([initialDistrict]);
        if (initialDistrict.country === 'JP') {
          setSelectedJapanRegion(initialDistrict.sdoName || '간토 지방');
        } else {
          setSelectedSdo(initialDistrict.sdoName);
        }
        setTitle(`${initialDistrict.fullName} 여행`);
      } else {
        setSelectedDistricts([]);
      }
    }
  }, [editingTrip, initialDistrict, isOpen]);

  const currentSdoDistricts = getDistrictsBySdo(selectedSdo);
  const currentJapanPrefectures = japanPrefectures.filter(p => selectedJapanRegion === '전체 (47개 도도부현)' || p.regionName === selectedJapanRegion);

  const handleAddDistrict = (district: DistrictFeatureProperties) => {
    if (!selectedDistricts.some(d => d.code === district.code)) {
      setSelectedDistricts(prev => [...prev, district]);
      if (!title) {
        setTitle(`${district.fullName} 여행`);
      }
    }
  };

  const handleAddJapanPrefecture = (prefCode: string) => {
    const pref = japanPrefectures.find(p => p.code === prefCode);
    if (pref && !selectedDistricts.some(d => d.code === pref.code)) {
      const distProp: DistrictFeatureProperties = {
        code: pref.code,
        name: pref.name,
        fullName: pref.fullName,
        sdoName: pref.regionName,
        path: pref.path,
        country: 'JP',
      };
      setSelectedDistricts(prev => [...prev, distProp]);
      if (!title) {
        setTitle(`${pref.fullName} 여행`);
      }
    }
  };

  const handleRemoveDistrict = (code: string) => {
    setSelectedDistricts(prev => prev.filter(d => d.code !== code));
  };

  // 사진 파일 선택 및 EXIF 파싱
  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsAnalyzingPhotos(true);
    const parsedList: ParsedPhotoResult[] = [];

    for (let i = 0; i < files.length; i++) {
      try {
        const parsed = await parsePhotoFile(files[i]);
        parsedList.push(parsed);
      } catch (err) {
        console.warn('Failed to parse file:', files[i].name, err);
      }
    }

    setUploadedPhotos(prev => [...prev, ...parsedList]);
    setIsAnalyzingPhotos(false);

    // 분석 제안 생성
    const suggestion = analyzePhotosForTrip(parsedList);
    if (suggestion.suggestedDistricts.length > 0 || parsedList.some(p => p.takenAt)) {
      setExifSuggestion({
        startDate: suggestion.suggestedStartDate,
        endDate: suggestion.suggestedEndDate,
        districts: suggestion.suggestedDistricts,
      });
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

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '640px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.2rem' }}>{country === 'JP' ? '🗾' : '🗺️'}</span>
            <h3>{editingTrip ? '여행 기록 수정' : '새 여행 기록하기'}</h3>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="trip-form">
          {/* 1. 여행 국가 선택 스위처 */}
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 800 }}>여행 국가</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setCountry('KR')}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '14px',
                  border: country === 'KR' ? '2px solid #3182f6' : '1px solid var(--border-light)',
                  background: country === 'KR' ? 'var(--bg-hover)' : 'transparent',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <span>🇰🇷</span>
                <span>대한민국 (250곳)</span>
              </button>

              <button
                type="button"
                onClick={() => setCountry('JP')}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '14px',
                  border: country === 'JP' ? '2px solid #f43f5e' : '1px solid var(--border-light)',
                  background: country === 'JP' ? 'var(--bg-hover)' : 'transparent',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <span>🇯🇵</span>
                <span>일본 (47개 도도부현)</span>
              </button>
            </div>
          </div>

          {/* 2. 여행 제목 */}
          <div className="form-group">
            <label className="form-label">여행 제목 *</label>
            <input
              type="text"
              className="form-input"
              placeholder={country === 'JP' ? '예: 3박 4일 도쿄 디즈니 & 시부야 힐링 여행' : '예: 8월 부산 사하구 다대포 힐링 여행'}
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </div>

          {/* 3. 여행 날짜 */}
          <div className="form-row">
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

          {/* 4. 방문 지역 선택 */}
          <div className="form-group">
            <label className="form-label">
              {country === 'JP' ? '방문한 일본 도도부현 *' : '방문한 지역 (시/군/구) *'}
            </label>

            {country === 'KR' ? (
              <div className="form-row" style={{ gap: '8px' }}>
                <select
                  className="form-select"
                  value={selectedSdo}
                  onChange={e => {
                    setSelectedSdo(e.target.value);
                    setSelectedSigCode('');
                  }}
                  style={{ flex: 1 }}
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
                  style={{ flex: 1.5 }}
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
                  className="btn btn-outline"
                  style={{ padding: '8px 14px' }}
                  onClick={() => {
                    const dist = getDistrictByCode(selectedSigCode);
                    if (dist) handleAddDistrict(dist);
                  }}
                  disabled={!selectedSigCode}
                >
                  추가
                </button>
              </div>
            ) : (
              <div className="form-row" style={{ gap: '8px' }}>
                <select
                  className="form-select"
                  value={selectedJapanRegion}
                  onChange={e => {
                    setSelectedJapanRegion(e.target.value);
                    setSelectedJapanPrefCode('');
                  }}
                  style={{ flex: 1 }}
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
                  style={{ flex: 1.5 }}
                >
                  <option value="">도도부현 선택</option>
                  {currentJapanPrefectures.map(pref => (
                    <option key={pref.code} value={pref.code}>
                      {pref.fullName} ({pref.nameJa})
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ padding: '8px 14px' }}
                  onClick={() => handleAddJapanPrefecture(selectedJapanPrefCode)}
                  disabled={!selectedJapanPrefCode}
                >
                  추가
                </button>
              </div>
            )}

            {/* 선택된 지역 태그 배지들 */}
            {selectedDistricts.length > 0 && (
              <div className="selected-districts-list" style={{ marginTop: '10px' }}>
                {selectedDistricts.map(dist => (
                  <span key={dist.code} className="district-tag-badge">
                    <MapPin size={12} />
                    <span>{dist.fullName}</span>
                    <button
                      type="button"
                      className="tag-remove-btn"
                      onClick={() => handleRemoveDistrict(dist.code)}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 5. 테마 색상 선택 */}
          <div className="form-group">
            <label className="form-label">지도 색칠 테마 컬러</label>
            <div className="color-palette">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  className={`color-chip ${color === c ? 'selected' : ''}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                >
                  {color === c && <Check size={14} color="#ffffff" strokeWidth={3} />}
                </button>
              ))}
            </div>
          </div>

          {/* 6. 사진 업로드 및 EXIF 스마트 분석 영역 */}
          <div className="form-group">
            <label className="form-label">
              여행 사진 첨부 (EXIF 회전 보정 및 날짜/위치 자동 분석)
            </label>

            <div
              className="photo-dropzone"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={24} style={{ color: 'var(--color-primary)' }} />
              <p style={{ fontWeight: 700, marginTop: '8px', color: 'var(--text-main)' }}>
                사진 파일을 클릭하거나 드래그하여 업로드
              </p>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                사진의 촬영 날짜와 GPS 위치(EXIF)를 자동으로 읽어옵니다.
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
              <div className="exif-suggestion-box">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={18} style={{ color: '#f59e0b' }} />
                  <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>
                    사진 속 위치와 날짜를 분석했습니다!
                  </span>
                </div>
                <div style={{ fontSize: '0.82rem', marginTop: '6px', color: 'var(--text-secondary)' }}>
                  <div>📅 추천 일정: {exifSuggestion.startDate} ~ {exifSuggestion.endDate}</div>
                  {exifSuggestion.districts.length > 0 && (
                    <div style={{ marginTop: '2px' }}>
                      📍 감지된 장소:{' '}
                      {exifSuggestion.districts.map(d => `${d.name} (${d.count}장)`).join(', ')}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ marginTop: '10px', fontSize: '0.84rem', padding: '6px 12px' }}
                  onClick={handleApplyExifSuggestion}
                >
                  <Check size={14} />
                  <span>분석 결과로 일정/지역 자동 채우기</span>
                </button>
              </div>
            )}

            {/* 업로드된 사진 썸네일 그리드 */}
            {uploadedPhotos.length > 0 && (
              <div className="photo-preview-grid">
                {uploadedPhotos.map((photo, idx) => (
                  <div key={photo.id || idx} className="photo-preview-card">
                    <img src={photo.thumbnailUrl} alt="preview" />
                    <button
                      type="button"
                      className="photo-remove-btn"
                      onClick={() => handleRemoveUploadedPhoto(idx)}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 7. 여행 만족도 및 태그 */}
          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">여행 만족도</label>
              <div className="rating-stars" style={{ display: 'flex', gap: '4px' }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}
                  >
                    <Star
                      size={22}
                      fill={star <= rating ? '#f59e0b' : 'none'}
                      stroke={star <= rating ? '#f59e0b' : 'var(--text-muted)'}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group" style={{ flex: 2 }}>
              <label className="form-label">테마 태그</label>
              <div className="tags-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {PRESET_TAGS.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    className={`tag-btn ${tags.includes(tag) ? 'selected' : ''}`}
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
            <label className="form-label">여행 메모 & 소감</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="이번 여행에서 가장 기억에 남는 순간이나 맛집, 팁을 기록해보세요."
              value={memo}
              onChange={e => setMemo(e.target.value)}
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-subtle" onClick={onClose} disabled={isSubmitting}>
              취소
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              <span>{isSubmitting ? '저장 중...' : '기록 저장'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
