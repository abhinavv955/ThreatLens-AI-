import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { NutritionProvider } from './context/NutritionContext';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { HeroSection } from './components/hero/HeroSection';
import { ScannerSection } from './components/scanner/ScannerSection';
import { DashboardSection } from './components/dashboard/DashboardSection';
import { RecommendationsSection } from './components/recommendations/RecommendationsSection';
import { HowItWorksSection } from './components/howitworks/HowItWorksSection';
import { PersonalizationSection } from './components/personalization/PersonalizationSection';
import { AskAISection } from './components/chat/AskAISection';
import { FloatingChatFAB } from './components/chat/FloatingChatFAB';
import { AuthModal } from './components/auth/AuthModal';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <NutritionProvider>
        <Navbar />
        <main>
          <HeroSection />
          <ScannerSection />
          <DashboardSection />
          <RecommendationsSection />
          <HowItWorksSection />
          <PersonalizationSection />
          <AskAISection />
        </main>
        <Footer />
        <FloatingChatFAB />
        <AuthModal />
      </NutritionProvider>
    </AuthProvider>
  );
};

export default App;
