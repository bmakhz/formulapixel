import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";

import { TabBar } from "./components/TabBar";
import { useThemeTokens } from "./theme";
import HomeScreen from "./pages/HomeScreen";
import LiveScreen from "./pages/LiveScreen";
import StandingsScreen from "./pages/StandingsScreen";
import ScheduleScreen from "./pages/ScheduleScreen";
import SettingsScreen from "./pages/SettingsScreen";

const queryClient = new QueryClient();

// Waits for the self-hosted pixel font to actually be loaded before first
// paint — mirrors the native app's useFonts() gate, avoiding a system-font
// flash on this heavily typography-driven UI.
function useFontsReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    document.fonts
      .load('12px "PressStart2P"')
      .then(() => document.fonts.ready)
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    // Safety timeout in case font loading stalls (offline first load, etc).
    const t = setTimeout(() => setReady(true), 1500);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, []);
  return ready;
}

function AppLayout() {
  const { C } = useThemeTokens();
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", backgroundColor: C.bg }}>
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        <Outlet />
      </div>
      <TabBar />
    </div>
  );
}

export default function App() {
  const fontsReady = useFontsReady();
  if (!fontsReady) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<HomeScreen />} />
            <Route path="/live" element={<LiveScreen />} />
            <Route path="/standings" element={<StandingsScreen />} />
            <Route path="/schedule" element={<ScheduleScreen />} />
            <Route path="/settings" element={<SettingsScreen />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
