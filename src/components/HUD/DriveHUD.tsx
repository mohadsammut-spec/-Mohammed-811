import React from 'react';
import {
  Gauge,
  Fuel,
  Moon,
  AlertTriangle,
  Camera,
  Sun,
  CloudRain,
  CloudFog,
  Sunset,
  Volume2,
  VolumeX,
  Wrench,
  Navigation,
  Key,
  ShieldAlert,
} from 'lucide-react';
import { CameraView, Job, WeatherType } from '../../types/game';

interface DriveHUDProps {
  speedKmH: number;
  rpm: number;
  gear: number | string;
  fuelLiters: number;
  maxFuelLiters: number;
  fatiguePercent: number;
  truckDamagePercent: number;
  cargoDamagePercent: number;
  activeJob: Job | null;
  distanceRemainingKm: number;
  weather: WeatherType;
  cameraView: CameraView;
  isEngineStarted: boolean;
  isHeadlightsActive: boolean;
  isWipersActive: boolean;
  isMuted: boolean;
  nearGasStation: boolean;
  nearRestStop: boolean;
  recentInfraction: { message: string; fine: number } | null;
  onToggleEngine: () => void;
  onToggleHeadlights: () => void;
  onToggleWipers: () => void;
  onToggleMute: () => void;
  onChangeCamera: (view: CameraView) => void;
  onChangeWeather: (weather: WeatherType) => void;
  onRefuel: () => void;
  onRest: () => void;
  onRepair: () => void;
  onHonkHorn: () => void;
  onOpenJobMarket: () => void;
  onOpenFleet: () => void;
  onOpenGarage: () => void;
}

export const DriveHUD: React.FC<DriveHUDProps> = ({
  speedKmH,
  rpm,
  gear,
  fuelLiters,
  maxFuelLiters,
  fatiguePercent,
  truckDamagePercent,
  cargoDamagePercent,
  activeJob,
  distanceRemainingKm,
  weather,
  cameraView,
  isEngineStarted,
  isHeadlightsActive,
  isWipersActive,
  isMuted,
  nearGasStation,
  nearRestStop,
  recentInfraction,
  onToggleEngine,
  onToggleHeadlights,
  onToggleWipers,
  onToggleMute,
  onChangeCamera,
  onChangeWeather,
  onRefuel,
  onRest,
  onRepair,
  onHonkHorn,
  onOpenJobMarket,
  onOpenFleet,
  onOpenGarage,
}) => {
  const fuelPercent = Math.max(0, Math.min(100, (fuelLiters / maxFuelLiters) * 100));
  const isSpeeding = speedKmH > 80;
  const isExhausted = fatiguePercent > 80;

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 z-20">
      {/* Top Banner: Active Job Navigator & Weather Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Navigation GPS Bar */}
        {activeJob ? (
          <div className="pointer-events-auto bg-neutral-900/90 backdrop-blur-md border border-neutral-700/60 rounded-xl px-4 py-2.5 flex items-center gap-4 text-white shadow-xl">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Navigation className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs text-neutral-400">
                <span>{activeJob.fromCity.name}</span>
                <span>←</span>
                <span className="font-semibold text-amber-400">{activeJob.toCity.name}</span>
                <span>·</span>
                <span>{activeJob.cargo.title}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="font-bold font-mono text-emerald-400">
                  {Math.max(0, Math.round(distanceRemainingKm))} كم متبقي
                </span>
                <span className="text-neutral-500">|</span>
                <span className="text-xs text-neutral-300">
                  المكافأة: <strong className="text-amber-400">€{activeJob.rewardEuro.toLocaleString()}</strong>
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="pointer-events-auto bg-neutral-900/90 backdrop-blur-md border border-neutral-700/60 rounded-xl px-4 py-2.5 flex items-center gap-3 text-white shadow-xl">
            <span className="text-xs text-neutral-400">وضع التجوال الحر (بدون حمولة نشطة)</span>
            <button
              onClick={onOpenJobMarket}
              className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              اختيار مهمة شحن
            </button>
          </div>
        )}

        {/* Dynamic Weather & Time of Day Switcher */}
        <div className="pointer-events-auto flex items-center gap-1 bg-neutral-900/90 backdrop-blur-md border border-neutral-700/60 rounded-xl p-1 text-white shadow-xl">
          <button
            onClick={() => onChangeWeather('clear')}
            title="نهار مشمس"
            className={`p-2 rounded-lg text-xs transition-colors cursor-pointer ${
              weather === 'clear' ? 'bg-amber-500 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Sun className="w-4 h-4" />
          </button>
          <button
            onClick={() => onChangeWeather('sunset')}
            title="غروب أوروبي"
            className={`p-2 rounded-lg text-xs transition-colors cursor-pointer ${
              weather === 'sunset' ? 'bg-amber-500 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Sunset className="w-4 h-4" />
          </button>
          <button
            onClick={() => onChangeWeather('rain')}
            title="طقس ممطر"
            className={`p-2 rounded-lg text-xs transition-colors cursor-pointer ${
              weather === 'rain' ? 'bg-amber-500 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <CloudRain className="w-4 h-4" />
          </button>
          <button
            onClick={() => onChangeWeather('fog')}
            title="ضباب جبال الألب"
            className={`p-2 rounded-lg text-xs transition-colors cursor-pointer ${
              weather === 'fog' ? 'bg-amber-500 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <CloudFog className="w-4 h-4" />
          </button>
          <button
            onClick={() => onChangeWeather('night')}
            title="ليل دامس"
            className={`p-2 rounded-lg text-xs transition-colors cursor-pointer ${
              weather === 'night' ? 'bg-amber-500 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Moon className="w-4 h-4" />
          </button>
        </div>

        {/* Camera Views & Audio Mute */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-neutral-900/90 backdrop-blur-md border border-neutral-700/60 rounded-xl p-1.5 text-white shadow-xl">
          <button
            onClick={() => {
              const order: CameraView[] = ['chase', 'cockpit', 'hood', 'topdown'];
              const next = order[(order.indexOf(cameraView) + 1) % order.length];
              onChangeCamera(next);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors cursor-pointer"
            title="تبديل زاوية الكاميرا (C)"
          >
            <Camera className="w-3.5 h-3.5" />
            <span className="font-mono uppercase">
              {cameraView === 'chase' ? 'خارجي' : cameraView === 'cockpit' ? 'الكابينة' : cameraView === 'hood' ? 'مقدمة' : 'علوي'}
            </span>
          </button>
          <button
            onClick={onToggleMute}
            className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
              isMuted ? 'bg-rose-500/20 text-rose-400' : 'bg-neutral-800 text-neutral-300 hover:text-white'
            }`}
            title="كتم / تفعيل الصوت"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Center Alerts & Interactive Gas/Rest Banners */}
      <div className="flex flex-col items-center gap-3">
        {/* Infraction Toast */}
        {recentInfraction && (
          <div className="pointer-events-auto animate-bounce bg-rose-600/95 text-white px-5 py-2.5 rounded-xl border border-rose-400 shadow-2xl flex items-center gap-3 text-sm font-bold">
            <ShieldAlert className="w-5 h-5" />
            <span>{recentInfraction.message}</span>
            <span className="bg-black/40 px-2 py-0.5 rounded text-amber-300 font-mono">
              -€{recentInfraction.fine}
            </span>
          </div>
        )}

        {/* Near Gas Station prompt */}
        {nearGasStation && (
          <div className="pointer-events-auto bg-neutral-900/95 border-2 border-emerald-500 text-white p-3.5 rounded-2xl shadow-2xl flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Fuel className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="text-sm font-bold">أنت الآن في محطة الوقود الأوروبية</div>
              <div className="text-xs text-neutral-400">سعر اللتر: €1.85 ديزل تجاري</div>
            </div>
            <button
              onClick={onRefuel}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer whitespace-nowrap"
            >
              تعبئة الخزان بالكامل
            </button>
          </div>
        )}

        {/* Near Rest Stop prompt */}
        {nearRestStop && (
          <div className="pointer-events-auto bg-neutral-900/95 border-2 border-blue-500 text-white p-3.5 rounded-2xl shadow-2xl flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Moon className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="text-sm font-bold">استراحة الطريق السريع وفندق السائقين</div>
              <div className="text-xs text-neutral-400">أخذ قسط من النوم لاستعادة النشاط والتركيز</div>
            </div>
            <button
              onClick={onRest}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer whitespace-nowrap"
            >
              النوم والراحة (8 ساعات)
            </button>
          </div>
        )}

        {/* Driver Exhaustion Warning */}
        {isExhausted && (
          <div className="bg-amber-600/90 text-white px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 animate-pulse">
            <AlertTriangle className="w-4 h-4" />
            <span>تحذير: السائق متعب جداً! قد يغفو أثناء القيادة. توقف عند أقرب استراحة.</span>
          </div>
        )}
      </div>

      {/* Bottom Main Cockpit HUD Cluster */}
      <div className="flex flex-col md:flex-row items-end justify-between gap-4">
        {/* Speedometer & Gear & Damage Cluster (Left) */}
        <div className="pointer-events-auto bg-neutral-900/90 backdrop-blur-md border border-neutral-700/60 rounded-2xl p-4 text-white shadow-2xl flex items-center gap-5">
          {/* Circular / Digital Speedometer */}
          <div className="flex flex-col items-center">
            <div className="relative w-28 h-28 rounded-full border-4 border-neutral-700/80 bg-neutral-950 flex flex-col items-center justify-center shadow-inner">
              <span className={`text-4xl font-extrabold font-mono tracking-tighter ${isSpeeding ? 'text-rose-500 animate-pulse' : 'text-neutral-100'}`}>
                {speedKmH}
              </span>
              <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">كم/ساعة</span>
              {/* Speed Limit European Badge */}
              <div className="absolute top-1 right-1 w-6 h-6 rounded-full border-2 border-rose-600 bg-white text-neutral-950 text-[10px] font-black flex items-center justify-center">
                80
              </div>
            </div>
            <div className="mt-1 text-xs text-neutral-400 flex items-center gap-1 font-mono">
              <Gauge className="w-3.5 h-3.5" />
              <span>RPM: {rpm}</span>
            </div>
          </div>

          {/* Gear Box & Drive Status */}
          <div className="flex flex-col gap-2 min-w-[110px]">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5">
              <span className="text-xs text-neutral-400">الغيّار:</span>
              <span className="text-2xl font-black font-mono text-amber-400 bg-neutral-950 px-3 py-0.5 rounded-md border border-neutral-800">
                {gear}
              </span>
            </div>
            <div className="text-[11px] text-neutral-400 flex flex-col gap-1">
              <div className="flex justify-between">
                <span>تلف الشاحنة:</span>
                <span className={`font-mono font-bold ${truckDamagePercent > 40 ? 'text-rose-400' : 'text-neutral-200'}`}>
                  {truckDamagePercent}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>تلف الحمولة:</span>
                <span className={`font-mono font-bold ${cargoDamagePercent > 20 ? 'text-rose-400' : 'text-neutral-200'}`}>
                  {cargoDamagePercent}%
                </span>
              </div>
            </div>
            <button
              onClick={onRepair}
              className="mt-1 text-[11px] px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded flex items-center justify-center gap-1 transition-colors cursor-pointer"
              title="إصلاح طوارئ الشاحنة"
            >
              <Wrench className="w-3 h-3 text-amber-400" />
              <span>صيانة سريعة (€400)</span>
            </button>
          </div>
        </div>

        {/* Controls Bar & Mobile Touch Affordances (Center) */}
        <div className="pointer-events-auto bg-neutral-900/90 backdrop-blur-md border border-neutral-700/60 rounded-2xl p-2.5 flex items-center gap-2 shadow-2xl">
          <button
            onClick={onToggleEngine}
            className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isEngineStarted
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40'
                : 'bg-neutral-800 text-neutral-400 hover:text-white'
            }`}
            title="تشغيل / إيقاف المحرك (E)"
          >
            <Key className="w-4 h-4 mb-0.5" />
            <span className="text-[10px]">{isEngineStarted ? 'شغال' : 'تشغيل'}</span>
          </button>

          <button
            onClick={onToggleHeadlights}
            className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isHeadlightsActive
                ? 'bg-amber-500 text-neutral-950 shadow-lg shadow-amber-900/40'
                : 'bg-neutral-800 text-neutral-400 hover:text-white'
            }`}
            title="الأضواء الأمامية (L)"
          >
            <Sun className="w-4 h-4 mb-0.5" />
            <span className="text-[10px]">الأضواء</span>
          </button>

          <button
            onClick={onToggleWipers}
            className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isWipersActive
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-neutral-800 text-neutral-400 hover:text-white'
            }`}
            title="مساحات المطر (P)"
          >
            <CloudRain className="w-4 h-4 mb-0.5" />
            <span className="text-[10px]">المساحات</span>
          </button>

          <button
            onClick={onHonkHorn}
            className="flex flex-col items-center justify-center w-12 h-12 rounded-xl text-xs font-bold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-all cursor-pointer"
            title="بوق الشاحنة (H)"
          >
            <AlertTriangle className="w-4 h-4 mb-0.5 text-amber-400" />
            <span className="text-[10px]">بوق V8</span>
          </button>
        </div>

        {/* Gauges: Fuel & Driver Fatigue (Right) */}
        <div className="pointer-events-auto bg-neutral-900/90 backdrop-blur-md border border-neutral-700/60 rounded-2xl p-4 text-white shadow-2xl flex flex-col gap-3 min-w-[210px]">
          {/* Fuel Level */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="flex items-center gap-1.5 text-neutral-300">
                <Fuel className="w-3.5 h-3.5 text-amber-400" />
                <span>الوقود:</span>
              </span>
              <span className="font-mono text-xs font-bold">
                {Math.round(fuelLiters)} / {maxFuelLiters} L ({Math.round(fuelPercent)}%)
              </span>
            </div>
            <div className="w-full bg-neutral-800 h-2.5 rounded-full overflow-hidden border border-neutral-700">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  fuelPercent < 20 ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'
                }`}
                style={{ width: `${fuelPercent}%` }}
              />
            </div>
          </div>

          {/* Driver Fatigue Level */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="flex items-center gap-1.5 text-neutral-300">
                <Moon className="w-3.5 h-3.5 text-blue-400" />
                <span>إرهاق السائق:</span>
              </span>
              <span className="font-mono text-xs font-bold">
                {Math.round(fatiguePercent)}%
              </span>
            </div>
            <div className="w-full bg-neutral-800 h-2.5 rounded-full overflow-hidden border border-neutral-700">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  fatiguePercent > 80 ? 'bg-rose-500 animate-pulse' : 'bg-blue-500'
                }`}
                style={{ width: `${fatiguePercent}%` }}
              />
            </div>
          </div>

          {/* Quick Menu shortcuts */}
          <div className="flex items-center gap-2 pt-1 border-t border-neutral-800 text-[11px]">
            <button
              onClick={onOpenJobMarket}
              className="flex-1 py-1 px-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-center transition-colors cursor-pointer"
            >
              سوق الشحن
            </button>
            <button
              onClick={onOpenFleet}
              className="flex-1 py-1 px-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-center transition-colors cursor-pointer"
            >
              الأسطول
            </button>
            <button
              onClick={onOpenGarage}
              className="flex-1 py-1 px-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-center transition-colors cursor-pointer"
            >
              الكراج
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
