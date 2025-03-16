import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Check, RefreshCw, Volume2, VolumeX } from "lucide-react";

const GamePage: React.FC = () => {
  const [secretCode, setSecretCode] = useState<number[]>([]);
  const [currentGuess, setCurrentGuess] = useState<string[]>(["", "", ""]);
  const [attempts, setAttempts] = useState<
    Array<{ guess: number[]; feedback: string[] }>
  >([]);
  const [gameOver, setGameOver] = useState(false);
  const [win, setWin] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const navigate = useNavigate();

  // Generate a random 3-digit code
  const generateSecretCode = () => {
    const newCode = Array(3)
      .fill(0)
      .map(() => Math.floor(Math.random() * 10));
    setSecretCode(newCode);
    return newCode;
  };

  // Initialize the game
  useEffect(() => {
    const playerName = localStorage.getItem("currentPlayer");
    if (!playerName) {
      navigate("/");
      return;
    }

    generateSecretCode();

    // Create audio element for background music
    if (!audioRef.current) {
      const audio = new Audio();
      audio.src = "/musique-de-fond.mp3"; // Example music URL
      audio.loop = true;
      audio.volume = 0.3;
      audioRef.current = audio;
    }

    return () => {
      // Cleanup audio when component unmounts
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [navigate]);

  // Toggle background music
  const toggleAudio = () => {
    if (!audioRef.current) return;

    if (audioPlaying) {
      audioRef.current.pause();
    } else {
      // Use a try-catch block to handle potential playback issues
      try {
        const playPromise = audioRef.current.play();

        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.log("Audio playback was prevented by the browser:", error);
            // We still toggle the state to show the user their intent was registered
          });
        }
      } catch (error) {
        console.log("Error playing audio:", error);
      }
    }

    setAudioPlaying(!audioPlaying);
  };

  // Handle input change for each digit
  const handleInputChange = (index: number, value: string) => {
    if (value === "" || /^[0-9]$/.test(value)) {
      const newGuess = [...currentGuess];
      newGuess[index] = value;
      setCurrentGuess(newGuess);

      // Auto-focus next input
      if (value !== "" && index < 2) {
        const nextInput = document.getElementById(`digit-${index + 1}`);
        if (nextInput) nextInput.focus();
      }
    }
  };

  // Handle keydown events
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    // Submit with Enter if all digits are filled
    if (e.key === "Enter" && !currentGuess.some((digit) => digit === "")) {
      submitGuess();
      return;
    }

    // Handle Backspace to move to previous input
    if (e.key === "Backspace" && currentGuess[index] === "" && index > 0) {
      // If current field is empty and backspace is pressed, focus previous field
      const prevInput = document.getElementById(`digit-${index - 1}`);
      if (prevInput) {
        prevInput.focus();
      }
    }
  };

  // Generate feedback for a guess
  const generateFeedback = (guess: number[]) => {
    const feedback: string[] = ["red", "red", "red"]; // Default all to red
    const codeCopy = [...secretCode];
    const guessCopy = [...guess];

    // First pass: check for correct position (green)
    for (let i = 0; i < 3; i++) {
      if (guessCopy[i] === codeCopy[i]) {
        feedback[i] = "green";
        codeCopy[i] = -1; // Mark as used
        guessCopy[i] = -2; // Different value to avoid confusion
      }
    }

    // Second pass: check for correct digit but wrong position (orange)
    for (let i = 0; i < 3; i++) {
      if (guessCopy[i] !== -2) {
        // Skip already matched digits
        const indexInCode = codeCopy.indexOf(guessCopy[i]);
        if (indexInCode !== -1) {
          feedback[i] = "orange";
          codeCopy[indexInCode] = -1; // Mark as used
        }
      }
    }

    return feedback;
  };

  // Submit a guess
  const submitGuess = () => {
    // Check if all digits are filled
    if (currentGuess.some((digit) => digit === "")) {
      return;
    }

    const guessNumbers = currentGuess.map(Number);
    const feedback = generateFeedback(guessNumbers);

    setAttempts([...attempts, { guess: guessNumbers, feedback }]);
    setCurrentGuess(["", "", ""]);

    // Focus first input for next guess
    const firstInput = document.getElementById("digit-0");
    if (firstInput) firstInput.focus();

    // Check if player won
    if (feedback.every((f) => f === "green")) {
      setWin(true);
      setGameOver(true);
      saveScore();
    }
  };

  // Save score to localStorage and try to save to file
  const saveScore = async () => {
    const playerName = localStorage.getItem("currentPlayer") || "Unknown";
    const score = 100 - attempts.length * 5; // Higher score for fewer attempts
    const finalScore = Math.max(score, 10);

    // Get existing scores from localStorage
    const scores = JSON.parse(localStorage.getItem("scores") || "[]");

    // Check if player already has a score
    const existingScoreIndex = scores.findIndex(
      (s: any) => s.name === playerName
    );

    if (existingScoreIndex !== -1) {
      // Only update if new score is better
      if (scores[existingScoreIndex].score < finalScore) {
        scores[existingScoreIndex].score = finalScore;
        scores[existingScoreIndex].date = new Date().toISOString();
      }
    } else {
      // Add new score
      scores.push({
        name: playerName,
        score: finalScore,
        date: new Date().toISOString(),
      });
    }

    // Save to localStorage
    localStorage.setItem("scores", JSON.stringify(scores));

    // Try to load and update file scores
    try {
      // Load existing file scores
      const response = await fetch("/scores-data.json");
      if (response.ok) {
        const fileScores = await response.json();

        // Check if player already has a score in file
        const existingFileScoreIndex = fileScores.findIndex(
          (s: any) => s.name === playerName
        );

        let updated = false;
        if (existingFileScoreIndex !== -1) {
          // Only update if new score is better
          if (fileScores[existingFileScoreIndex].score < finalScore) {
            fileScores[existingFileScoreIndex].score = finalScore;
            fileScores[existingFileScoreIndex].date = new Date().toISOString();
            updated = true;
          }
        } else {
          // Add new score
          fileScores.push({
            name: playerName,
            score: finalScore,
            date: new Date().toISOString(),
          });
          updated = true;
        }

        // If we updated the file scores, try to save them
        if (updated) {
          // In a real implementation, this would be an API call to save to a file
          // For example:
          // await fetch('/api/scores', {
          //   method: 'POST',
          //   headers: { 'Content-Type': 'application/json' },
          //   body: JSON.stringify(fileScores)
          // });
          console.log(
            "Score saved to localStorage and would be saved to file in a real implementation"
          );
        }
      }
    } catch (error) {
      console.error("Error updating file scores:", error);
    }
  };

  // Reset the game
  const resetGame = () => {
    setSecretCode(generateSecretCode());
    setCurrentGuess(["", "", ""]);
    setAttempts([]);
    setGameOver(false);
    setWin(false);
  };

  // Render history component
  const renderHistory = () => {
    return (
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 h-full">
        <h3 className="font-bold mb-4">
          Historique des essais ({attempts.length})
        </h3>

        {attempts.length === 0 ? (
          <p className="text-gray-400 text-center py-4">
            Aucun essai pour le moment
          </p>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {[...attempts].reverse().map((attempt, attemptIndex) => (
              <div
                key={attemptIndex}
                className="flex items-center gap-4 p-2 bg-gray-700/50 rounded-md"
              >
                <span className="text-gray-400 w-6 text-right">
                  #{attempts.length - attemptIndex}
                </span>
                <div className="flex gap-2">
                  {attempt.guess.map((digit, digitIndex) => (
                    <div
                      key={digitIndex}
                      className={`w-10 h-10 flex items-center justify-center rounded-md font-mono font-bold ${
                        attempt.feedback[digitIndex] === "green"
                          ? "bg-green-600"
                          : attempt.feedback[digitIndex] === "orange"
                          ? "bg-orange-600"
                          : "bg-red-600"
                      }`}
                    >
                      {digit}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
      <div className="md:col-span-2">
        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Code Breaker</h2>
            <button
              onClick={toggleAudio}
              className={`flex items-center gap-1 text-sm px-3 py-1 rounded ${
                audioPlaying ? "bg-yellow-600" : "bg-gray-700"
              }`}
              title="Activer/désactiver la musique de fond"
            >
              {audioPlaying ? (
                <>
                  <Volume2 size={16} />
                  <span>Musique ON</span>
                </>
              ) : (
                <>
                  <VolumeX size={16} />
                  <span>Musique OFF</span>
                </>
              )}
            </button>
          </div>

          <p className="text-gray-300 mb-4">
            Joueur:{" "}
            <span className="font-medium">
              {localStorage.getItem("currentPlayer")}
            </span>
          </p>

          {gameOver ? (
            <div
              className={`p-4 rounded-md mb-4 ${
                win ? "bg-green-900/50" : "bg-red-900/50"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {win ? (
                  <Check className="text-green-500" />
                ) : (
                  <AlertCircle className="text-red-500" />
                )}
                <h3 className="font-bold">
                  {win ? "Félicitations!" : "Partie terminée!"}
                </h3>
              </div>
              <p>
                {win
                  ? `Vous avez trouvé le code en ${attempts.length} essai${
                      attempts.length > 1 ? "s" : ""
                    }!`
                  : "Vous n'avez pas trouvé le code."}
              </p>
              <p className="mt-2">
                Le code secret était:{" "}
                <span className="font-mono font-bold">
                  {secretCode.join("")}
                </span>
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={resetGame}
                  className="flex items-center gap-1 bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-md"
                >
                  <RefreshCw size={16} />
                  Rejouer
                </button>
                <button
                  onClick={() => (window.location.href = "/leaderboard.html")}
                  className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-md"
                >
                  Voir les scores
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex gap-2 mb-6">
                {[0, 1, 2].map((index) => (
                  <input
                    key={index}
                    id={`digit-${index}`}
                    type="text"
                    maxLength={1}
                    value={currentGuess[index]}
                    onChange={(e) => handleInputChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    className="w-full h-16 text-center text-2xl font-bold bg-gray-700 border-2 border-gray-600 rounded-md focus:outline-none focus:border-yellow-500"
                  />
                ))}
              </div>

              <button
                onClick={submitGuess}
                disabled={currentGuess.some((digit) => digit === "")}
                className={`w-full py-3 rounded-md font-bold ${
                  currentGuess.some((digit) => digit === "")
                    ? "bg-gray-700 cursor-not-allowed"
                    : "bg-yellow-600 hover:bg-yellow-700"
                }`}
              >
                Valider
              </button>
            </>
          )}
        </div>
      </div>

      <div className="md:col-span-1">{renderHistory()}</div>
    </div>
  );
};

export default GamePage;
