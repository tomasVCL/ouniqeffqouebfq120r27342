import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import AnalystLayout from "./components/AnalystLayout";
import AnalystLogin from "./pages/AnalystLogin";
import AnalystDashboard from "./pages/AnalystDashboard";
import AnalystProjects from "./pages/AnalystProjects";
import ProjectWorkspace from "./pages/ProjectWorkspace";
import ClientPortal from "./pages/ClientPortal";

function AnalystApp() {
  return (
    <AnalystLayout>
      <Switch>
        <Route path="/analyst" component={AnalystDashboard} />
        <Route path="/analyst/dashboard" component={AnalystDashboard} />
        <Route path="/analyst/projects" component={AnalystProjects} />
        <Route path="/analyst/projects/:id" component={ProjectWorkspace} />
        <Route path="/analyst/projects/:id/step/:step" component={ProjectWorkspace} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </AnalystLayout>
  );
}

function Router() {
  return (
    <Switch>
      {/* Public client portal — accessed via passkey */}
      <Route path="/client/:projectId" component={ClientPortal} />
      {/* Analyst login */}
      <Route path="/login" component={AnalystLogin} />
      {/* Root redirects to analyst dashboard */}
      <Route path="/" component={AnalystLogin} />
      {/* All /analyst/* routes go through the analyst layout */}
      <Route path="/analyst/:rest*" component={AnalystApp} />
      <Route component={NotFound} />
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
