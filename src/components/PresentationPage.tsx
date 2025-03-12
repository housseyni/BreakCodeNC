import React, { useState, useEffect } from "react";
import "katex/dist/katex.min.css";
import { InlineMath, BlockMath } from "react-katex";

const PresentationPage: React.FC = () => {
  const [latexContent, setLatexContent] = useState<string>("");

  useEffect(() => {
    fetch("/docs/rapport.tex")
      .then((response) => response.text())
      .then((content) => {
        // Extraire le contenu entre \begin{document} et \end{document}
        const match = content.match(
          /\\begin{document}([\s\S]*?)\\end{document}/
        );
        if (match) {
          setLatexContent(match[1]);
        }
      })
      .catch((error) => {
        console.error("Erreur lors du chargement du LaTeX:", error);
      });
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-gray-800 rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6">Présentation du projet</h1>
        <div className="bg-white text-black p-8 rounded-lg">
          <pre className="whitespace-pre-wrap font-serif text-base">
            {latexContent
              .split("\n")
              .map((line, index) => {
                // Ignorer les commandes de mise en page
                if (
                  line.trim().startsWith("\\maketitle") ||
                  line.trim().startsWith("\\tableofcontents") ||
                  line.trim().startsWith("\\newpage")
                ) {
                  return null;
                }

                // Traiter les sections
                if (line.trim().startsWith("\\section{")) {
                  const title = line.match(/\\section{(.*?)}/)?.[1];
                  return (
                    <h2 key={index} className="text-2xl font-bold mt-8 mb-4">
                      {title}
                    </h2>
                  );
                }

                // Traiter les sous-sections
                if (line.trim().startsWith("\\subsection{")) {
                  const title = line.match(/\\subsection{(.*?)}/)?.[1];
                  return (
                    <h3 key={index} className="text-xl font-bold mt-6 mb-3">
                      {title}
                    </h3>
                  );
                }

                // Traiter les listes
                if (line.trim().startsWith("\\begin{itemize}")) {
                  return <ul key={index} className="list-disc pl-6 mt-2" />;
                }
                if (line.trim().startsWith("\\end{itemize}")) {
                  return null;
                }
                if (line.trim().startsWith("\\item")) {
                  return (
                    <li key={index} className="mb-2">
                      {line.replace("\\item", "").trim()}
                    </li>
                  );
                }

                // Traiter les paragraphes normaux
                if (line.trim() && !line.trim().startsWith("\\")) {
                  return (
                    <p key={index} className="mb-4">
                      {line}
                    </p>
                  );
                }

                return null;
              })
              .filter(Boolean)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default PresentationPage;
