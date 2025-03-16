import React from "react";

const UMLDiagramPage: React.FC = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Diagramme UML</h1>
      <div className="flex justify-center">
        <img
          src="/uml.png"
          alt="Diagramme UML du projet"
          className="max-w-full h-auto shadow-lg rounded-lg"
        />
      </div>
    </div>
  );
};

export default UMLDiagramPage;
