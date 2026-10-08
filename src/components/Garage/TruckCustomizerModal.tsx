import React, { useState } from 'react';
import { X, Wrench, Palette, Zap, Gauge, Sparkles, Check, DollarSign } from 'lucide-react';
import { ChassisType, TruckConfig } from '../../types/game';
import { CHASSIS_CONFIGS, ENGINE_UPGRADES, TRANSMISSION_UPGRADES, TRUCK_COLORS } from '../../data/gameData';
import { truckAudio } from '../../services/sound';

interface TruckCustomizerModalProps {
  currentTruck: TruckConfig;
  playerMoney: number;
  onUpdateTruck: (updatedTruck: TruckConfig, cost: number) => void;
  onClose: () => void;
}

export const TruckCustomizerModal: React.FC<TruckCustomizerModalProps> = ({
  currentTruck,
  playerMoney,
  onUpdateTruck,
  onClose,
}) => {
  const [truckDraft, setTruckDraft] = useState<TruckConfig>({ ...currentTruck });
  const [activeTab, setActiveTab] = useState<'paint' | 'chassis' | 'engine' | 'transmission' | 'accessories'>('paint');

  // Calculate difference cost from currentTruck
  const calculateTotalCost = () => {
    let cost = 0;
    // Engine difference
    const currentEng = ENGINE_UPGRADES.find((e) => e.hp === currentTruck.engineHp)?.cost || 0;
    const draftEng = ENGINE_UPGRADES.find((e) => e.hp === truckDraft.engineHp)?.cost || 0;
    if (draftEng > currentEng) cost += (draftEng - currentEng);

    // Chassis difference
    const currentChassis = CHASSIS_CONFIGS.find((c) => c.type === currentTruck.chassis)?.cost || 0;
    const draftChassis = CHASSIS_CONFIGS.find((c) => c.type === truckDraft.chassis)?.cost || 0;
    if (draftChassis > currentChassis) cost += (draftChassis - currentChassis);

    // Transmission difference
    const currentTrans = TRANSMISSION_UPGRADES.find((t) => t.gears === currentTruck.transmissionGears)?.cost || 0;
    const draftTrans = TRANSMISSION_UPGRADES.find((t) => t.gears === truckDraft.transmissionGears)?.cost || 0;
    if (draftTrans > currentTrans) cost += (draftTrans - currentTrans);

    // Color change fee if changed
    if (truckDraft.color !== currentTruck.color) cost += 3500;

    // Accessories
    if (truckDraft.hasRoofLightbar && !currentTruck.hasRoofLightbar) cost += 4800;
    if (truckDraft.hasBullbar && !currentTruck.hasBullbar) cost += 6200;
    if (truckDraft.hasDualExhaust && !currentTruck.hasDualExhaust) cost += 5500;

    return cost;
  };

  const totalCost = calculateTotalCost();
  const canAfford = playerMoney >= totalCost;

  const handleApplyModifications = () => {
    if (!canAfford) return;
    truckAudio.playCashPayout();
    onUpdateTruck(truckDraft, totalCost);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/85 backdrop-blur-md">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-neutral-100">
        {/* Header */}
        <div className="px-6 py-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">ورشة التعديل والتخصيص الأوروبية (Workshop Garage)</h2>
              <p className="text-xs text-neutral-400">
                تطوير المحركات، نظام نقل الحركة، صبغة الهيكل، محاور العجلات والإكسسوارات الخارجية
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Truck Specs Ribbon Preview */}
        <div className="px-6 py-4 bg-neutral-950/60 border-b border-neutral-800/80 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-2xl shadow-inner border border-white/20 flex items-center justify-center"
              style={{ backgroundColor: truckDraft.color }}
            >
              <span className="text-xs font-mono font-bold text-white drop-shadow">V8</span>
            </div>
            <div>
              <div className="text-base font-bold text-white">{truckDraft.modelName}</div>
              <div className="text-xs text-neutral-400 flex items-center gap-2">
                <span>المحرك: <strong className="text-amber-400">{truckDraft.engineHp} حصان</strong></span>
                <span>·</span>
                <span>الهيكل: <strong className="text-neutral-200">{truckDraft.chassis}</strong></span>
                <span>·</span>
                <span>الغيارات: <strong className="text-neutral-200">{truckDraft.transmissionGears} سرعة</strong></span>
              </div>
            </div>
          </div>

          {/* Upgrades total cost */}
          <div className="flex items-center gap-3">
            <div className="text-left">
              <div className="text-xs text-neutral-400">تكلفة التعديلات:</div>
              <div className="text-lg font-black font-mono text-amber-400">
                €{totalCost.toLocaleString()}
              </div>
            </div>
            <button
              onClick={handleApplyModifications}
              disabled={!canAfford || totalCost === 0}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                totalCost === 0
                  ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                  : canAfford
                  ? 'bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-lg shadow-amber-500/20'
                  : 'bg-rose-900/60 text-rose-300 cursor-not-allowed'
              }`}
            >
              {canAfford ? 'تطبيق وشراء التعديلات' : 'الرصيد المالي غير كافٍ'}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 py-3 border-b border-neutral-800 flex items-center gap-2 text-xs overflow-x-auto bg-neutral-900/30">
          {[
            { id: 'paint', label: 'صبغة الهيكل ولون الكابينة', icon: Palette },
            { id: 'chassis', label: 'محاور الهيكل (Chassis)', icon: Gauge },
            { id: 'engine', label: 'قوة المحرك (Engine HP)', icon: Zap },
            { id: 'transmission', label: 'ناقل الحركة (Transmission)', icon: Gauge },
            { id: 'accessories', label: 'الإكسسوارات الخارجية', icon: Sparkles },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl whitespace-nowrap transition-colors cursor-pointer font-medium ${
                  activeTab === tab.id
                    ? 'bg-amber-500 text-neutral-950 font-bold'
                    : 'bg-neutral-800 text-neutral-300 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Paint Tab */}
          {activeTab === 'paint' && (
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-neutral-300">اختر لون طلاء الشاحنة (€3,500 للصبغة المخصصة):</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {TRUCK_COLORS.map((col) => (
                  <button
                    key={col.hex}
                    onClick={() => setTruckDraft({ ...truckDraft, color: col.hex })}
                    className={`flex items-center gap-3 p-3 rounded-2xl border transition-all text-right cursor-pointer ${
                      truckDraft.color === col.hex
                        ? 'border-amber-500 bg-neutral-800/80 ring-2 ring-amber-500/30'
                        : 'border-neutral-800 bg-neutral-950/40 hover:border-neutral-700'
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-xl border border-white/20 shrink-0 shadow"
                      style={{ backgroundColor: col.hex }}
                    />
                    <div className="text-xs font-semibold text-neutral-200">{col.name}</div>
                  </button>
                ))}
              </div>

              {/* Custom Hex Picker */}
              <div className="mt-4 p-4 rounded-2xl bg-neutral-950/50 border border-neutral-800 flex items-center gap-4">
                <span className="text-xs text-neutral-400">أو اختر درجة لون مخصصة:</span>
                <input
                  type="color"
                  value={truckDraft.color}
                  onChange={(e) => setTruckDraft({ ...truckDraft, color: e.target.value })}
                  className="w-12 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <span className="font-mono text-xs text-neutral-300 uppercase">{truckDraft.color}</span>
              </div>
            </div>
          )}

          {/* Chassis Tab */}
          {activeTab === 'chassis' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-neutral-300">محاور الشاحنة وقدرة التحميل:</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {CHASSIS_CONFIGS.map((chassis) => {
                  const isSelected = truckDraft.chassis === chassis.type;
                  return (
                    <div
                      key={chassis.type}
                      onClick={() => setTruckDraft({ ...truckDraft, chassis: chassis.type })}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-amber-500 bg-neutral-800/60 ring-2 ring-amber-500/20'
                          : 'border-neutral-800 bg-neutral-950/50 hover:border-neutral-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-base text-white">{chassis.name}</span>
                          <span className="font-mono text-xs px-2 py-0.5 rounded bg-neutral-800 text-amber-400 font-bold">
                            {chassis.type}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-400 leading-relaxed mb-4">
                          {chassis.description}
                        </p>
                      </div>
                      <div className="pt-3 border-t border-neutral-800 flex items-center justify-between text-xs">
                        <span className="text-neutral-400">الحمولة: حتى {chassis.maxWeight} طن</span>
                        <span className="font-mono font-bold text-amber-400">
                          {chassis.cost === 0 ? 'مشمول' : `+€${chassis.cost.toLocaleString()}`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Engine Tab */}
          {activeTab === 'engine' && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-neutral-300">ترقيات محركات الديزل V8 والتيربو:</h3>
              <div className="space-y-2.5">
                {ENGINE_UPGRADES.map((eng) => {
                  const isSelected = truckDraft.engineHp === eng.hp;
                  return (
                    <div
                      key={eng.hp}
                      onClick={() => setTruckDraft({ ...truckDraft, engineHp: eng.hp })}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'border-amber-500 bg-neutral-800/80 ring-2 ring-amber-500/20'
                          : 'border-neutral-800 bg-neutral-950/50 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-mono font-bold text-sm">
                          {eng.hp}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">{eng.title}</div>
                          <div className="text-xs text-neutral-400 font-mono mt-0.5">
                            عزم الدوران: {eng.torqueNm} Nm · زيادة تسارع وانطلاق في المرتفعات
                          </div>
                        </div>
                      </div>
                      <div className="text-left font-mono font-bold text-sm text-amber-400">
                        {eng.cost === 0 ? 'قياسي' : `€${eng.cost.toLocaleString()}`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Transmission Tab */}
          {activeTab === 'transmission' && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-neutral-300">ناقل الحركة ونظام كبح الريتاردر (Retarder):</h3>
              <div className="space-y-2.5">
                {TRANSMISSION_UPGRADES.map((trans) => {
                  const isSelected = truckDraft.transmissionGears === trans.gears;
                  return (
                    <div
                      key={trans.gears}
                      onClick={() => setTruckDraft({ ...truckDraft, transmissionGears: trans.gears })}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'border-amber-500 bg-neutral-800/80 ring-2 ring-amber-500/20'
                          : 'border-neutral-800 bg-neutral-950/50 hover:border-neutral-700'
                      }`}
                    >
                      <div>
                        <div className="text-sm font-bold text-white">{trans.title}</div>
                        <div className="text-xs text-neutral-400 mt-0.5">
                          {trans.retarder
                            ? 'مزود بفرملة ريتاردر هيدروليكية لمنع ارتفاع حرارة الفرامل في المنحدرات'
                            : 'ناقل حركة اقتصادي قياسي'}
                        </div>
                      </div>
                      <div className="text-left font-mono font-bold text-sm text-amber-400">
                        {trans.cost === 0 ? 'قياسي' : `€${trans.cost.toLocaleString()}`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Accessories Tab */}
          {activeTab === 'accessories' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-neutral-300">إكسسوارات المظهر الخارجي والكابينة:</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Roof Lightbar */}
                <div
                  onClick={() => setTruckDraft({ ...truckDraft, hasRoofLightbar: !truckDraft.hasRoofLightbar })}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    truckDraft.hasRoofLightbar
                      ? 'border-amber-500 bg-neutral-800/80'
                      : 'border-neutral-800 bg-neutral-950/40'
                  }`}
                >
                  <div>
                    <div className="text-sm font-bold text-white mb-1">كشافات سقف علوية كروم</div>
                    <p className="text-xs text-neutral-400">
                      أضواء إضافية عالية السطوع لتحسين الرؤية الليلية في الضباب والأمطار
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-neutral-800 flex justify-between items-center text-xs">
                    <span className="font-mono text-amber-400 font-bold">€4,800</span>
                    <span className={`text-[11px] font-bold ${truckDraft.hasRoofLightbar ? 'text-emerald-400' : 'text-neutral-500'}`}>
                      {truckDraft.hasRoofLightbar ? 'مثبتة' : 'غير مثبتة'}
                    </span>
                  </div>
                </div>

                {/* Bullbar */}
                <div
                  onClick={() => setTruckDraft({ ...truckDraft, hasBullbar: !truckDraft.hasBullbar })}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    truckDraft.hasBullbar
                      ? 'border-amber-500 bg-neutral-800/80'
                      : 'border-neutral-800 bg-neutral-950/40'
                  }`}
                >
                  <div>
                    <div className="text-sm font-bold text-white mb-1">دعامية أمامية فولاذية (Bullbar)</div>
                    <p className="text-xs text-neutral-400">
                      حماية أمامية للشاحنة من الصدمات الخفيفة وتقليل تلف المحرك بنسبة 25%
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-neutral-800 flex justify-between items-center text-xs">
                    <span className="font-mono text-amber-400 font-bold">€6,200</span>
                    <span className={`text-[11px] font-bold ${truckDraft.hasBullbar ? 'text-emerald-400' : 'text-neutral-500'}`}>
                      {truckDraft.hasBullbar ? 'مثبتة' : 'غير مثبتة'}
                    </span>
                  </div>
                </div>

                {/* Dual Vertical Exhaust */}
                <div
                  onClick={() => setTruckDraft({ ...truckDraft, hasDualExhaust: !truckDraft.hasDualExhaust })}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    truckDraft.hasDualExhaust
                      ? 'border-amber-500 bg-neutral-800/80'
                      : 'border-neutral-800 bg-neutral-950/40'
                  }`}
                >
                  <div>
                    <div className="text-sm font-bold text-white mb-1">عوادم عمودية مزدوجة V8</div>
                    <p className="text-xs text-neutral-400">
                      مواسير عادم كرومية مرتفعة تمنح الشاحنة هدير محرك استثنائي ومظهراً مهيباً
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-neutral-800 flex justify-between items-center text-xs">
                    <span className="font-mono text-amber-400 font-bold">€5,500</span>
                    <span className={`text-[11px] font-bold ${truckDraft.hasDualExhaust ? 'text-emerald-400' : 'text-neutral-500'}`}>
                      {truckDraft.hasDualExhaust ? 'مثبتة' : 'غير مثبتة'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
