import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { db, getAllTrips, getAllPhotos, saveTrip, savePhoto, clearAllData } from '../db';
import { Trip, PhotoItem, BackupPayload } from '../types/travel';

const APP_VERSION = '1.0.0';

/**
 * 여행 데이터 텍스트 JSON 내보내기
 */
export async function exportToJson(): Promise<void> {
  const trips = await getAllTrips();
  const photos = await getAllPhotos();

  // Blob 객체는 JSON에 직렬화되지 않으므로 제외하거나 썸네일만 포함
  const sanitizedPhotos = photos.map(p => ({
    id: p.id,
    tripId: p.tripId,
    districtCode: p.districtCode,
    districtName: p.districtName,
    fileName: p.fileName,
    thumbnailUrl: p.thumbnailUrl,
    takenAt: p.takenAt,
    latitude: p.latitude,
    longitude: p.longitude,
    make: p.make,
    model: p.model,
    caption: p.caption,
    createdAt: p.createdAt,
  }));

  const payload: BackupPayload = {
    version: APP_VERSION,
    exportedAt: new Date().toISOString(),
    appName: 'TravelLog Korea',
    trips,
    photos: sanitizedPhotos,
  };

  const jsonString = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
  const filename = `travellog_backup_${new Date().toISOString().slice(0, 10)}.json`;
  saveAs(blob, filename);
}

/**
 * 여행 데이터 + 사진 원본(Blob) 전체 압축 ZIP 내보내기
 */
export async function exportToZip(onProgress?: (progress: number, status: string) => void): Promise<void> {
  if (onProgress) onProgress(10, '데이터 수집 중...');
  const trips = await getAllTrips();
  const photos = await getAllPhotos();

  const zip = new JSZip();
  const photosFolder = zip.folder('photos');

  const sanitizedPhotos = [];

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    const photoExt = photo.fileName.split('.').pop() || 'jpg';
    const photoFileName = `${photo.id}.${photoExt}`;

    if (photo.blob && photosFolder) {
      photosFolder.file(photoFileName, photo.blob);
    }

    sanitizedPhotos.push({
      id: photo.id,
      tripId: photo.tripId,
      districtCode: photo.districtCode,
      districtName: photo.districtName,
      fileName: photo.fileName,
      storedFileName: photoFileName,
      thumbnailUrl: photo.thumbnailUrl,
      takenAt: photo.takenAt,
      latitude: photo.latitude,
      longitude: photo.longitude,
      make: photo.make,
      model: photo.model,
      caption: photo.caption,
      createdAt: photo.createdAt,
    });

    if (onProgress) {
      const pct = Math.round(10 + ((i + 1) / photos.length) * 40);
      onProgress(pct, `사진 압축 준비 중 (${i + 1}/${photos.length})...`);
    }
  }

  const payload = {
    version: APP_VERSION,
    exportedAt: new Date().toISOString(),
    appName: 'TravelLog Korea',
    trips,
    photos: sanitizedPhotos,
  };

  zip.file('manifest.json', JSON.stringify(payload, null, 2));

  if (onProgress) onProgress(60, 'ZIP 아카이브 생성 중...');
  const content = await zip.generateAsync(
    { type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } },
    (metadata) => {
      if (onProgress) {
        onProgress(Math.round(60 + metadata.percent * 0.4), `압축 진행 중: ${metadata.percent.toFixed(0)}%`);
      }
    }
  );

  const filename = `travellog_full_backup_${new Date().toISOString().slice(0, 10)}.zip`;
  saveAs(content, filename);
  if (onProgress) onProgress(100, '백업 파일 다운로드 완료!');
}

/**
 * JSON 백업 파일 불러오기
 */
export async function importFromJson(file: File, mode: 'overwrite' | 'merge' = 'merge'): Promise<{ tripsCount: number; photosCount: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text) as BackupPayload;

        if (!data || !Array.isArray(data.trips)) {
          throw new Error('유효하지 않은 백업 파일 형식입니다.');
        }

        if (mode === 'overwrite') {
          await clearAllData();
        }

        for (const trip of data.trips) {
          await saveTrip(trip);
        }

        if (Array.isArray(data.photos)) {
          for (const photo of data.photos) {
            await savePhoto({
              ...photo,
              createdAt: photo.createdAt || new Date().toISOString(),
            });
          }
        }

        resolve({ tripsCount: data.trips.length, photosCount: data.photos?.length || 0 });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('파일을 읽는 중 오류가 발생했습니다.'));
    reader.readAsText(file);
  });
}

/**
 * ZIP 백업 파일 복원 (사진 원본 포함)
 */
export async function importFromZip(file: File, mode: 'overwrite' | 'merge' = 'merge', onProgress?: (progress: number, status: string) => void): Promise<{ tripsCount: number; photosCount: number }> {
  if (onProgress) onProgress(10, 'ZIP 파일 해제 중...');
  const zip = await JSZip.loadAsync(file);

  const manifestFile = zip.file('manifest.json');
  if (!manifestFile) {
    throw new Error('백업 파일(manifest.json)이 손상되었거나 누락되었습니다.');
  }

  const manifestJson = await manifestFile.async('text');
  const data = JSON.parse(manifestJson);

  if (!data || !Array.isArray(data.trips)) {
    throw new Error('유효하지 않은 백업 데이터입니다.');
  }

  if (mode === 'overwrite') {
    if (onProgress) onProgress(20, '기존 데이터 초기화 중...');
    await clearAllData();
  }

  // 1. 여행 기록 저장
  if (onProgress) onProgress(30, '여행 기록 복원 중...');
  for (const trip of data.trips) {
    await saveTrip(trip);
  }

  // 2. 사진 복원
  const photos = data.photos || [];
  for (let i = 0; i < photos.length; i++) {
    const photoMeta = photos[i];
    let photoBlob: Blob | undefined;

    const storedFileName = photoMeta.storedFileName || `${photoMeta.id}.${photoMeta.fileName.split('.').pop() || 'jpg'}`;
    const photoInZip = zip.file(`photos/${storedFileName}`);

    if (photoInZip) {
      photoBlob = await photoInZip.async('blob');
    }

    await savePhoto({
      id: photoMeta.id,
      tripId: photoMeta.tripId,
      districtCode: photoMeta.districtCode,
      districtName: photoMeta.districtName,
      fileName: photoMeta.fileName,
      blob: photoBlob,
      thumbnailUrl: photoMeta.thumbnailUrl,
      takenAt: photoMeta.takenAt,
      latitude: photoMeta.latitude,
      longitude: photoMeta.longitude,
      make: photoMeta.make,
      model: photoMeta.model,
      caption: photoMeta.caption,
      createdAt: photoMeta.createdAt || new Date().toISOString(),
    });

    if (onProgress) {
      const pct = Math.round(30 + ((i + 1) / photos.length) * 65);
      onProgress(pct, `사진 복원 중 (${i + 1}/${photos.length})...`);
    }
  }

  if (onProgress) onProgress(100, '복원 완료!');
  return { tripsCount: data.trips.length, photosCount: photos.length };
}
