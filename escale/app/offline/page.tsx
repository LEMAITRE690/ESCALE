// app/offline/page.tsx
// Servie automatiquement par le service worker (voir next.config.js,
// fallbacks.document) lorsque l'utilisateur ouvre l'app sans connexion.

export default function Offline() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        background: "#F8F4EC",
        color: "#1B3A3A",
        fontFamily: "serif",
        textAlign: "center",
        padding: 24,
      }}
    >
      <h1 style={{ fontSize: 22, margin: 0 }}>Pas de connexion</h1>
      <p style={{ fontFamily: "sans-serif", fontSize: 14, color: "#6B5B4D", maxWidth: 320 }}>
        Escale a besoin d'une connexion internet pour afficher les réservations et les annonces à jour.
        Vérifiez votre connexion et réessayez.
      </p>
    </div>
  );
}
