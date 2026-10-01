export type FarmStatus =
  | 'REGISTERED'
  | 'DATA_COLLECTION'
  | 'ASSESSED'
  | 'CARBON_CANDIDATE';

export type Farm = {
  id: string;
  userId: string;
  digitalFarmId: string;
  name: string;
  lat: number;
  lng: number;
  landAreaHa: number;
  commodity: string;
  status: FarmStatus;
  createdAt: string;
  updatedAt: string;
};

export type CreateFarmInput = {
  name: string;
  lat: number;
  lng: number;
  landAreaHa: number;
  commodity: string;
};

export const farmStatusLabel: Record<FarmStatus, string> = {
  REGISTERED: 'Terdaftar',
  DATA_COLLECTION: 'Pengumpulan Data',
  ASSESSED: 'Terukur',
  CARBON_CANDIDATE: 'Kandidat Karbon',
};
