import { BrowserRouter, Routes, Route } from "react-router-dom";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";

import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import DSA from "./pages/DSA";
import Projects from "./pages/Projects";
import Notes from "./pages/Notes";

import "./App.css";

function App() {
  return (
    <BrowserRouter>

      <div className="app">

        <Sidebar />

        <div className="main">

          <Header />

          <Routes>

            <Route path="/" element={<Dashboard />} />

            <Route path="/tasks" element={<Tasks />} />

            <Route path="/dsa" element={<DSA />} />

            <Route path="/projects" element={<Projects />} />

            <Route path="/notes" element={<Notes />} />

          </Routes>

        </div>

      </div>

    </BrowserRouter>
  );
}

export default App;