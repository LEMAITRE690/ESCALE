import React from "react";

// Rendu du markdown stocké dans legal_documents. Volontairement minimal :
// titres, listes, gras et paragraphes suffisent à un texte juridique, et une
// dépendance de rendu markdown ferait entrer un risque d'interprétation sur
// des documents opposables.

function enrichir(texte, cle) {
  // **gras** — seul enrichissement en ligne admis.
  const morceaux = texte.split(/(\*\*[^*]+\*\*)/g);
  return morceaux.map((m, i) =>
    m.startsWith("**") && m.endsWith("**") ? (
      <strong key={`${cle}-${i}`} className="text-[#1B3A3A]">
        {m.slice(2, -2)}
      </strong>
    ) : (
      <React.Fragment key={`${cle}-${i}`}>{m}</React.Fragment>
    )
  );
}

export default function TexteJuridique({ contenu, compact = false }) {
  const lignes = contenu.split("\n");
  const elements = [];
  let listeEnCours = [];

  const viderListe = (cle) => {
    if (listeEnCours.length === 0) return;
    elements.push(
      <ul key={`liste-${cle}`} className="list-disc pl-5 space-y-1.5 mb-4">
        {listeEnCours.map((item, i) => (
          <li key={i} className={compact ? "text-xs text-[#6B5B4D]" : "text-sm text-[#6B5B4D]"}>
            {enrichir(item, `l-${cle}-${i}`)}
          </li>
        ))}
      </ul>
    );
    listeEnCours = [];
  };

  lignes.forEach((brute, i) => {
    const ligne = brute.trim();

    if (!ligne) {
      viderListe(i);
      return;
    }

    if (ligne.startsWith("- ")) {
      listeEnCours.push(ligne.slice(2));
      return;
    }

    viderListe(i);

    if (ligne.startsWith("# ")) {
      elements.push(
        <h1 key={i} className="font-serif text-3xl md:text-4xl text-[#1B3A3A] mb-6">
          {ligne.slice(2)}
        </h1>
      );
    } else if (ligne.startsWith("## ")) {
      elements.push(
        <h2 key={i} className={`font-serif text-[#1B3A3A] mb-3 ${compact ? "text-base pt-3" : "text-xl pt-5"}`}>
          {ligne.slice(3)}
        </h2>
      );
    } else if (ligne.startsWith("### ")) {
      elements.push(
        <h3 key={i} className="font-serif text-base text-[#1B3A3A] mb-2 pt-3">
          {ligne.slice(4)}
        </h3>
      );
    } else {
      elements.push(
        <p
          key={i}
          className={`text-[#6B5B4D] leading-relaxed mb-3 ${compact ? "text-xs text-justify" : "text-sm"}`}
        >
          {enrichir(ligne, i)}
        </p>
      );
    }
  });

  viderListe("fin");

  return <div>{elements}</div>;
}
