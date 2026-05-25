import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Redirect, Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import AnalystLogin from "./pages/AnalystLogin";
import AnalystDashboard from "./pages/AnalystDashboard";
import AnalystProjects from "./pages/AnalystProjects";
import ProjectWorkspace from "./pages/ProjectWorkspace";
import ClientPortalV2 from "./pages/ClientPortalV2";
import ReportAccess from "./pages/ReportAccess";

function AnalystApp() {
  return (
    <Switch>
      <Route path="/analyst" component={AnalystDashboard} />
      <Route path="/analyst/dashboard" component={AnalystDashboard} />
      <Route path="/analyst/projects" component={AnalystProjects} />
      <Route path="/analyst/projects/:id" component={ProjectWorkspace} />
      <Route path="/analyst/projects/:id/step/:step" component={ProjectWorkspace} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function Router() {
  return (
    <Switch>
      {/* Unified report access — /acceso */}
      <Route path="/acceso" component={ReportAccess} />

      {/* New slug-based client portal — /:clientSlug/:problemId (e.g. /wts/001) */}
      <Route path="/:clientSlug/:problemId" component={ClientPortalV2} />

      {/* Legacy V2 route — kept for backward compatibility during transition */}
      <Route path="/client/v2/:projectId" component={ClientPortalV2} />

      {/* Analyst login */}
      <Route path="/login" component={AnalystLogin} />

      {/* Root redirects to unified access page */}
      <Route path="/">{() => <Redirect to="/acceso" />}</Route>

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
