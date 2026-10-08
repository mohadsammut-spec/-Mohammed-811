import { CargoItem, City, HiredDriver, TruckConfig } from '../types/game';

export const EUROPEAN_CITIES: City[] = [
  {
    id: 'berlin',
    name: 'برلين',
    nameEn: 'Berlin',
    country: 'ألمانيا',
    countryCode: 'DE',
    x: 58,
    y: 35,
    hasGarage: true,
    description: 'العاصمة الصناعية ومفترق طرق الشحن الأوروبي الرئيسي.',
  },
  {
    id: 'paris',
    name: 'باريس',
    nameEn: 'Paris',
    country: 'فرنسا',
    countryCode: 'FR',
    x: 32,
    y: 52,
    hasGarage: false,
    description: 'مركز لوجستي غربي يربط بين موانئ الأطلسي وجنوب أوروبا.',
  },
  {
    id: 'amsterdam',
    name: 'أمستردام',
    nameEn: 'Amsterdam',
    country: 'هولندا',
    countryCode: 'NL',
    x: 40,
    y: 34,
    hasGarage: false,
    description: 'ميناء روتردام وأمستردام العالمي لنقل الحاويات الدولية.',
  },
  {
    id: 'prague',
    name: 'براغ',
    nameEn: 'Prague',
    country: 'التشيك',
    countryCode: 'CZ',
    x: 64,
    y: 48,
    hasGarage: false,
    description: 'بوابة أوروبا الوسطى ومصانع الهندسة الميكانيكية.',
  },
  {
    id: 'milan',
    name: 'ميلانو',
    nameEn: 'Milan',
    country: 'إيطاليا',
    countryCode: 'IT',
    x: 48,
    y: 72,
    hasGarage: false,
    description: 'عاصمة التجارة الإيطالية ونقل البضائع عبر جبال الألب.',
  },
  {
    id: 'vienna',
    name: 'فيينا',
    nameEn: 'Vienna',
    country: 'النمسا',
    countryCode: 'AT',
    x: 70,
    y: 58,
    hasGarage: false,
    description: 'محور الشحن بين البلقان وألمانيا مع مسارات جبلية مذهلة.',
  },
  {
    id: 'zurich',
    name: 'زيورخ',
    nameEn: 'Zurich',
    country: 'سويسرا',
    countryCode: 'CH',
    x: 46,
    y: 62,
    hasGarage: false,
    description: 'طرق جبلية دقيقة تتطلب شاحنات قوية وفرامل هيدروليكية.',
  },
  {
    id: 'madrid',
    name: 'مدريد',
    nameEn: 'Madrid',
    country: 'إسبانيا',
    countryCode: 'ES',
    x: 18,
    y: 84,
    hasGarage: false,
    description: 'شريان النقل السريع للسلع الزراعية والصناعية في شبه الجزيرة.',
  },
  {
    id: 'warsaw',
    name: 'وارسو',
    nameEn: 'Warsaw',
    country: 'بولندا',
    countryCode: 'PL',
    x: 78,
    y: 36,
    hasGarage: false,
    description: 'مركز التوزيع الأسرع نمواً لخدمة دول البلطيق والشرق.',
  },
];

export const CARGO_CATALOG: CargoItem[] = [
  {
    id: 'cargo_food',
    title: 'أغذية ومنتجات مبردة',
    titleEn: 'Chilled Food & Dairy',
    category: 'food',
    weightTons: 18,
    fragile: false,
    adrHazardous: false,
    ratePerKm: 26,
    trailerType: 'refrigerated',
    iconName: 'Apple',
  },
  {
    id: 'cargo_fuel',
    title: 'وقود ومركبات نفطية (ADR)',
    titleEn: 'Petroleum & Chemicals (ADR)',
    category: 'fuel',
    weightTons: 28,
    fragile: true,
    adrHazardous: true,
    ratePerKm: 42,
    trailerType: 'tanker',
    iconName: 'Flame',
  },
  {
    id: 'cargo_machinery',
    title: 'توربينات وآلات ثقيلة',
    titleEn: 'Heavy Industrial Turbines',
    category: 'machinery',
    weightTons: 36,
    fragile: false,
    adrHazardous: false,
    ratePerKm: 52,
    trailerType: 'flatbed',
    iconName: 'Cog',
  },
  {
    id: 'cargo_luxury_cars',
    title: 'سيارات رياضية فاخرة',
    titleEn: 'Luxury Sports Vehicles',
    category: 'automotive',
    weightTons: 14,
    fragile: true,
    adrHazardous: false,
    ratePerKm: 48,
    trailerType: 'car_carrier',
    iconName: 'Car',
  },
  {
    id: 'cargo_pharma',
    title: 'مستلزمات طبية وأدوية دقيقة',
    titleEn: 'High-Value Pharmaceuticals',
    category: 'pharma',
    weightTons: 11,
    fragile: true,
    adrHazardous: false,
    ratePerKm: 38,
    trailerType: 'curtain',
    iconName: 'Activity',
  },
  {
    id: 'cargo_electronics',
    title: 'معالجات وإلكترونيات استهلاكية',
    titleEn: 'High-End Consumer Electronics',
    category: 'electronics',
    weightTons: 16,
    fragile: true,
    adrHazardous: false,
    ratePerKm: 45,
    trailerType: 'curtain',
    iconName: 'Cpu',
  },
];

export const AVAILABLE_TRUCK_MODELS: TruckConfig[] = [
  {
    id: 'truck_scania_v8',
    modelName: 'Hyper V8 Streamline',
    brand: 'Scania Series',
    chassis: '6x4',
    engineHp: 730,
    transmissionGears: 16,
    color: '#D92D20', // Crimson red
    hasRoofLightbar: true,
    hasBullbar: true,
    hasDualExhaust: true,
    interiorAccessory: 'led_ambient',
    price: 185000,
  },
  {
    id: 'truck_volvo_fh',
    modelName: 'Iron Viking FH 540',
    brand: 'Volvo Globetrotter',
    chassis: '6x2',
    engineHp: 540,
    transmissionGears: 12,
    color: '#0284C7', // Nordic Cyan Blue
    hasRoofLightbar: true,
    hasBullbar: false,
    hasDualExhaust: true,
    interiorAccessory: 'gps_unit',
    price: 145000,
  },
  {
    id: 'truck_man_tgx',
    modelName: 'Bavarian Lion TGX',
    brand: 'MAN Heavy',
    chassis: '4x2',
    engineHp: 480,
    transmissionGears: 12,
    color: '#F59E0B', // Amber Gold
    hasRoofLightbar: false,
    hasBullbar: false,
    hasDualExhaust: false,
    interiorAccessory: 'classic_flag',
    price: 115000,
  },
  {
    id: 'truck_actros_star',
    modelName: 'Stuttgart Star GigaSpace',
    brand: 'Actros Series',
    chassis: '4x2',
    engineHp: 450,
    transmissionGears: 12,
    color: '#334155', // Slate Anthracite
    hasRoofLightbar: false,
    hasBullbar: false,
    hasDualExhaust: false,
    interiorAccessory: 'gps_unit',
    price: 120000,
  },
];

export const ENGINE_UPGRADES = [
  { hp: 420, torqueNm: 2100, cost: 0, title: 'محرك اقتصادي 420 حصان (قياسي)' },
  { hp: 480, torqueNm: 2400, cost: 18000, title: 'محرك تيربو ديزل 480 حصان' },
  { hp: 540, torqueNm: 2600, cost: 32000, title: 'محرك يورو-6 بقوة 540 حصان' },
  { hp: 650, torqueNm: 3100, cost: 48000, title: 'محرك سداسي الأسطوانات 650 حصان' },
  { hp: 750, torqueNm: 3550, cost: 68000, title: 'محرك الأسطول الجبار V8 بقوة 750 حصان' },
];

export const TRANSMISSION_UPGRADES = [
  { gears: 6, retarder: false, cost: 0, title: 'ناقل يدوي 6 سرعات' },
  { gears: 12, retarder: false, cost: 14000, title: 'ناقل أوتوماتيكي ذكي 12 سرعة' },
  { gears: 16, retarder: true, cost: 29000, title: 'ناقل ثقيل 16 سرعة مع فرامل ريتاردر مائية' },
];

export const CHASSIS_CONFIGS = [
  {
    type: '4x2' as const,
    name: 'هيكل 4x2 قياسي',
    description: 'خفيف وسريع، ممتاز للشحنات المتوسطة واستهلاك وقود منخفض.',
    cost: 0,
    maxWeight: 22,
  },
  {
    type: '6x2' as const,
    name: 'هيكل 6x2 مع محور رفع (Midlift)',
    description: 'محور إضافي قابل للرفع عند الحاجة لتوزيع الأحمال الثقيلة.',
    cost: 22000,
    maxWeight: 32,
  },
  {
    type: '6x4' as const,
    name: 'هيكل 6x4 دفع ثنائي ثقيل',
    description: 'أقصى ثبات وتحكم للمعدات الصناعية والمنحدرات الجبلية.',
    cost: 38000,
    maxWeight: 44,
  },
];

export const TRUCK_COLORS = [
  { name: 'أحمر قرمزي ناري', hex: '#D92D20' },
  { name: 'أزرق اسكندنافي معدني', hex: '#0284C7' },
  { name: 'عنبري ذهبي ملكي', hex: '#F59E0B' },
  { name: 'رمادي فحمي داكن', hex: '#1E293B' },
  { name: 'أبيض قطبي لؤلؤي', hex: '#F8FAFC' },
  { name: 'أخضر زمردي بريطاني', hex: '#059669' },
  { name: 'أسود منتصف الليل مطفي', hex: '#09090B' },
];

export const INITIAL_DRIVERS_POOL: HiredDriver[] = [
  {
    id: 'drv_1',
    name: 'ماركوس شميدت',
    avatar: '👨‍✈️',
    rating: 4.8,
    salaryPerDay: 420,
    assignedTruckId: null,
    assignedRoute: 'برلين - أمستردام',
    dailyEarnings: 1850,
    status: 'idle',
  },
  {
    id: 'drv_2',
    name: 'جان لوك ديبوا',
    avatar: '🧑‍💼',
    rating: 4.5,
    salaryPerDay: 380,
    assignedTruckId: null,
    assignedRoute: 'باريس - ميلانو',
    dailyEarnings: 1620,
    status: 'idle',
  },
  {
    id: 'drv_3',
    name: 'ماتيو روسي',
    avatar: '🧔',
    rating: 4.2,
    salaryPerDay: 340,
    assignedTruckId: null,
    assignedRoute: 'ميلانو - زيورخ',
    dailyEarnings: 1480,
    status: 'idle',
  },
  {
    id: 'drv_4',
    name: 'لوكا نوفاك',
    avatar: '👨',
    rating: 3.9,
    salaryPerDay: 290,
    assignedTruckId: null,
    assignedRoute: 'براغ - فيينا',
    dailyEarnings: 1250,
    status: 'idle',
  },
];

export function calculateDistanceBetweenCities(cityA: City, cityB: City): number {
  const dx = cityA.x - cityB.x;
  const dy = cityA.y - cityB.y;
  const baseEuclidean = Math.sqrt(dx * dx + dy * dy);
  // Scale to realistic km (approx 200km to 1200km between European cities)
  return Math.round(Math.max(180, baseEuclidean * 14.5));
}

export function generateJobsList(cities: City[] = EUROPEAN_CITIES): import('../types/game').Job[] {
  const jobs: import('../types/game').Job[] = [];
  let idCounter = 1;

  for (let i = 0; i < cities.length; i++) {
    for (let j = 0; j < cities.length; j++) {
      if (i === j) continue;
      const fromCity = cities[i];
      const toCity = cities[j];
      const dist = calculateDistanceBetweenCities(fromCity, toCity);
      
      // Select 1-2 cargo types for this route
      const cargoIndex = (i * 3 + j) % CARGO_CATALOG.length;
      const cargo = CARGO_CATALOG[cargoIndex];
      const reward = Math.round(dist * cargo.ratePerKm * (1 + cargo.weightTons * 0.015));
      const xp = Math.round(dist * 1.4 + (cargo.adrHazardous ? 250 : 100));

      jobs.push({
        id: `job_${idCounter++}`,
        cargo,
        fromCity,
        toCity,
        distanceKm: dist,
        rewardEuro: reward,
        xpReward: xp,
        deadlineHours: Math.round(dist / 65 + 4),
      });

      if (jobs.length >= 18) break;
    }
    if (jobs.length >= 18) break;
  }

  return jobs;
}
