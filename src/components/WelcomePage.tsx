import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';

const WelcomePage: React.FC = () => {
  const [playerName, setPlayerName] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim()) {
      localStorage.setItem('currentPlayer', playerName.trim());
      navigate('/game');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full">
        <div className="flex justify-center mb-6">
          <Lock size={64} className="text-yellow-500" />
        </div>
        <h1 className="text-3xl font-bold text-center mb-6">Code Breaker</h1>
        <p className="text-gray-300 mb-6 text-center">
          Déchiffrez le code secret de 3 chiffres. Moins d'essais = meilleur score!
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="playerName" className="block text-sm font-medium mb-1">
              Votre nom
            </label>
            <input
              type="text"
              id="playerName"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              placeholder="Entrez votre nom"
              required
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-md transition-colors"
          >
            Commencer à jouer
          </button>
        </form>
        
        <div className="mt-6 text-sm text-gray-400">
          <h3 className="font-medium mb-2">Comment jouer:</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Devinez un code secret de 3 chiffres (0-9)</li>
            <li><span className="text-green-500">Vert</span> = bon chiffre, bonne position</li>
            <li><span className="text-orange-500">Orange</span> = bon chiffre, mauvaise position</li>
            <li><span className="text-red-500">Rouge</span> = mauvais chiffre</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;