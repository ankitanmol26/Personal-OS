import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Sidebar from "./components/Sidebar";
import PageWrapper from "./components/PageWrapper";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";

import "./App.css";

// Route-level code splitting for production bundle optimization
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Tasks = lazy(() => import("./pages/Tasks"));
const Planner = lazy(() => import("./pages/Planner"));
const DSA = lazy(() => import("./pages/DSA"));
const Projects = lazy(() => import("./pages/Projects"));
const Notes = lazy(() => import("./pages/Notes"));
const Finance = lazy(() => import("./pages/Finance"));
const Profile = lazy(() => import("./pages/Profile"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const JoinTrip = lazy(() => import("./pages/JoinTrip"));

const PageLoader = () => (
  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh", color: "var(--text-secondary, #94a3b8)" }}>
    Loading...
  </div>
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <NotificationProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/join-trip" element={<JoinTrip />} />
              <Route path="/*" element={
                <ProtectedRoute>
                  <div className="app">
                    <Sidebar />
                    <div className="main">
                      <Routes>
                        <Route path="/" element={<PageWrapper className="page-wrapper"><Dashboard /></PageWrapper>} />
                        <Route path="/tasks" element={<PageWrapper className="page-wrapper"><Tasks /></PageWrapper>} />
                        <Route path="/planner" element={<PageWrapper className="page-wrapper"><Planner /></PageWrapper>} />
                        <Route path="/dsa" element={<PageWrapper className="page-wrapper"><DSA /></PageWrapper>} />
                        <Route path="/projects" element={<PageWrapper className="page-wrapper"><Projects /></PageWrapper>} />
                        <Route path="/notes" element={<PageWrapper className="page-wrapper"><Notes /></PageWrapper>} />
                        <Route path="/finance" element={<PageWrapper className="page-wrapper"><Finance /></PageWrapper>} />
                        <Route path="/profile" element={<PageWrapper className="page-wrapper"><Profile /></PageWrapper>} />
                      </Routes>
                    </div>
                  </div>
                </ProtectedRoute>
              } />
            </Routes>
          </Suspense>
        </NotificationProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
