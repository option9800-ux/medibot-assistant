import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
import Login from "./pages/Login";
import Index from "./pages/Index";
import Chat from "./pages/Chat";
import SymptomChecker from "./pages/SymptomChecker";
import MedicineInfo from "./pages/MedicineInfo";
import Reports from "./pages/Reports";
import DoctorFinder from "./pages/DoctorFinder";
import HealthHistory from "./pages/HealthHistory";
import Profile from "./pages/Profile";
import Medications from "./pages/Medications";
import Vitals from "./pages/Vitals";
import Appointments from "./pages/Appointments";
import Emergency from "./pages/Emergency";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/chat" element={<Chat />} />
                      <Route path="/symptoms" element={<SymptomChecker />} />
                      <Route path="/medicine" element={<MedicineInfo />} />
                      <Route path="/reports" element={<Reports />} />
                      <Route path="/doctors" element={<DoctorFinder />} />
                      <Route path="/history" element={<HealthHistory />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/medications" element={<Medications />} />
                      <Route path="/vitals" element={<Vitals />} />
                      <Route path="/appointments" element={<Appointments />} />
                      <Route path="/emergency" element={<Emergency />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
          </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
