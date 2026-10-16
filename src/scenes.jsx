const scenes = {
  study: { src: "/images/study.jpg", alt: "A desk, a notebook, and a brass pen in warm light" },
  mathematics: { src: "/images/mathematics.jpg", alt: "A compass and pencil on graph paper" },
  english: { src: "/images/english.jpg", alt: "An open book on a library table" },
  physics: { src: "/images/physics.jpg", alt: "A wooden trolley and a steel ball on a table" },
  chemistry: { src: "/images/chemistry.jpg", alt: "Two glass beakers, one with a drop of blue dye" },
  biology: { src: "/images/biology.jpg", alt: "A green leaf and a brass magnifying glass" },
  geology: { src: "/images/geology.jpg", alt: "Layered stones on linen" },
  history: { src: "/images/history.jpg", alt: "A folded letter and an old map on a wooden table" },
  politics: { src: "/images/politics.jpg", alt: "A wooden ballot box and blank cards" },
  technology: { src: "/images/technology.jpg", alt: "A hand plane, copper wire, and a glass lamp on a bench" },
  psychology: { src: "/images/psychology.jpg", alt: "Two empty chairs by a window" },
  social: { src: "/images/social.jpg", alt: "A table with three cups and a closed notebook" },
  discovery: { src: "/images/discovery.jpg", alt: "A desk by an open window" },
  reward: { src: "/images/reward.jpg", alt: "Olive leaves in a small brass dish" },
};

function sceneFor(claimId) {
  if (claimId === "socialManagement") return "social";
  if (claimId === "electronics") return "technology";
  if (claimId === "economics") return "politics";
  if (claimId === "finance") return "mathematics";
  return scenes[claimId] ? claimId : "study";
}

function Scene({ name }) {
  const scene = scenes[name];
  if (!scene) return null;
  return (
    <figure className="scene">
      <img src={scene.src} alt={scene.alt} />
    </figure>
  );
}

export { Scene, sceneFor };
