import { BrowserRouter, Routes, Route } from "react-router-dom";

import Sidebar from "./components/Sidebar";


import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import DSA from "./pages/DSA";
import Projects from "./pages/Projects";
import Notes from "./pages/Notes";
import Planner from "./pages/Planner";
import PageWrapper from "./components/PageWrapper";

import "./App.css";

function App() {
  return (
    <BrowserRouter>

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
          </Routes>
        </div>
      </div>

    </BrowserRouter>
  );
}

export default App;