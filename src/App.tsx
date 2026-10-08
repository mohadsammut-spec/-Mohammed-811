/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { TruckCanvas } from './components/DriveSimulation/TruckCanvas';
import { DriveHUD } from './components/HUD/DriveHUD';
import { Navbar } from './components/Header/Navbar';
import { JobMarketModal } from './components/JobMarket/JobMarketModal';
import { TruckCustomizerModal } from './components/Garage/TruckCustomizerModal';
import { CompanyFleetModal } from './components/Company/CompanyFleetModal';
import { DeliverySummaryModal } from './components/DeliveryComplete/DeliverySummaryModal';
import { CameraView, HiredDriver, Job, PlayerCareer, TruckConfig, WeatherType } from './types/game';
import { AVAILABLE_TRUCK_MODELS, EUROPEAN_CITIES, generateJobsList } from './data/gameData';
import { truckAudio } from './services/sound';
import { HelpCircle, Play, ShieldAlert, Sparkles, Navigation } from 'lucide-react';

export default function App() {
  // Career State
  const [career, setCareer] = useState<PlayerCareer>(() => {
    const saved = localStorage.getItem('euro_truck_career_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback
      }
    }

    const initialJobs = generateJobsList();
    const firstJob = initialJobs[0];

    return {
      companyName: 'أطلس لوجستيك أوروبا',
      money: 42000,
      xp: 600,
      level: 1,
      completedJobsCount: 0,
      totalDistanceDrivenKm: 45,
      activeJob: {
        job: firstJob,
        distanceRemainingKm: firstJob.distanceKm,
        cargoDamagePercent: 0,
        truckDamagePercent: 0,
        infractionsCount: 0,
        fuelLiters: 380,
        fatiguePercent: 15,
      },
      ownedTrucks: [AVAILABLE_TRUCK_MODELS[0]],
      currentTruckIndex: 0,
      garages: [{ cityId: 'berlin', slots: 3, level: 1, purchaseCost: 140000 }],
      drivers: [],
      bankDebt: 0,
    };
  });

  // Save career state to local storage
  useEffect(() => {
    localStorage.setItem('euro_truck_career_v1', JSON.stringify(career));
  }, [career]);

  // Available jobs catalog
  const availableJobs = useMemo(() => generateJobsList(), []);

  // Drive simulation controls & HUD state
  const [speedKmH, setSpeedKmH] = useState(0);
  const [rpm, setRpm] = useState(800);
  const [gear, setGear] = useState<number | string>(1);
  const [weather, setWeather] = useState<WeatherType>('clear');
  const [cameraView, setCameraView] = useState<CameraView>('chase');
  const [isEngineStarted, setIsEngineStarted] = useState(true);
  const [isHeadlightsActive, setIsHeadlightsActive] = useState(false);
  const [isWipersActive, setIsWipersActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [nearGasStation, setNearGasStation] = useState(false);
  const [nearRestStop, setNearRestStop] = useState(false);
  const [recentInfraction, setRecentInfraction] = useState<{ message: string; fine: number } | null>(null);

  // Modals
  const [isJobsOpen, setIsJobsOpen] = useState(false);
  const [isFleetOpen, setIsFleetOpen] = useState(false);
  const [isGarageOpen, setIsGarageOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [completedJobData, setCompletedJobData] = useState<{
    job: Job;
    cargoDamagePercent: number;
    truckDamagePercent: number;
    infractionsCount: number;
  } | null>(null);

  const currentTruck = career.ownedTrucks[career.currentTruckIndex] || AVAILABLE_TRUCK_MODELS[0];

  // Engine sound trigger on initial user interaction
  useEffect(() => {
    if (isEngineStarted) {
      truckAudio.startEngine();
    } else {
      truckAudio.stopEngine();
    }
  }, [isEngineStarted]);

  // Infraction handler
  const handleInfraction = useCallback((type: 'speeding' | 'collision', fineAmount: number) => {
    const msg = type === 'speeding'
      ? 'مخالفة تجاوز السرعة المحددة (رادار الطريق السريع)'
      : 'حادث تصادم مروري وإتلاف الممتلكات';

    setRecentInfraction({ message: msg, fine: fineAmount });
    setTimeout(() => {
      setRecentInfraction(null);
    }, 4000);

    setCareer((prev) => {
      const activeJob = prev.activeJob;
      if (!activeJob) return { ...prev, money: Math.max(0, prev.money - fineAmount) };
      return {
        ...prev,
        money: Math.max(0, prev.money - fineAmount),
        activeJob: {
          ...activeJob,
          infractionsCount: activeJob.infractionsCount + 1,
        },
      };
    });
  }, []);

  // Distance progress & Delivery completion check
  const handleDistanceTravelled = useCallback((kmDelta: number) => {
    setCareer((prev) => {
      const active = prev.activeJob;
      const newTotalDist = prev.totalDistanceDrivenKm + kmDelta;
      if (!active) {
        return { ...prev, totalDistanceDrivenKm: newTotalDist };
      }

      const newRemaining = active.distanceRemainingKm - kmDelta;

      // Delivery completed!
      if (newRemaining <= 0) {
        setCompletedJobData({
          job: active.job,
          cargoDamagePercent: active.cargoDamagePercent,
          truckDamagePercent: active.truckDamagePercent,
          infractionsCount: active.infractionsCount,
        });
        return {
          ...prev,
          totalDistanceDrivenKm: newTotalDist,
          activeJob: null,
        };
      }

      return {
        ...prev,
        totalDistanceDrivenKm: newTotalDist,
        activeJob: {
          ...active,
          distanceRemainingKm: newRemaining,
        },
      };
    });
  }, []);

  // Fuel consumption handler
  const handleFuelConsume = useCallback((liters: number) => {
    setCareer((prev) => {
      if (!prev.activeJob) return prev;
      const newFuel = Math.max(0, prev.activeJob.fuelLiters - liters);
      return {
        ...prev,
        activeJob: {
          ...prev.activeJob,
          fuelLiters: newFuel,
        },
      };
    });
  }, []);

  // Fatigue increase handler
  const handleFatigueIncrease = useCallback((amount: number) => {
    setCareer((prev) => {
      if (!prev.activeJob) return prev;
      const newFatigue = Math.min(100, prev.activeJob.fatiguePercent + amount);
      return {
        ...prev,
        activeJob: {
          ...prev.activeJob,
          fatiguePercent: newFatigue,
        },
      };
    });
  }, []);

  // Damage increase handler
  const handleDamageIncrease = useCallback((truckDmg: number, cargoDmg: number) => {
    setCareer((prev) => {
      if (!prev.activeJob) return prev;
      return {
        ...prev,
        activeJob: {
          ...prev.activeJob,
          truckDamagePercent: Math.min(100, Math.round(prev.activeJob.truckDamagePercent + truckDmg)),
          cargoDamagePercent: Math.min(100, Math.round(prev.activeJob.cargoDamagePercent + cargoDmg)),
        },
      };
    });
  }, []);

  // Refuel at Gas Station
  const handleRefuel = useCallback(() => {
    setCareer((prev) => {
      if (!prev.activeJob) return prev;
      const neededLiters = 450 - prev.activeJob.fuelLiters;
      const fuelCost = Math.round(neededLiters * 1.85);
      if (prev.money < fuelCost) return prev;
      truckAudio.playCashPayout();
      return {
        ...prev,
        money: prev.money - fuelCost,
        activeJob: {
          ...prev.activeJob,
          fuelLiters: 450,
        },
      };
    });
  }, []);

  // Rest at hotel/rest stop
  const handleRest = useCallback(() => {
    setCareer((prev) => {
      if (!prev.activeJob) return prev;
      return {
        ...prev,
        activeJob: {
          ...prev.activeJob,
          fatiguePercent: 0,
        },
      };
    });
  }, []);

  // Quick Repair service
  const handleRepair = useCallback(() => {
    setCareer((prev) => {
      if (!prev.activeJob || prev.money < 400) return prev;
      truckAudio.playCashPayout();
      return {
        ...prev,
        money: prev.money - 400,
        activeJob: {
          ...prev.activeJob,
          truckDamagePercent: 0,
        },
      };
    });
  }, []);

  // Select new job from market
  const handleSelectJob = (job: Job) => {
    setCareer((prev) => ({
      ...prev,
      activeJob: {
        job,
        distanceRemainingKm: job.distanceKm,
        cargoDamagePercent: 0,
        truckDamagePercent: 0,
        infractionsCount: 0,
        fuelLiters: 420,
        fatiguePercent: 10,
      },
    }));
    setIsJobsOpen(false);
  };

  // Finish completed delivery
  const handleFinishDelivery = (netEarnings: number, xpGained: number) => {
    setCareer((prev) => {
      const newXp = prev.xp + xpGained;
      const newLevel = Math.floor(newXp / 800) + 1;
      return {
        ...prev,
        money: prev.money + netEarnings,
        xp: newXp,
        level: newLevel,
        completedJobsCount: prev.completedJobsCount + 1,
      };
    });
    setCompletedJobData(null);
  };

  // Truck workshop modifications
  const handleUpdateTruck = (updatedTruck: TruckConfig, cost: number) => {
    setCareer((prev) => {
      const newOwned = [...prev.ownedTrucks];
      newOwned[prev.currentTruckIndex] = updatedTruck;
      return {
        ...prev,
        money: prev.money - cost,
        ownedTrucks: newOwned,
      };
    });
  };

  // Buy new truck
  const handleBuyTruck = (truck: TruckConfig) => {
    setCareer((prev) => ({
      ...prev,
      money: prev.money - truck.price,
      ownedTrucks: [...prev.ownedTrucks, truck],
    }));
  };

  // Hire driver
  const handleHireDriver = (driver: HiredDriver) => {
    setCareer((prev) => ({
      ...prev,
      drivers: [...prev.drivers, driver],
    }));
  };

  // Assign driver to truck
  const handleAssignDriverTruck = (driverId: string, truckId: string) => {
    setCareer((prev) => ({
      ...prev,
      drivers: prev.drivers.map((d) => (d.id === driverId ? { ...d, assignedTruckId: truckId, status: 'driving' } : d)),
    }));
  };

  // Buy garage
  const handleBuyGarage = (cityId: string, cost: number) => {
    setCareer((prev) => ({
      ...prev,
      money: prev.money - cost,
      garages: [...prev.garages, { cityId, slots: 3, level: 1, purchaseCost: cost }],
    }));
  };

  // Bank loans
  const handleTakeLoan = (amount: number) => {
    setCareer((prev) => ({
      ...prev,
      money: prev.money + amount,
      bankDebt: prev.bankDebt + Math.round(amount * 1.05),
    }));
  };

  const handleRepayLoan = (amount: number) => {
    setCareer((prev) => ({
      ...prev,
      money: prev.money - amount,
      bankDebt: Math.max(0, prev.bankDebt - amount),
    }));
  };

  // Collect passive earnings from drivers
  const handleCollectDriverIncome = () => {
    setCareer((prev) => {
      const working = prev.drivers.filter((d) => d.assignedTruckId !== null);
      const profit = working.reduce((sum, d) => sum + (d.dailyEarnings - d.salaryPerDay), 0);
      return {
        ...prev,
        money: prev.money + profit,
      };
    });
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-neutral-950 text-neutral-100 overflow-hidden font-['Cairo',sans-serif]">
      {/* Top Bar Navigation */}
      <Navbar
        career={career}
        activeView="drive"
        onNavigate={() => {}}
        onOpenJobs={() => setIsJobsOpen(true)}
        onOpenFleet={() => setIsFleetOpen(true)}
        onOpenGarage={() => setIsGarageOpen(true)}
      />

      {/* Main 3D Simulation Viewport Area */}
      <main className="relative flex-1 w-full h-full overflow-hidden">
        {/* 3D WebGL Canvas */}
        <TruckCanvas
          truckConfig={currentTruck}
          cargoWeightTons={career.activeJob?.job.cargo.weightTons || 0}
          trailerType={career.activeJob?.job.cargo.trailerType || 'curtain'}
          weather={weather}
          cameraView={cameraView}
          isEngineStarted={isEngineStarted}
          isWipersActive={isWipersActive}
          isHeadlightsActive={isHeadlightsActive}
          isMuted={isMuted}
          onSpeedUpdate={(spd, engineRpm, g) => {
            setSpeedKmH(spd);
            setRpm(engineRpm);
            setGear(g);
          }}
          onInfraction={handleInfraction}
          onFuelConsume={handleFuelConsume}
          onFatigueIncrease={handleFatigueIncrease}
          onDamageIncrease={handleDamageIncrease}
          onDistanceTravelled={handleDistanceTravelled}
          onNearGasStation={setNearGasStation}
          onNearRestStop={setNearRestStop}
        />

        {/* 2D Drive Cockpit HUD Overlay */}
        <DriveHUD
          speedKmH={speedKmH}
          rpm={rpm}
          gear={gear}
          fuelLiters={career.activeJob?.fuelLiters || 450}
          maxFuelLiters={450}
          fatiguePercent={career.activeJob?.fatiguePercent || 0}
          truckDamagePercent={career.activeJob?.truckDamagePercent || 0}
          cargoDamagePercent={career.activeJob?.cargoDamagePercent || 0}
          activeJob={career.activeJob ? career.activeJob.job : null}
          distanceRemainingKm={career.activeJob?.distanceRemainingKm || 0}
          weather={weather}
          cameraView={cameraView}
          isEngineStarted={isEngineStarted}
          isHeadlightsActive={isHeadlightsActive}
          isWipersActive={isWipersActive}
          isMuted={isMuted}
          nearGasStation={nearGasStation}
          nearRestStop={nearRestStop}
          recentInfraction={recentInfraction}
          onToggleEngine={() => setIsEngineStarted((v) => !v)}
          onToggleHeadlights={() => setIsHeadlightsActive((v) => !v)}
          onToggleWipers={() => setIsWipersActive((v) => !v)}
          onToggleMute={() => setIsMuted((v) => !v)}
          onChangeCamera={setCameraView}
          onChangeWeather={setWeather}
          onRefuel={handleRefuel}
          onRest={handleRest}
          onRepair={handleRepair}
          onHonkHorn={() => truckAudio.playHorn()}
          onOpenJobMarket={() => setIsJobsOpen(true)}
          onOpenFleet={() => setIsFleetOpen(true)}
          onOpenGarage={() => setIsGarageOpen(true)}
        />

        {/* Floating Quick Keyboard Controls Help Badge */}
        <button
          onClick={() => setIsHelpOpen(true)}
          className="absolute top-20 right-4 z-20 p-2.5 rounded-xl bg-neutral-900/80 backdrop-blur border border-neutral-700/60 text-neutral-300 hover:text-white transition-all shadow-xl cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
          title="دليل أزرار التحكم"
        >
          <HelpCircle className="w-4 h-4 text-amber-400" />
          <span className="hidden sm:inline">أزرار التحكم</span>
        </button>
      </main>

      {/* MODALS */}
      {/* 1. Job Market */}
      {isJobsOpen && (
        <JobMarketModal
          jobs={availableJobs}
          currentJobId={career.activeJob?.job.id || null}
          onSelectJob={handleSelectJob}
          onClose={() => setIsJobsOpen(false)}
        />
      )}

      {/* 2. Truck Customization Garage */}
      {isGarageOpen && (
        <TruckCustomizerModal
          currentTruck={currentTruck}
          playerMoney={career.money}
          onUpdateTruck={handleUpdateTruck}
          onClose={() => setIsGarageOpen(false)}
        />
      )}

      {/* 3. Company & Fleet Management */}
      {isFleetOpen && (
        <CompanyFleetModal
          career={career}
          onBuyTruck={handleBuyTruck}
          onHireDriver={handleHireDriver}
          onAssignDriverTruck={handleAssignDriverTruck}
          onBuyGarage={handleBuyGarage}
          onTakeLoan={handleTakeLoan}
          onRepayLoan={handleRepayLoan}
          onCollectDriverIncome={handleCollectDriverIncome}
          onClose={() => setIsFleetOpen(false)}
        />
      )}

      {/* 4. Delivery Complete Evaluation */}
      {completedJobData && (
        <DeliverySummaryModal
          job={completedJobData.job}
          cargoDamagePercent={completedJobData.cargoDamagePercent}
          truckDamagePercent={completedJobData.truckDamagePercent}
          infractionsCount={completedJobData.infractionsCount}
          onContinue={handleFinishDelivery}
        />
      )}

      {/* 5. Controls & Guide Modal */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-md">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl text-neutral-100 flex flex-col gap-4 text-right">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-amber-400" />
                <span>دليل قيادة الشاحنة وأزرار التحكم</span>
              </h3>
              <button
                onClick={() => setIsHelpOpen(false)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 bg-neutral-950/70 border border-neutral-800 rounded-xl">
                <span className="font-bold text-amber-400 font-mono">W / سهم لأعلى</span>
                <p className="text-neutral-400 mt-1">الدوس على دواسة الوقود والتسارع</p>
              </div>
              <div className="p-3 bg-neutral-950/70 border border-neutral-800 rounded-xl">
                <span className="font-bold text-amber-400 font-mono">S / سهم لأسفل</span>
                <p className="text-neutral-400 mt-1">الفرامل والتوقف / الرجوع للخلف</p>
              </div>
              <div className="p-3 bg-neutral-950/70 border border-neutral-800 rounded-xl">
                <span className="font-bold text-amber-400 font-mono">A / D أو الأسهم</span>
                <p className="text-neutral-400 mt-1">توجيه عجلة القيادة يساراً ويميناً</p>
              </div>
              <div className="p-3 bg-neutral-950/70 border border-neutral-800 rounded-xl">
                <span className="font-bold text-amber-400 font-mono">مسافة (Space)</span>
                <p className="text-neutral-400 mt-1">الفرامل الهوائية واليدوية القوية</p>
              </div>
              <div className="p-3 bg-neutral-950/70 border border-neutral-800 rounded-xl">
                <span className="font-bold text-amber-400 font-mono">زر H</span>
                <p className="text-neutral-400 mt-1">إطلاق بوق الشاحنة القوي (Horn)</p>
              </div>
              <div className="p-3 bg-neutral-950/70 border border-neutral-800 rounded-xl">
                <span className="font-bold text-amber-400 font-mono">زر C</span>
                <p className="text-neutral-400 mt-1">تبديل زاوية الكاميرا (كابينة / خارجي)</p>
              </div>
            </div>

            <div className="mt-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-neutral-300 leading-relaxed">
              <strong className="text-amber-400 block mb-1">نصائح القيادة الواقعية:</strong>
              • احذر تجاوز السرعة (80 كم/ساعة) عند كاميرات الرادار لتجنب الغرامات المالية.
              <br />
              • الشحنات الثقيلة (مثل الآلات 36 طن) تتطلب مسافة كبح أطول وتسارعاً متدرجاً.
              <br />
              • احرص على التوقف بمحطات الوقود واستراحات النوم لتجنب نعاس السائق ونفاد الخزان.
            </div>

            <button
              onClick={() => setIsHelpOpen(false)}
              className="mt-2 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-xl font-bold text-xs cursor-pointer"
            >
              فهمت، العودة للقيادة
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
