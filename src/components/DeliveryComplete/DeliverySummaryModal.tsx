import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Award, CheckCircle, DollarSign, ShieldAlert, ArrowLeft, TrendingUp } from 'lucide-react';
import { Job } from '../../types/game';
import { truckAudio } from '../../services/sound';

interface DeliverySummaryModalProps {
  job: Job;
  cargoDamagePercent: number;
  truckDamagePercent: number;
  infractionsCount: number;
  onContinue: (finalPay: number, xpGained: number) => void;
}

export const DeliverySummaryModal: React.FC<DeliverySummaryModalProps> = ({
  job,
  cargoDamagePercent,
  truckDamagePercent,
  infractionsCount,
  onContinue,
}) => {
  // Financial calculation
  const baseReward = job.rewardEuro;
  const cargoDamageDeduction = Math.round((baseReward * cargoDamagePercent) / 100);
  const infractionsDeduction = infractionsCount * 150;
  const netEarnings = Math.max(0, baseReward - cargoDamageDeduction - infractionsDeduction);
  const xpEarned = Math.round(job.xpReward * (1 - cargoDamagePercent * 0.005));

  useEffect(() => {
    truckAudio.playCashPayout();
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // Ignored
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/85 backdrop-blur-md">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl text-neutral-100 flex flex-col gap-5 text-right">
        {/* Header */}
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center mb-3">
            <CheckCircle className="w-9 h-9" />
          </div>
          <h2 className="text-2xl font-black text-white">تم تسليم الشحنة بنجاح!</h2>
          <p className="text-xs text-neutral-400 mt-1">
            تقرير كفاءة الرحلة وحساب أرباح النقل من {job.fromCity.name} إلى {job.toCity.name}
          </p>
        </div>

        {/* Breakdown Card */}
        <div className="bg-neutral-950/70 border border-neutral-800 rounded-2xl p-4.5 space-y-3 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-neutral-400">عقد الشحن الأصلي:</span>
            <span className="font-mono font-bold text-white text-sm">€{baseReward.toLocaleString()}</span>
          </div>

          <div className="flex justify-between items-center text-rose-400">
            <span>خصم تلف البضاعة ({cargoDamagePercent}%):</span>
            <span className="font-mono font-bold">-€{cargoDamageDeduction.toLocaleString()}</span>
          </div>

          {infractionsCount > 0 && (
            <div className="flex justify-between items-center text-rose-400">
              <span>غرامات مرورية ومخالفات ({infractionsCount}):</span>
              <span className="font-mono font-bold">-€{infractionsDeduction.toLocaleString()}</span>
            </div>
          )}

          <div className="pt-3 border-t border-neutral-800 flex justify-between items-center">
            <span className="font-bold text-neutral-200">صافي الأرباح المحولة لحسابك:</span>
            <span className="font-mono font-black text-xl text-amber-400">
              €{netEarnings.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Experience Points Earned */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <span className="text-xs font-bold text-neutral-200">نقاط الخبرة XP المكتسبة:</span>
          </div>
          <span className="font-mono font-black text-base text-amber-400">+{xpEarned} XP</span>
        </div>

        {/* Action button */}
        <button
          onClick={() => onContinue(netEarnings, xpEarned)}
          className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-xl font-bold text-sm transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
        >
          استلام الأرباح والعودة للكراج
        </button>
      </div>
    </div>
  );
};
