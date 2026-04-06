import { Outlet, Link, useLocation } from "react-router-dom";
import {
  Brain,
  FlaskConical,
  BarChart3,
  Eye,
  Server,
  Home,
  Play,
} from "lucide-react";

const NAV_ITEMS = [
  { path: "/", label: "Home", icon: Home },
  { path: "/demo", label: "Try It", icon: Play },
  { path: "/dataset", label: "Dataset", icon: FlaskConical },
  { path: "/model", label: "Model", icon: Brain },
  { path: "/results", label: "Results", icon: BarChart3 },
  { path: "/explainability", label: "Explainability", icon: Eye },
  { path: "/architecture", label: "System", icon: Server },
];

export function Layout() {
  const location = useLocation();

  return (
    <div className="flex min-h-screen">
      <nav className="w-56 border-r border-sidebar-border bg-sidebar p-4 flex flex-col gap-1 sticky top-0 h-screen">
        <Link to="/" className="flex items-center gap-2 px-3 py-4 mb-4">
          <Brain className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg text-foreground">BrainLens</span>
        </Link>
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
          <Link
            key={path}
            to={path}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors
              ${
                location.pathname === path
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>
      <main className="flex-1 p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
