/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { FeaturedPredictions } from './components/FeaturedPredictions';
import { LiveFootballArena } from './components/LiveFootballArena';
import { SpacesHub } from './components/SpacesHub';
import { GlobalChatArena } from './components/GlobalChatArena';
import { PoissonAnalysisEngine } from './components/PoissonAnalysisEngine';
import { MarketplaceArena } from './components/MarketplaceArena';
import { ScalabilityArchitecture } from './components/ScalabilityArchitecture';
import { AuthModal } from './components/AuthModal';
import { AdminDashboardModal } from './components/AdminDashboardModal';
import { UserProfileModal } from './components/UserProfileModal';
import { Shield, Sparkles, Heart } from 'lucide-react';

function ArenaApp() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('featured');
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [inspectedUserId, setInspectedUserId] = useState<string | null>(null);

  // Cross-component analysis navigation
  const [selectedHomeAnalysis, setSelectedHomeAnalysis] = useState<string | undefined>();
  const [selectedAwayAnalysis, setSelectedAwayAnalysis] = useState<string | undefined>();
  const [selectedMatchIdAnalysis, setSelectedMatchIdAnalysis] = useState<string | undefined>();

  const handleOpenAnalysis = (home: string, away: string, matchId?: string) => {
    setSelectedHomeAnalysis(home);
    setSelectedAwayAnalysis(away);
    setSelectedMatchIdAnalysis(matchId);
    setActiveTab('analysis');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenUserProfile = (userId: string) => {
    setInspectedUserId(userId);
    setProfileModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-blue-600 selection:text-white flex flex-col">
      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openAdminModal={() => setAdminModalOpen(true)}
        openProfileModal={() => {
          setInspectedUserId(null);
          setProfileModalOpen(true);
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 py-6 sm:py-8 space-y-8">
        {/* VIEW 1: FEATURED PREDICTIONS (PROMINENT AT TOP) */}
        {activeTab === 'featured' && (
          <FeaturedPredictions
            openAdminModal={() => setAdminModalOpen(true)}
            onSelectMatchAnalysis={handleOpenAnalysis}
          />
        )}

        {/* VIEW 2: LIVE SPORTS & REAL SCORES */}
        {activeTab === 'live-sports' && (
          <LiveFootballArena onSelectMatchAnalysis={handleOpenAnalysis} />
        )}

        {/* VIEW 3: BETTING PLATFORM SPACES */}
        {activeTab === 'spaces' && <SpacesHub />}

        {/* VIEW 4: GLOBAL REAL-TIME CHAT */}
        {activeTab === 'chat' && (
          <GlobalChatArena onOpenUserProfile={handleOpenUserProfile} />
        )}

        {/* VIEW 5: POISSON xG ANALYSIS ENGINE */}
        {activeTab === 'analysis' && (
          <PoissonAnalysisEngine
            initialHome={selectedHomeAnalysis}
            initialAway={selectedAwayAnalysis}
            initialMatchId={selectedMatchIdAnalysis}
          />
        )}

        {/* VIEW 6: MARKETPLACE */}
        {activeTab === 'marketplace' && (
          <MarketplaceArena
            onOpenChatWithSeller={(_sellerId) => {
              setActiveTab('chat');
            }}
          />
        )}

        {/* VIEW 7: 5M SCALABILITY ARCHITECTURE */}
        {activeTab === 'scalability' && <ScalabilityArchitecture />}
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-neutral-800 bg-neutral-950 py-10 px-4 text-xs text-neutral-400">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white font-black">
                <Shield className="h-4 w-4" />
              </div>
              <span className="text-base font-black text-white">SAFE PICKS ARENA</span>
              <span className="rounded bg-blue-500/20 text-blue-300 px-2 py-0.5 text-[10px] font-bold">
                100% Free
              </span>
            </div>
            <p className="max-w-md text-neutral-400">
              The premier free sports prediction arena. Real-time football scores, global community chat,
              and Dixon-Coles Poisson expectation modeling. Zero VIP tiers or hidden paywalls.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 font-bold text-neutral-300">
            <button onClick={() => setActiveTab('featured')} className="hover:text-blue-400">
              Featured Predictions
            </button>
            <button onClick={() => setActiveTab('live-sports')} className="hover:text-blue-400">
              Live Scores
            </button>
            <button onClick={() => setActiveTab('spaces')} className="hover:text-blue-400">
              Betting Spaces
            </button>
            <button onClick={() => setActiveTab('chat')} className="hover:text-blue-400">
              Global Chat
            </button>
            <button onClick={() => setActiveTab('analysis')} className="hover:text-blue-400">
              xG Poisson Math
            </button>
            <button onClick={() => setActiveTab('scalability')} className="hover:text-blue-400">
              5M Architecture
            </button>
          </div>
        </div>

        <div className="mx-auto max-w-7xl mt-8 pt-6 border-t border-neutral-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-neutral-500">
          <div>
            © {new Date().getFullYear()} SAFE PICKS ARENA. All statistical forecasts are mathematical estimates for entertainment.
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>High-Availability Distributed Engine</span>
          </div>
        </div>
      </footer>

      {/* Global Modals */}
      <AuthModal />
      <AdminDashboardModal
        isOpen={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
        onPredictionCreated={() => {
          setActiveTab('featured');
          setAdminModalOpen(false);
        }}
      />
      <UserProfileModal
        isOpen={profileModalOpen}
        userId={inspectedUserId}
        onClose={() => setProfileModalOpen(false)}
        onOpenDirectChat={(_id, _username) => {
          setActiveTab('chat');
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ArenaApp />
    </AuthProvider>
  );
}
