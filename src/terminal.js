import readline from 'readline';
import fs from 'fs';
import path from 'path';
import { Worker } from 'worker_threads';

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m',
  brightWhite: '\x1b[97m',
  bgBlack: '\x1b[40m',
};

// Game state
let playerName = '';
let secretCode = [];
let attempts = [];
let gameOver = false;
let musicPlaying = false;
let musicWorker = null;

// Generate a random 3-digit code
function generateSecretCode() {
  return Array(3).fill(0).map(() => Math.floor(Math.random() * 10));
}

// Generate feedback for a guess
function generateFeedback(guess) {
  const feedback = ['red', 'red', 'red']; // Default all to red
  const codeCopy = [...secretCode];
  const guessCopy = [...guess];
  
  // First pass: check for correct position (green)
  for (let i = 0; i < 3; i++) {
    if (guessCopy[i] === codeCopy[i]) {
      feedback[i] = 'green';
      codeCopy[i] = -1; // Mark as used
      guessCopy[i] = -2; // Different value to avoid confusion
    }
  }
  
  // Second pass: check for correct digit but wrong position (orange)
  for (let i = 0; i < 3; i++) {
    if (guessCopy[i] !== -2) { // Skip already matched digits
      const indexInCode = codeCopy.indexOf(guessCopy[i]);
      if (indexInCode !== -1) {
        feedback[i] = 'orange';
        codeCopy[indexInCode] = -1; // Mark as used
      }
    }
  }
  
  return feedback;
}

// Display colored feedback
function displayFeedback(guess, feedback) {
  let display = '';
  
  for (let i = 0; i < 3; i++) {
    if (feedback[i] === 'green') {
      display += `${colors.brightGreen}${guess[i]}${colors.reset} `;
    } else if (feedback[i] === 'orange') {
      display += `${colors.brightYellow}${guess[i]}${colors.reset} `;
    } else {
      display += `${colors.brightRed}${guess[i]}${colors.reset} `;
    }
  }
  
  return display;
}

// Save score to both JSON file and localStorage-compatible file
function saveScore() {
  const score = 100 - (attempts.length * 5); // Higher score for fewer attempts
  const finalScore = Math.max(score, 10);
  const scoreData = {
    name: playerName,
    score: finalScore,
    date: new Date().toISOString()
  };
  
  // Create scores directory if it doesn't exist
  const scoresDir = path.join(process.cwd(), 'scores');
  if (!fs.existsSync(scoresDir)) {
    fs.mkdirSync(scoresDir, { recursive: true });
  }
  
  // Read existing scores
  const scoresFile = path.join(scoresDir, 'scores.json');
  let scores = [];
  
  if (fs.existsSync(scoresFile)) {
    try {
      const data = fs.readFileSync(scoresFile, 'utf8');
      scores = JSON.parse(data);
    } catch (err) {
      console.error('Error reading scores file:', err);
    }
  }
  
  // Check if player already has a score
  const existingScoreIndex = scores.findIndex(s => s.name === playerName);
  
  if (existingScoreIndex !== -1) {
    // Only update if new score is better
    if (scores[existingScoreIndex].score < finalScore) {
      scores[existingScoreIndex].score = finalScore;
      scores[existingScoreIndex].date = new Date().toISOString();
    }
  } else {
    // Add new score
    scores.push(scoreData);
  }
  
  try {
    // Save to scores.json (for terminal)
    fs.writeFileSync(scoresFile, JSON.stringify(scores, null, 2), 'utf8');
    
    // Save to public/scores-data.json (for web)
    const webScoresFile = path.join(process.cwd(), 'public', 'scores-data.json');
    fs.writeFileSync(webScoresFile, JSON.stringify(scores, null, 2), 'utf8');
    
    console.log(`${colors.brightGreen}Score sauvegardé!${colors.reset}`);
  } catch (err) {
    console.error('Error writing scores file:', err);
  }
}

// Toggle background music using worker threads
function toggleMusic() {
  if (musicPlaying) {
    if (musicWorker) {
      musicWorker.postMessage('stop');
      musicWorker = null;
    }
    musicPlaying = false;
    console.log(`${colors.brightYellow}Musique arrêtée.${colors.reset}`);
  } else {
    try {
      // Create a worker thread for music playback
      // Note: In a real environment, this would play music
      // Here we're just simulating it with a worker thread
      musicWorker = new Worker(`
        const { parentPort } = require('worker_threads');
        
        let playing = true;
        
        // Simulate music playback
        const interval = setInterval(() => {
          if (playing) {
            // This would be where music plays
            // console.log('♪ ♫ ♪');
          }
        }, 1000);
        
        parentPort.on('message', (message) => {
          if (message === 'stop') {
            playing = false;
            clearInterval(interval);
            parentPort.close();
          }
        });
      `, { eval: true });
      
      musicPlaying = true;
      console.log(`${colors.brightYellow}Musique de fond activée.${colors.reset}`);
    } catch (error) {
      console.error('Impossible de démarrer la musique:', error);
    }
  }
}

// Display game banner
function displayBanner() {
  console.clear();
  console.log(`${colors.brightCyan}╔═════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.brightCyan}║       ${colors.brightYellow}CODE BREAKER - TERMINAL${colors.brightCyan}       ║${colors.reset}`);
  console.log(`${colors.brightCyan}╚═════════════════════════════════════╝${colors.reset}`);
  console.log();
}

// Display game instructions
function displayInstructions() {
  console.log(`${colors.brightWhite}Comment jouer:${colors.reset}`);
  console.log(`- Devinez un code secret de 3 chiffres (0-9)`);
  console.log(`- ${colors.brightGreen}Vert${colors.reset} = bon chiffre, bonne position`);
  console.log(`- ${colors.brightYellow}Orange${colors.reset} = bon chiffre, mauvaise position`);
  console.log(`- ${colors.brightRed}Rouge${colors.reset} = mauvais chiffre`);
  console.log(`- Tapez 'music' pour activer/désactiver la musique de fond`);
  console.log(`- Tapez 'quit' pour quitter le jeu`);
  console.log();
}

// Start the game
function startGame() {
  displayBanner();
  displayInstructions();
  
  rl.question(`${colors.brightCyan}Entrez votre nom: ${colors.reset}`, (name) => {
    playerName = name.trim() || 'Joueur';
    secretCode = generateSecretCode();
    
    console.log(`\n${colors.brightMagenta}Bienvenue, ${playerName}!${colors.reset}`);
    console.log(`${colors.brightWhite}Devinez le code secret de 3 chiffres...${colors.reset}\n`);
    
    askForGuess();
  });
}

// Ask for a guess
function askForGuess() {
  rl.question(`${colors.brightCyan}Votre proposition (#${attempts.length + 1}): ${colors.reset}`, (input) => {
    const guess = input.trim().toLowerCase();
    
    // Special commands
    if (guess === 'quit' || guess === 'exit' || guess === 'q') {
      console.log(`\n${colors.brightYellow}Merci d'avoir joué, ${playerName}!${colors.reset}\n`);
      cleanup();
      return;
    }
    
    if (guess === 'music' || guess === 'm') {
      toggleMusic();
      askForGuess();
      return;
    }
    
    // Validate input
    if (!/^\d{3}$/.test(guess)) {
      console.log(`${colors.brightRed}Entrée invalide! Veuillez entrer exactement 3 chiffres.${colors.reset}\n`);
      askForGuess();
      return;
    }
    
    // Convert guess to array of numbers
    const guessArray = guess.split('').map(Number);
    
    // Generate feedback
    const feedback = generateFeedback(guessArray);
    
    // Add to attempts
    attempts.push({ guess: guessArray, feedback });
    
    // Display attempt history
    console.log(`\n${colors.brightWhite}Historique des essais:${colors.reset}`);
    attempts.forEach((attempt, index) => {
      console.log(`#${index + 1}: ${displayFeedback(attempt.guess, attempt.feedback)}`);
    });
    console.log();
    
    // Check if player won
    if (feedback.every(f => f === 'green')) {
      console.log(`${colors.brightGreen}╔═════════════════════════════════════╗${colors.reset}`);
      console.log(`${colors.brightGreen}║           FÉLICITATIONS!            ║${colors.reset}`);
      console.log(`${colors.brightGreen}╚═════════════════════════════════════╝${colors.reset}`);
      console.log(`${colors.brightGreen}Vous avez trouvé le code en ${attempts.length} essai${attempts.length > 1 ? 's' : ''}!${colors.reset}`);
      
      const score = 100 - (attempts.length * 5);
      console.log(`${colors.brightYellow}Votre score: ${Math.max(score, 10)} points${colors.reset}\n`);
      
      saveScore();
      gameOver = true;
      askToPlayAgain();
    } else if (attempts.length >= 15) {
      // Limit to 15 attempts
      console.log(`${colors.brightRed}╔═════════════════════════════════════╗${colors.reset}`);
      console.log(`${colors.brightRed}║           PARTIE TERMINÉE           ║${colors.reset}`);
      console.log(`${colors.brightRed}╚═════════════════════════════════════╝${colors.reset}`);
      console.log(`${colors.brightRed}Vous avez atteint le nombre maximum d'essais.${colors.reset}`);
      console.log(`${colors.brightWhite}Le code secret était: ${colors.brightMagenta}${secretCode.join('')}${colors.reset}\n`);
      
      gameOver = true;
      askToPlayAgain();
    } else {
      // Continue game
      askForGuess();
    }
  });
}

// Ask to play again
function askToPlayAgain() {
  rl.question(`${colors.brightCyan}Voulez-vous rejouer? (o/n): ${colors.reset}`, (answer) => {
    if (answer.toLowerCase() === 'o' || answer.toLowerCase() === 'oui') {
      attempts = [];
      secretCode = generateSecretCode();
      gameOver = false;
      console.clear();
      displayBanner();
      console.log(`${colors.brightMagenta}Bienvenue à nouveau, ${playerName}!${colors.reset}`);
      console.log(`${colors.brightWhite}Devinez le code secret de 3 chiffres...${colors.reset}\n`);
      askForGuess();
    } else {
      console.log(`\n${colors.brightYellow}Merci d'avoir joué, ${playerName}!${colors.reset}`);
      console.log(`${colors.brightWhite}Consultez vos scores dans l'interface web.${colors.reset}\n`);
      cleanup();
    }
  });
}

// Cleanup resources
function cleanup() {
  if (musicWorker) {
    musicWorker.postMessage('stop');
    musicWorker = null;
  }
  rl.close();
}

// Handle process termination
process.on('SIGINT', () => {
  console.log(`\n${colors.brightYellow}Jeu interrompu. Au revoir!${colors.reset}\n`);
  cleanup();
  process.exit(0);
});

// Create public directory if it doesn't exist
const publicDir = path.join(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Create empty scores file if it doesn't exist
const webScoresFile = path.join(publicDir, 'scores-data.json');
if (!fs.existsSync(webScoresFile)) {
  fs.writeFileSync(webScoresFile, '[]', 'utf8');
}

// Start the game
startGame();