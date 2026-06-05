import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { DashboardView } from './views/DashboardView';
import { MatchesView } from './views/MatchesView';
import { GroupsView } from './views/GroupsView';
import { PredictorView } from './views/PredictorView';
import { MatchDetailView } from './views/MatchDetailView';
import { SimulatorView } from './views/SimulatorView';
import { CommunityView } from './views/CommunityView';
import { FantasyView } from './views/FantasyView';
import { UniverseView } from './views/UniverseView';
import { TwinView } from './views/TwinView';
import { TvModeView } from './views/TvModeView';
import { AssistantView } from './views/AssistantView';
import { AdminStatusView } from './views/AdminStatusView';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background text-foreground flex">
        <Navigation />
        <main className="flex-1 md:ml-56 p-4 md:p-6 pb-24 md:pb-6 w-full max-w-7xl mx-auto overflow-x-hidden">
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
             <Route path="/match/:id" element={<MatchDetailView />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

