export type WeatherType = 'clear' | 'sunset' | 'rain' | 'fog' | 'night';

export type CameraView = 'chase' | 'cockpit' | 'topdown' | 'hood';

export type ChassisType = '4x2' | '6x2' | '6x4';

export interface City {
  id: string;
  name: string;
  nameEn: string;
  country: string;
  countryCode: string;
  x: number; // map coord
  y: number;
  hasGarage: boolean;
  description: string;
}

export interface CargoItem {
  id: string;
  title: string;
  titleEn: string;
  category: 'food' | 'fuel' | 'machinery' | 'automotive' | 'electronics' | 'pharma';
  weightTons: number;
  fragile: boolean;
  adrHazardous: boolean;
  ratePerKm: number;
  trailerType: 'curtain' | 'tanker' | 'flatbed' | 'car_carrier' | 'refrigerated';
  iconName: string;
}

export interface Job {
  id: string;
  cargo: CargoItem;
  fromCity: City;
  toCity: City;
  distanceKm: number;
  rewardEuro: number;
  xpReward: number;
  deadlineHours: number;
}

export interface TruckConfig {
  id: string;
  modelName: string;
  brand: string;
  chassis: ChassisType;
  engineHp: number;
  transmissionGears: number;
  color: string;
  hasRoofLightbar: boolean;
  hasBullbar: boolean;
  hasDualExhaust: boolean;
  interiorAccessory: 'gps_unit' | 'led_ambient' | 'classic_flag' | 'none';
  price: number;
}

export interface HiredDriver {
  id: string;
  name: string;
  avatar: string;
  rating: number; // 1 to 5
  salaryPerDay: number;
  assignedTruckId: string | null;
  assignedRoute: string;
  dailyEarnings: number;
  status: 'driving' | 'resting' | 'idle';
}

export interface Garage {
  cityId: string;
  slots: number;
  level: number;
  purchaseCost: number;
}

export interface PlayerCareer {
  companyName: string;
  money: number;
  xp: number;
  level: number;
  completedJobsCount: number;
  totalDistanceDrivenKm: number;
  activeJob: {
    job: Job;
    distanceRemainingKm: number;
    cargoDamagePercent: number;
    truckDamagePercent: number;
    infractionsCount: number;
    fuelLiters: number;
    fatiguePercent: number; // 0 (rested) to 100 (exhausted)
  } | null;
  ownedTrucks: TruckConfig[];
  currentTruckIndex: number;
  garages: Garage[];
  drivers: HiredDriver[];
  bankDebt: number;
}
