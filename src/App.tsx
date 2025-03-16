import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Lock, FileText, GitBranch } from "lucide-react";
import GamePage from "./components/GamePage";
import ScorePage from "./components/ScorePage";
import WelcomePage from "./components/WelcomePage";
import PresentationPage from "./components/PresentationPage";
import UMLDiagramPage from "./components/UMLDiagramPage";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-900 text-white">
        <header className="bg-gray-800 p-4 shadow-md">
          <div className="container mx-auto flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Lock className="text-yellow-500" size={24} />
              <h1 className="text-2xl font-bold">Code Breaker</h1>
            </div>
            <nav>
              <ul className="flex space-x-6">
                <li>
                  <a
                    href="/"
                    className="hover:text-yellow-500 transition-colors"
                  >
                    Accueil
                  </a>
                </li>
                <li>
                  <a
                    href="/game"
                    className="hover:text-yellow-500 transition-colors"
                  >
                    Jouer
                  </a>
                </li>
                <li>
                  <a
                    href="/leaderboard.html"
                    className="hover:text-yellow-500 transition-colors"
                  >
                    Scores
                  </a>
                </li>
                <li>
                  <a
                    href="/presentation"
                    className="hover:text-yellow-500 transition-colors flex items-center gap-1"
                  >
                    <FileText size={16} />
                    Présentation
                  </a>
                </li>
                <li>
                  <a
                    href="/uml"
                    className="hover:text-yellow-500 transition-colors flex items-center gap-1"
                  >
                    <GitBranch size={16} />
                    UML
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </header>

        <main className="container mx-auto p-4">
          <Routes>
            <Route path="/" element={<WelcomePage />} />
            <Route path="/game" element={<GamePage />} />
            <Route path="/scores" element={<ScorePage />} />
            <Route path="/presentation" element={<PresentationPage />} />
            <Route path="/uml" element={<UMLDiagramPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
