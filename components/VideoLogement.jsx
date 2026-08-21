export default function VideoLogement({ youtubeId, titre = "Découvrir le logement en vidéo" }) {
  if (!youtubeId) return null;
  return <section className="overflow-hidden rounded-2xl border border-[#E4DCC8] bg-black">
    <div className="aspect-video">
      <iframe
        className="h-full w-full"
        src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(youtubeId)}`}
        title={titre}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  </section>;
}
