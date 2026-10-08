import React from 'react';
import { Truck, DollarSign, Award } from 'lucide-react';
import { PlayerCareer } from '../../types/game';

interface NavbarProps {
  career: PlayerCareer;
  activeView: 'drive' | 'jobs' | 'fleet' | 'garage';
  onNavigate: (view: 'drive' | 'jobs' | 'fleet' | 'garage') => void;
  onOpenJobs: () => void;
  onOpenFleet: () => void;
  onOpenGarage: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  career,
  activeView,
  onNavigate,
  onOpenJobs,
  onOpenFleet,
  onOpenGarage,
}) => {
  return (
    <header className="h-16 px-6 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between z-30 shrink-0">
      {/* Zone 1: Brand Title (Single text element wordmark in display font) */}
      <div
        onClick={() => onNavigate('drive')}
        className="text-lg font-black tracking-tight text-white flex items-center gap-2 cursor-pointer select-none"
      >
        <Truck className="w-5 h-5 text-amber-500" />
        <span>محاكي الشاحنات الأوروبية</span>
      </div>

      {/* Zone 2: 4-6 Nav Links (Clean text navigation links, single line) */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-neutral-400">
        <button
          onClick={() => onNavigate('drive')}
          className={`hover:text-white transition-colors cursor-pointer whitespace-nowrap ${
            activeView === 'drive' ? 'text-amber-400 font-bold' : ''
          }`}
        >
          كابينة القيادة
        </button>
        <button
          onClick={onOpenJobs}
          className="hover:text-white transition-colors cursor-pointer whitespace-nowrap"
        >
          سوق الشحن
        </button>
        <button
          onClick={onOpenFleet}
          className="hover:text-white transition-colors cursor-pointer whitespace-nowrap"
        >
          إدارة الأسطول
        </button>
        <button
          onClick={onOpenGarage}
          className="hover:text-white transition-colors cursor-pointer whitespace-nowrap"
        >
          ورشة التعديل
        </button>
      </nav>

      {/* Zone 3: 1-2 Primary Actions (Company Balance & Level) */}
      <div className="flex items-center gap-3">
        {/* Player Stats */}
        <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs">
          <div className="flex items-center gap-1 font-mono font-bold text-amber-400">
            <span>€</span>
            <span>{career.money.toLocaleString()}</span>
          </div>
          <span className="text-neutral-700">|</span>
          <div className="flex items-center gap-1 text-neutral-300">
            <Award className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-mono font-bold">مستوى {career.level}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
