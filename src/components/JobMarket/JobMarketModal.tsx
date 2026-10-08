import React, { useState } from 'react';
import { X, MapPin, Truck, Flame, Shield, ArrowLeft, Filter, Award } from 'lucide-react';
import { Job } from '../../types/game';
import { EUROPEAN_CITIES } from '../../data/gameData';

interface JobMarketModalProps {
  jobs: Job[];
  currentJobId: string | null;
  onSelectJob: (job: Job) => void;
  onClose: () => void;
}

export const JobMarketModal: React.FC<JobMarketModalProps> = ({
  jobs,
  currentJobId,
  onSelectJob,
  onClose,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCityId, setSelectedCityId] = useState<string>('all');

  const filteredJobs = jobs.filter((j) => {
    const matchesCategory = selectedCategory === 'all' || j.cargo.category === selectedCategory;
    const matchesCity = selectedCityId === 'all' || j.fromCity.id === selectedCityId;
    return matchesCategory && matchesCity;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-md">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-neutral-100">
        {/* Header */}
        <div className="px-6 py-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/60">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Truck className="w-6 h-6 text-amber-500" />
              <span>سوق الشحن ونقل البضائع الأوروبي (Freight Market)</span>
            </h2>
            <p className="text-xs text-neutral-400 mt-1">
              اختر عقداً لنقل البضائع عبر المدن الأوروبية، واكسب المال ونقاط الخبرة XP لتطوير شركتك
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Controls */}
        <div className="px-6 py-3.5 border-b border-neutral-800/80 bg-neutral-950/40 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Cargo Categories Segmented Control */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: 'all', label: 'كافة الشحنات' },
              { id: 'food', label: 'مواد غذائية' },
              { id: 'fuel', label: 'وقود وكيماويات (ADR)' },
              { id: 'machinery', label: 'آلات ومعدات ثقيلة' },
              { id: 'automotive', label: 'سيارات فاخرة' },
              { id: 'electronics', label: 'إلكترونيات' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer font-medium ${
                  selectedCategory === cat.id
                    ? 'bg-amber-500 text-neutral-950 font-bold'
                    : 'bg-neutral-800/80 text-neutral-300 hover:text-white hover:bg-neutral-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* City Selection */}
          <div className="flex items-center gap-2">
            <span className="text-neutral-400 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              <span>مدينة الانطلاق:</span>
            </span>
            <select
              value={selectedCityId}
              onChange={(e) => setSelectedCityId(e.target.value)}
              className="bg-neutral-800 border border-neutral-700 text-white rounded-lg px-2.5 py-1 text-xs outline-none cursor-pointer"
            >
              <option value="all">كافة المدن</option>
              {EUROPEAN_CITIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.country})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Jobs Grid */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredJobs.length === 0 ? (
            <div className="col-span-full py-16 text-center text-neutral-400 text-sm">
              لا توجد عقود شحن متاحة تطابق الفلتر المحدد حالياً.
            </div>
          ) : (
            filteredJobs.map((job) => {
              const isCurrent = currentJobId === job.id;
              return (
                <div
                  key={job.id}
                  className={`bg-neutral-950/70 border rounded-2xl p-4.5 flex flex-col justify-between transition-all hover:border-amber-500/50 ${
                    isCurrent ? 'border-amber-500 ring-2 ring-amber-500/30' : 'border-neutral-800'
                  }`}
                >
                  <div>
                    {/* Route Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-sm font-bold text-white">
                        <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{job.fromCity.name}</span>
                        <ArrowLeft className="w-3.5 h-3.5 text-neutral-500" />
                        <span>{job.toCity.name}</span>
                      </div>
                      <span className="text-xs font-mono text-neutral-400 font-semibold">
                        {job.distanceKm} كم
                      </span>
                    </div>

                    {/* Cargo Title & Specs */}
                    <div className="bg-neutral-900/80 rounded-xl p-3 border border-neutral-800/80 mb-3">
                      <div className="font-bold text-sm text-neutral-100 flex items-center justify-between">
                        <span>{job.cargo.title}</span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-400">
                        <span>الوزن: <strong className="text-neutral-200">{job.cargo.weightTons} طن</strong></span>
                        <span aria-hidden="true">·</span>
                        <span>نوع المقطورة: {job.cargo.trailerType === 'tanker' ? 'صهريج نفطي' : job.cargo.trailerType === 'flatbed' ? 'سطحة مفتوحة' : 'صندوق مقفل'}</span>
                      </div>

                      {/* Special Cargo Badges */}
                      <div className="mt-2 flex items-center gap-2">
                        {job.cargo.adrHazardous && (
                          <span className="flex items-center gap-1 text-[11px] text-amber-400 font-semibold">
                            <Flame className="w-3 h-3 text-amber-500" />
                            <span>تصريح خطر ADR</span>
                          </span>
                        )}
                        {job.cargo.fragile && (
                          <span className="flex items-center gap-1 text-[11px] text-rose-400 font-semibold">
                            <Shield className="w-3 h-3 text-rose-500" />
                            <span>حمولة قابلة للكسر</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Payout & Action */}
                  <div className="pt-3 border-t border-neutral-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-neutral-400">عائد التوصيل:</div>
                      <div className="text-lg font-black font-mono text-amber-400">
                        €{job.rewardEuro.toLocaleString()}
                      </div>
                      <div className="text-[11px] text-neutral-400 flex items-center gap-1 mt-0.5">
                        <Award className="w-3 h-3 text-emerald-400" />
                        <span>+{job.xpReward} XP</span>
                      </div>
                    </div>

                    <button
                      onClick={() => onSelectJob(job)}
                      disabled={isCurrent}
                      className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                          : 'bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-lg shadow-amber-500/20'
                      }`}
                    >
                      {isCurrent ? 'المهمة الحالية' : 'قبول العقد والبدء'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
