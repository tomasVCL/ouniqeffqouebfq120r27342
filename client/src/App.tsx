import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Redirect, Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import ClientPortalV2 from "./pages/ClientPortalV2";
import ReportAccess from "./pages/ReportAccess";

function Router() {
  return (
    <Switch>
      {/* Pantalla de acceso unificada */}
      <Route path="/acceso" component={ReportAccess} />

      {/* Portal de cliente con nomenclatura /:clientSlug/:problemId (ej. /wts/001) */}
      <Route path="/:clientSlug/:problemId" component={ClientPortalV2} />

      {/* Ruta legacy V2 — compatibilidad hacia atrás */}
      <Route path="/client/v2/:projectId" component={ClientPortalV2} />

      {/* Raíz redirige a la pantalla de acceso */}
      <Route path="/">{() => <Redirect to="/acceso" />}</Route>

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
