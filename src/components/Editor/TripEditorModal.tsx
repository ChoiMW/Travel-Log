import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Calendar, MapPin, Sparkles, Trash2, Check, Star, Tag, Clock, HelpCircle, ChevronDown } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Trip, DistrictFeatureProperties } from '../../types/travel';
import { sdoList, getDistrictsBySdo, getDistrictByCode } from '../../utils/geoMatcher';
import { parsePhotoFile, analyzePhotosForTrip, ParsedPhotoResult } from '../../utils/exif';

interface TripEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (trip: Trip, newPhotos: ParsedPhotoResult[]) => Promise<void>;
  editingTrip?: Trip | null;
  initialDistrict?: DistrictFeatureProperties | null;
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

const PRESET_TAGS = ['힐링', '맛집탐방', '자연/풍경', '호캉스', '문화/역사', '액티비티', '드라이브', '가족여행', '우정여행', '혼자여행'];

export const TripEditorModal: React.FC<TripEditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingTrip,
  initialDistrict,
}) => {
  const [title, setTitle] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedDistricts, setSelectedDistricts] = useState<DistrictFeatureProperties[]>([]);
  const [color, setColor] = useState<string>(PRESET_COLORS[0]);
  const [memo, setMemo] = useState<string>('');
  const [rating, setRating] = useState<number>(5);
  const [tags, setTags] = useState<string[]>([]);
  
  // 지역 선택 UI 상태
  const [selectedSdo, setSelectedSdo] = useState<string>('서울특별시');
  const [selectedSigCode, setSelectedSigCode] = useState<string>('');

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
      setTitle(editingTrip.title);
      setStartDate(editingTrip.startDate);
      setEndDate(editingTrip.endDate);
      setColor(editingTrip.color || PRESET_COLORS[0]);
      setMemo(editingTrip.memo || '');
      setRating(editingTrip.rating || 5);
      setTags(editingTrip.tags || []);
      
      const loadedDistricts = editingTrip.districtCodes
        .map(code => getDistrictByCode(code))
        .filter(Boolean) as DistrictFeatureProperties[];
      setSelectedDistricts(loadedDistricts);
      setUploadedPhotos([]);
      setExifSuggestion(null);
    } else {
      const today = new Date().toISOString().split('T')[0];
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
        setSelectedSdo(initialDistrict.sdoName);
        setTitle(`${initialDistrict.fullName} 여행`);
      } else {
        setSelectedDistricts([]);
      }
    }
  }, [editingTrip, initialDistrict, isOpen]);

  const currentSdoDistricts = getDistrictsBySdo(selectedSdo);

  const handleAddDistrict = (district: DistrictFeatureProperties) => {
    if (!selectedDistricts.some(d => d.code === district.code)) {
      setSelectedDistricts(prev => [...prev, district]);
      if (!title) {
        setTitle(`${district.fullName} 여행`);
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

  // 특정 사진의 시군구 직접 변경/할당
  const handleUpdatePhotoDistrict = (photoIndex: number, districtCode: string) => {
    const dist = getDistrictByCode(districtCode);
    setUploadedPhotos(prev => {
      const updated = [...prev];
      if (dist) {
        updated[photoIndex] = {
          ...updated[photoIndex],
          districtCode: dist.code,
          districtName: dist.fullName,
        };
        // 여행 지역 목록에도 자동 추가
        if (!selectedDistricts.some(d => d.code === dist.code)) {
          setSelectedDistricts(curr => [...curr, dist]);
        }
      }
      return updated;
    });
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
        startDate,
        endDate,
        districtCodes: selectedDistricts.map(d => d.code),
        districtNames: selectedDistricts.map(d => d.fullName),
        color,
        memo: memo.trim(),
        rating,
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
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '720px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: color }} />
            <h3 className="modal-title">{editingTrip ? '여행 기록 수정' : '새 여행 기록하기'}</h3>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="modal-body">
            {/* EXIF 분석 알림 제안 배너 */}
            {exifSuggestion && (
              <div
                style={{
                  background: 'linear-gradient(135deg, #eff6ff 0%, #ecfdf5 100%)',
                  border: '1px solid #93c5fd',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <Sparkles size={20} style={{ color: '#2563eb', flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ fontSize: '0.84rem' }}>
                    <span style={{ fontWeight: 700, color: '#1e40af' }}>
                      사진 메타데이터(EXIF) 분석 완료!
                    </span>
                    <p style={{ color: '#334155', marginTop: '2px' }}>
                      일정: <b>{exifSuggestion.startDate} ~ {exifSuggestion.endDate}</b> /
                      지역: <b>{exifSuggestion.districts.map(d => d.name).join(', ') || '날짜 기준 매칭'}</b>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ fontSize: '0.8rem', padding: '6px 12px', flexShrink: 0 }}
                  onClick={handleApplyExifSuggestion}
                >
                  자동 적용하기
                </button>
              </div>
            )}

            {/* 여행 제목 */}
            <div className="form-group">
              <label className="form-label">여행 제목 *</label>
              <input
                type="text"
                className="form-input"
                placeholder="예: 8월 부산 사하구 다대포 힐링 여행"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
              />
            </div>

            {/* 여행 기간 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">시작 날짜</label>
                <input
                  type="date"
                  className="form-input"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
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

            {/* 방문 지역 선택 */}
            <div className="form-group">
              <label className="form-label">방문한 지역 (시/군/구) *</label>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                {selectedDistricts.map(dist => (
                  <span
                    key={dist.code}
                    style={{
                      background: 'var(--primary-light)',
                      color: 'var(--primary)',
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <MapPin size={13} />
                    {dist.fullName}
                    <X
                      size={14}
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleRemoveDistrict(dist.code)}
                    />
                  </span>
                ))}
                {selectedDistricts.length === 0 && (
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    아래에서 광역시도 및 시/군/구를 선택하여 추가해주세요.
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '8px' }}>
                <select
                  className="form-select"
                  value={selectedSdo}
                  onChange={e => {
                    setSelectedSdo(e.target.value);
                    setSelectedSigCode('');
                  }}
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
                  disabled={!selectedSigCode}
                  onClick={() => {
                    const dist = getDistrictByCode(selectedSigCode);
                    if (dist) handleAddDistrict(dist);
                  }}
                >
                  추가
                </button>
              </div>
            </div>

            {/* 지도 색상 선택 */}
            <div className="form-group">
              <label className="form-label">지도 색칠 테마 컬러</label>
              <div className="color-palette">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    className={`color-swatch ${color === c ? 'active' : ''}`}
                    style={{ background: c }}
                    onClick={() => setColor(c)}
                  >
                    {color === c && <Check size={14} color="white" style={{ position: 'absolute', top: '7px', left: '7px' }} />}
                  </button>
                ))}
                <input
                  type="color"
                  value={color}
                  onChange={e => setColor(e.target.value)}
                  style={{ width: '32px', height: '32px', border: 'none', borderRadius: '50%', cursor: 'pointer', background: 'transparent' }}
                  title="직접 색상 지정"
                />
              </div>
            </div>

            {/* 사진 일괄 업로드 & EXIF 분석 드롭존 */}
            <div className="form-group">
              <label className="form-label">
                여행 사진 첨부 (EXIF 회전 보정 및 날짜/위치 자동 분석)
              </label>
              
              <div
                className="photo-upload-zone"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  multiple
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={e => handleFilesSelected(e.target.files)}
                />
                <Upload size={24} style={{ color: 'var(--primary)' }} />
                <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                  사진 파일을 클릭하거나 드래그하여 업로드
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  사진의 촬영 날짜와 GPS 위치(EXIF)를 자동으로 읽어옵니다.
                </div>
              </div>

              {isAnalyzingPhotos && (
                <div style={{ fontSize: '0.82rem', color: 'var(--primary)', textAlign: 'center', marginTop: '6px' }}>
                  사진의 EXIF 회전각 및 GPS 위치 분석 중...
                </div>
              )}

              {/* 스마트 사진 매니저 리스트 */}
              {uploadedPhotos.length > 0 && (
                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    업로드된 사진 ({uploadedPhotos.length}장) - 지역 확인 및 개별 변경:
                  </div>

                  <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', paddingRight: '4px' }}>
                    {uploadedPhotos.map((photo, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '8px',
                          background: 'var(--bg-subtle)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-light)',
                        }}
                      >
                        <img
                          src={photo.thumbnailUrl}
                          alt="thumb"
                          style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                        />

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.82rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {photo.file.name}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {photo.dateFormatted && (
                              <span>📅 {photo.dateFormatted}</span>
                            )}
                            {photo.districtName ? (
                              <span style={{ color: 'var(--primary)', fontWeight: 600 }}>📍 {photo.districtName}</span>
                            ) : (
                              <span style={{ color: '#f59e0b' }}>⚠️ 위치 정보 없음</span>
                            )}
                          </div>
                        </div>

                        {/* 개별 지역 할당 드롭다운 */}
                        <select
                          className="form-select"
                          style={{ width: 'auto', padding: '4px 8px', fontSize: '0.76rem' }}
                          value={photo.districtCode || ''}
                          onChange={e => handleUpdatePhotoDistrict(idx, e.target.value)}
                        >
                          <option value="">지역 지정</option>
                          {selectedDistricts.map(d => (
                            <option key={d.code} value={d.code}>
                              {d.name}
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          className="btn-icon"
                          style={{ width: '28px', height: '28px' }}
                          onClick={() => handleRemoveUploadedPhoto(idx)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 별점 및 태그 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '16px', alignItems: 'center' }}>
              <div className="form-group">
                <label className="form-label">여행 만족도</label>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star
                      key={star}
                      size={22}
                      style={{ cursor: 'pointer', fill: star <= rating ? '#f59e0b' : 'none', color: star <= rating ? '#f59e0b' : '#cbd5e1' }}
                      onClick={() => setRating(star)}
                    />
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
                      onClick={() => handleTagToggle(tag)}
                      style={{
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.75rem',
                        border: '1px solid var(--border-light)',
                        background: tags.includes(tag) ? 'var(--primary)' : 'var(--bg-subtle)',
                        color: tags.includes(tag) ? 'white' : 'var(--text-secondary)',
                        cursor: 'pointer',
                      }}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 여행 메모 */}
            <div className="form-group">
              <label className="form-label">여행 기록 & 메모</label>
              <textarea
                className="form-textarea"
                rows={4}
                placeholder="이번 여행에서 인상 깊었던 장소, 맛집, 특별한 기억을 자유롭게 남겨보세요."
                value={memo}
                onChange={e => setMemo(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-subtle" onClick={onClose}>
              취소
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? '저장 중...' : editingTrip ? '수정 완료' : '기록 저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
