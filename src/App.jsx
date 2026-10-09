import { BrowserRouter, Routes, Route } from "react-router-dom";

import Sidebar from "./components/Sidebar";


import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import DSA from "./pages/DSA";
import Projects from "./pages/Projects";
import Notes from "./pages/Notes";
import Planner from "./pages/Planner";
import Finance from "./pages/Finance";
import Profile from "./pages/Profile";
import PageWrapper from "./components/PageWrapper";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";

import "./App.css";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
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
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;