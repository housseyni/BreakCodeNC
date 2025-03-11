// Script pour générer une image à partir du diagramme PlantUML
import fs from 'fs';
import zlib from 'zlib';
import { promisify } from 'util';
import https from 'https';
import path from 'path';

const deflate = promisify(zlib.deflate);

// Fonction pour encoder en base64
function encode64(data) {
  let r = "";
  for (let i = 0; i < data.length; i += 3) {
    if (i + 2 === data.length) {
      r += append3bytes(data.charCodeAt(i), data.charCodeAt(i + 1), 0);
    } else if (i + 1 === data.length) {
      r += append3bytes(data.charCodeAt(i), 0, 0);
    } else {
      r += append3bytes(data.charCodeAt(i), data.charCodeAt(i + 1), data.charCodeAt(i + 2));
    }
  }
  return r;
}

function append3bytes(b1, b2, b3) {
  const c1 = b1 >> 2;
  const c2 = ((b1 & 0x3) << 4) | (b2 >> 4);
  const c3 = ((b2 & 0xF) << 2) | (b3 >> 6);
  const c4 = b3 & 0x3F;
  let r = "";
  r += encode6bit(c1 & 0x3F);
  r += encode6bit(c2 & 0x3F);
  r += encode6bit(c3 & 0x3F);
  r += encode6bit(c4 & 0x3F);
  return r;
}

function encode6bit(b) {
  if (b < 10) {
    return String.fromCharCode(48 + b);
  }
  b -= 10;
  if (b < 26) {
    return String.fromCharCode(65 + b);
  }
  b -= 26;
  if (b < 26) {
    return String.fromCharCode(97 + b);
  }
  b -= 26;
  if (b === 0) {
    return '-';
  }
  if (b === 1) {
    return '_';
  }
  return '?';
}

// Fonction pour télécharger une image depuis une URL
function downloadImage(url, outputPath) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Échec du téléchargement: ${response.statusCode}`));
        return;
      }

      const fileStream = fs.createWriteStream(outputPath);
      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });

      fileStream.on('error', (err) => {
        fs.unlink(outputPath, () => {}); // Supprimer le fichier en cas d'erreur
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function generateDiagram() {
  try {
    // Lire le contenu du fichier PlantUML
    const pumlContent = fs.readFileSync('./docs/diagramme.puml', 'utf8');
    
    // Compresser et encoder le contenu
    const buffer = await deflate(pumlContent);
    const compressed = buffer.toString('binary');
    const encoded = encode64(compressed);
    
    // Générer les URLs pour différents formats
    const pngUrl = `https://www.plantuml.com/plantuml/png/${encoded}`;
    const svgUrl = `https://www.plantuml.com/plantuml/svg/${encoded}`;
    
    console.log("Diagramme disponible aux URLs:");
    console.log(`PNG: ${pngUrl}`);
    console.log(`SVG: ${svgUrl}`);
    console.log("\nVous pouvez ouvrir ces URLs dans votre navigateur pour voir le diagramme.");
    
    // Créer le dossier public s'il n'existe pas
    const publicDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    
    // Télécharger l'image SVG pour une meilleure qualité
    const svgOutputPath = path.join(publicDir, 'diagram.svg');
    try {
      await downloadImage(svgUrl, svgOutputPath);
      console.log(`\nImage SVG téléchargée avec succès: ${svgOutputPath}`);
    } catch (downloadError) {
      console.error("Erreur lors du téléchargement de l'image SVG:", downloadError);
    }
    
    // Télécharger l'image PNG comme solution de secours
    const pngOutputPath = path.join(publicDir, 'diagram.png');
    try {
      await downloadImage(pngUrl, pngOutputPath);
      console.log(`Image PNG téléchargée avec succès: ${pngOutputPath}`);
    } catch (downloadError) {
      console.error("Erreur lors du téléchargement de l'image PNG:", downloadError);
    }
    
    // Créer un fichier HTML pour afficher le diagramme
    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Diagramme UML - Code Breaker</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background-color: #f5f5f5;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px;
    }
    h1 {
      color: #333;
      margin-bottom: 20px;
    }
    .diagram-container {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      padding: 20px;
      max-width: 100%;
      overflow: auto;
    }
    img {
      max-width: 100%;
    }
    .info {
      margin-top: 20px;
      padding: 15px;
      background-color: #e9f5ff;
      border-radius: 8px;
      border-left: 4px solid #0066cc;
    }
    .formats {
      display: flex;
      gap: 10px;
      margin-top: 20px;
    }
    .formats a {
      display: inline-block;
      padding: 8px 16px;
      background-color: #0066cc;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      font-weight: bold;
    }
    .formats a:hover {
      background-color: #0055aa;
    }
  </style>
</head>
<body>
  <h1>Diagramme UML - Code Breaker</h1>
  <div class="diagram-container">
    <img src="/diagram.svg" alt="Diagramme UML" onerror="this.src='/diagram.png'; this.onerror=null;">
  </div>
  <div class="formats">
    <a href="/diagram.svg" target="_blank">Voir en SVG</a>
    <a href="/diagram.png" target="_blank">Voir en PNG</a>
    <a href="${svgUrl}" target="_blank">Ouvrir sur PlantUML (SVG)</a>
  </div>
  <div class="info">
    <p>Ce diagramme est généré à partir du fichier <code>docs/diagramme.puml</code> en utilisant PlantUML.</p>
    <p>Pour modifier le diagramme, éditez le fichier source et régénérez l'image.</p>
  </div>
</body>
</html>
    `;
    
    fs.writeFileSync(path.join(publicDir, 'uml-diagram-static.html'), html);
    console.log("\nUn fichier HTML a été créé: public/uml-diagram-static.html");
    console.log("Vous pouvez accéder à ce fichier via: http://localhost:5173/uml-diagram-static.html");
  } catch (error) {
    console.error("Erreur lors de la génération du diagramme:", error);
  }
}

generateDiagram();