import Dexie, { Table } from 'dexie';
import { Trip, PhotoItem } from '../types/travel';

export class TravelLogDB extends Dexie {
  trips!: Table<Trip, string>;
  photos!: Table<PhotoItem, string>;

  constructor() {
    super('TravelLogDB');
    this.version(1).stores({
      trips: 'id, startDate, endDate, *districtCodes, createdAt',
      photos: 'id, tripId, districtCode, takenAt, createdAt'
    });
  }
}

export const db = new TravelLogDB();

// 기본 헬퍼 함수들
export async function getAllTrips(): Promise<Trip[]> {
  return await db.trips.orderBy('startDate').reverse().toArray();
}

export async function getTripById(id: string): Promise<Trip | undefined> {
  return await db.trips.get(id);
}

export async function saveTrip(trip: Trip): Promise<string> {
  return await db.trips.put(trip);
}

export async function deleteTrip(id: string): Promise<void> {
  await db.transaction('rw', db.trips, db.photos, async () => {
    await db.trips.delete(id);
    await db.photos.where('tripId').equals(id).delete();
  });
}

export async function getPhotosByTripId(tripId: string): Promise<PhotoItem[]> {
  return await db.photos.where('tripId').equals(tripId).toArray();
}

export async function getPhotosByDistrictCode(districtCode: string): Promise<PhotoItem[]> {
  return await db.photos.where('districtCode').equals(districtCode).toArray();
}

export async function getAllPhotos(): Promise<PhotoItem[]> {
  return await db.photos.orderBy('takenAt').reverse().toArray();
}

export async function savePhoto(photo: PhotoItem): Promise<string> {
  return await db.photos.put(photo);
}

export async function savePhotos(photos: PhotoItem[]): Promise<void> {
  await db.photos.bulkPut(photos);
}

export async function deletePhoto(id: string): Promise<void> {
  await db.photos.delete(id);
}

export async function clearAllData(): Promise<void> {
  await db.transaction('rw', db.trips, db.photos, async () => {
    await db.trips.clear();
    await db.photos.clear();
  });
}
