import React, { useState, useEffect } from 'react';
import { Trophy, ArrowUpDown, Trash2 } from 'lucide-react';

interface Score {
  name: string;
  score: number;
  date: string;
}

const ScorePage: React.FC = () => {
  const [scores, setScores] = useState<Score[]>([]);
  const [sortBy, setSortBy] = useState<'score' | 'date'>('score');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load scores from both localStorage and file
    const loadScores = async () => {
      setLoading(true);
      
      
      try {
        // First try to load from localStorage
        const localScores = JSON.parse(localStorage.getItem('scores') || '[]');
        
        // Then try to load from file
        let fileScores: Score[] = [];
        try {
          const response = await fetch('/scores-data.json');
          if (response.ok) {
            fileScores = await response.json();
          }
        } catch (error) {
          console.error('Error loading scores from file:', error);
        }
        
        // Merge scores, keeping the highest score for each player
        const mergedScores: Score[] = [...localScores];
        
        fileScores.forEach(fileScore => {
          const existingIndex = mergedScores.findIndex(s => s.name === fileScore.name);
          if (existingIndex === -1) {
            // Player doesn't exist in localStorage, add them
            mergedScores.push(fileScore);
          } else if (mergedScores[existingIndex].score < fileScore.score) {
            // Update if file score is better
            mergedScores[existingIndex] = fileScore;
          }
        });
        
        // Save merged scores back to localStorage
        localStorage.setItem('scores', JSON.stringify(mergedScores));
        
        setScores(mergedScores);
      } catch (error) {
        console.error('Error loading scores:', error);
        // Fallback to empty array
        setScores([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadScores();
    
    // Set up interval to refresh scores every 30 seconds
    const intervalId = setInterval(loadScores, 30000);
    
    return () => clearInterval(intervalId);
  }, []);

  const toggleSort = (field: 'score' | 'date') => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('desc');
    }
  };

  const sortedScores = [...scores].sort((a, b) => {
    if (sortBy === 'score') {
      return sortDirection === 'asc' ? a.score - b.score : b.score - a.score;
    } else {
      return sortDirection === 'asc'
        ? new Date(a.date).getTime() - new Date(b.date).getTime()
        : new Date(b.date).getTime() - new Date(a.date).getTime();
    }
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const clearScores = async () => {
    // Clear localStorage
    localStorage.setItem('scores', '[]');
    
    // Try to clear file scores by making a request
    try {
      const response = await fetch('/api/clear-scores', { method: 'POST' });
      if (!response.ok) {
        console.error('Failed to clear scores on server');
      }
    } catch (error) {
      console.error('Error clearing scores on server:', error);
    }
    
    setScores([]);
    setShowConfirmation(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Trophy className="text-yellow-500" size={28} />
            <h2 className="text-2xl font-bold">Tableau des scores</h2>
          </div>
          
          {scores.length > 0 && (
            <button
              onClick={() => setShowConfirmation(true)}
              className="flex items-center gap-1 px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
              title="Supprimer tous les scores"
            >
              <Trash2 size={16} />
              <span>Supprimer</span>
            </button>
          )}
        </div>

        {showConfirmation && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-md">
            <p className="mb-3 font-medium">Êtes-vous sûr de vouloir supprimer tous les scores ? Cette action est irréversible.</p>
            <div className="flex gap-2 justify-end">
              <button 
                onClick={() => setShowConfirmation(false)}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded"
              >
                Annuler
              </button>
              <button 
                onClick={clearScores}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded"
              >
                Confirmer
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-yellow-500 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
            <p className="mt-2 text-gray-400">Chargement des scores...</p>
          </div>
        ) : scores.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400">Aucun score enregistré pour le moment.</p>
            <p className="mt-2">Jouez une partie pour apparaître ici!</p>
          </div>
        ) : (
          <>
            <div className="flex justify-end mb-4">
              <div className="flex gap-2">
                <button
                  onClick={() => toggleSort('score')}
                  className={`flex items-center gap-1 px-3 py-1 rounded ${
                    sortBy === 'score' ? 'bg-yellow-600' : 'bg-gray-700'
                  }`}
                >
                  Score
                  {sortBy === 'score' && (
                    <ArrowUpDown size={14} className={sortDirection === 'asc' ? 'rotate-180' : ''} />
                  )}
                </button>
                <button
                  onClick={() => toggleSort('date')}
                  className={`flex items-center gap-1 px-3 py-1 rounded ${
                    sortBy === 'date' ? 'bg-yellow-600' : 'bg-gray-700'
                  }`}
                >
                  Date
                  {sortBy === 'date' && (
                    <ArrowUpDown size={14} className={sortDirection === 'asc' ? 'rotate-180' : ''} />
                  )}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="px-4 py-2 text-left">Rang</th>
                    <th className="px-4 py-2 text-left">Joueur</th>
                    <th className="px-4 py-2 text-right">Score</th>
                    <th className="px-4 py-2 text-right">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedScores.map((score, index) => (
                    <tr
                      key={index}
                      className={`border-b border-gray-700 ${index === 0 ? 'bg-yellow-900/20' : ''}`}
                    >
                      <td className="px-4 py-3">
                        {index === 0 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 bg-yellow-600 rounded-full text-sm font-bold">
                            1
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-6 h-6 bg-gray-700 rounded-full text-sm">
                            {index + 1}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium">{score.name}</td>
                      <td className="px-4 py-3 text-right font-mono">{score.score}</td>
                      <td className="px-4 py-3 text-right text-gray-400 text-sm">{formatDate(score.date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ScorePage;