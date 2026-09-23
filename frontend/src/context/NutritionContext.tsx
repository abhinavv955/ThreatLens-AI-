import React, { createContext, useContext, useState, useEffect } from 'react';
import { FoodScanResult, LoggedMeal, DashboardMetrics } from '../types';
import { mealService, INITIAL_MEALS } from '../services/mealService';
import { foodService, SAMPLE_MEALS } from '../services/foodService';
import { dashboardService, DEFAULT_METRICS } from '../services/dashboardService';

interface NutritionContextType {
  meals: LoggedMeal[];
  metrics: DashboardMetrics;
  activeScanMealKey: string;
  setActiveScanMealKey: (key: string) => void;
  currentScanResult: FoodScanResult;
  isScanning: boolean;
  scanStatusText: string;
  scanTargetHidden: boolean;
  activeImageUrl: string;
  runScan: (customFile?: File) => Promise<void>;
  logCurrentMeal: () => Promise<void>;
  deleteMeal: (id: string) => Promise<void>;
  saveToast: string | null;
}

const NutritionContext = createContext<NutritionContextType | undefined>(undefined);

export const NutritionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [meals, setMeals] = useState<LoggedMeal[]>(INITIAL_MEALS);
  const [metrics, setMetrics] = useState<DashboardMetrics>(DEFAULT_METRICS);
  const [activeScanMealKey, setActiveScanMealKey] = useState<string>('paneer');
  const [currentScanResult, setCurrentScanResult] = useState<FoodScanResult>(SAMPLE_MEALS.paneer);
  const [activeImageUrl, setActiveImageUrl] = useState<string>(SAMPLE_MEALS.paneer.imageUrl);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanStatusText, setScanStatusText] = useState<string>('AWAITING SCAN');
  const [scanTargetHidden, setScanTargetHidden] = useState<boolean>(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  useEffect(() => {
    mealService.getTodayMeals().then(setMeals);
    dashboardService.getMetrics().then(setMetrics);
  }, []);

  // Recalculate metrics based on current meals
  useEffect(() => {
    const totalCal = meals.reduce((acc, m) => acc + m.kcal, 0);
    const progress = Math.min(100, Math.round((totalCal / metrics.dailyCalorieTarget) * 100));

    setMetrics((prev) => ({
      ...prev,
      dailyCaloriesEaten: totalCal,
      goalProgressPercent: progress,
    }));
  }, [meals, metrics.dailyCalorieTarget]);

  const runScan = async (customFile?: File) => {
    setIsScanning(true);
    setScanStatusText('SCANNING...');
    setScanTargetHidden(false);

    if (customFile) {
      const localUrl = URL.createObjectURL(customFile);
      setActiveImageUrl(localUrl);
      try {
        const result = await foodService.recognizeFoodImage(customFile);
        setCurrentScanResult(result);
        setScanStatusText('SCAN COMPLETE');
        setScanTargetHidden(true);
      } catch {
        setScanStatusText('SCAN FAILED');
      } finally {
        setIsScanning(false);
      }
    } else {
      setTimeout(() => {
        const selected = SAMPLE_MEALS[activeScanMealKey] || SAMPLE_MEALS.paneer;
        setCurrentScanResult(selected);
        setScanStatusText('SCAN COMPLETE');
        setScanTargetHidden(true);
        setIsScanning(false);
      }, 1100);
    }
  };

  const logCurrentMeal = async () => {
    const newMeal = await mealService.logMeal({
      tag: 'Lunch',
      name: currentScanResult.title,
      kcal: currentScanResult.kcal,
    });
    setMeals((prev) => [...prev, newMeal]);
    setSaveToast(`✓ ${currentScanResult.title} logged (${currentScanResult.kcal} kcal)`);
    setTimeout(() => setSaveToast(null), 3000);
  };

  const deleteMeal = async (id: string) => {
    await mealService.deleteMeal(id);
    setMeals((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <NutritionContext.Provider
      value={{
        meals,
        metrics,
        activeScanMealKey,
        setActiveScanMealKey: (key: string) => {
          setActiveScanMealKey(key);
          if (SAMPLE_MEALS[key]) {
            setActiveImageUrl(SAMPLE_MEALS[key].imageUrl);
            setScanTargetHidden(false);
            setScanStatusText('AWAITING SCAN');
          }
        },
        currentScanResult,
        isScanning,
        scanStatusText,
        scanTargetHidden,
        activeImageUrl,
        runScan,
        logCurrentMeal,
        deleteMeal,
        saveToast,
      }}
    >
      {children}
    </NutritionContext.Provider>
  );
};

export const useNutrition = () => {
  const context = useContext(NutritionContext);
  if (!context) throw new Error('useNutrition must be used within a NutritionProvider');
  return context;
};
