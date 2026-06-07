import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navigation } from './components/Navigation';

// Lazy load views for optimal code-splitting
const DashboardView = lazy(() => import('./views/DashboardView').then(m => ({ default: m.DashboardView })));
const MatchesView = lazy(() => import('./views/MatchesView').then(m => ({ default: m.MatchesView })));
const GroupsView = lazy(() => import('./views/GroupsView').then(m => ({ default: m.GroupsView })));
const PredictorView = lazy(() => import('./views/PredictorView').then(m => ({ default: m.PredictorView })));
const MatchDetailView = lazy(() => import('./views/MatchDetailView').then(m => ({ default: m.MatchDetailView })));
const SimulatorView = lazy(() => import('./views/SimulatorView').then(m => ({ default: m.SimulatorView })));
const CommunityView = lazy(() => import('./views/CommunityView').then(m => ({ default: m.CommunityView })));
const FantasyView = lazy(() => import('./views/FantasyView').then(m => ({ default: m.FantasyView })));
const UniverseView = lazy(() => import('./views/UniverseView').then(m => ({ default: m.UniverseView })));
const TwinView = lazy(() => import('./views/TwinView').then(m => ({ default: m.TwinView })));
const TvModeView = lazy(() => import('./views/TvModeView').then(m => ({ default: m.TvModeView })));
const AssistantView = lazy(() => import('./views/AssistantView').then(m => ({ default: m.AssistantView })));
const AdminStatusView = lazy(() => import('./views/AdminStatusView').then(m => ({ default: m.AdminStatusView })));
const OpsView = lazy(() => import('./views/OpsView').then(m => ({ default: m.OpsView })));

const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4 text-slate-400">
    <div className="w-8 h-8 rounded-full border-t-2 border-primary animate-spin"></div>
    <p className="text-xs font-bold uppercase tracking-widest animate-pulse">Loading View...</p>
  </div>
);

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background text-foreground flex">
        <Navigation />
        <main className="flex-1 md:ml-56 p-4 md:p-6 pb-24 md:pb-6 w-full max-w-7xl mx-auto overflow-x-hidden">
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
               <Route path="/" element={<DashboardView />} />
               <Route path="/matches" element={<MatchesView />} />
               <Route path="/groups" element={<GroupsView />} />
               <Route path="/predictor" element={<PredictorView />} />
               <Route path="/fantasy" element={<FantasyView />} />
               <Route path="/simulator" element={<SimulatorView />} />
               <Route path="/universe" element={<UniverseView />} />
               <Route path="/twin" element={<TwinView />} />
               <Route path="/assistant" element={<AssistantView />} />
               <Route path="/community" element={<CommunityView />} />
               <Route path="/tv" element={<TvModeView />} />
               <Route path="/admin" element={<AdminStatusView />} />
               <Route path="/ops" element={<OpsView />} />
               <Route path="/match/:id" element={<MatchDetailView />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </Router>
  );
}


