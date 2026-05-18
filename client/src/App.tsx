import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Discover from "./pages/Discover";
import TalentProfile from "./pages/TalentProfile";
import Shortlists from "./pages/Shortlists";
import Submissions from "./pages/Submissions";
import AdminPanel from "./pages/AdminPanel";
import SubmitTalent from "./pages/SubmitTalent";
import SharedShortlist from "./pages/SharedShortlist";

function AuthenticatedApp() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/discover" component={Discover} />
        <Route path="/talent/:id" component={TalentProfile} />
        <Route path="/shortlists" component={Shortlists} />
        <Route path="/submissions" component={Submissions} />
        <Route path="/admin" component={AdminPanel} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function Router() {
  return (
    <Switch>
      {/* Public routes - no auth required */}
      <Route path="/submit" component={SubmitTalent} />
      <Route path="/shared/:token" component={SharedShortlist} />
      {/* All other routes go through authenticated layout */}
      <Route component={AuthenticatedApp} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
