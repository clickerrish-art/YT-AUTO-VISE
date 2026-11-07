const IDEA_BANK = Object.freeze([
  { pillar: "wildlife_behaviour", topic: "How to observe wildlife without disturbing natural behaviour", angle: "ethical observation", question: "What distance or field practice helps keep wildlife undisturbed?" },
  { pillar: "conservation_education", topic: "How to check whether a conservation claim is trustworthy", angle: "source literacy", question: "Which source would you check before sharing a conservation statistic?" },
  { pillar: "habitats_biodiversity", topic: "What makes a healthy wetland worth protecting", angle: "wetland ecology", question: "Which wetland plants or animals are documented in your area?" },
  { pillar: "ethical_photography", topic: "How patient wildlife photography respects animal space", angle: "ethical photography", question: "What ethical photography rule matters most to you?" },
  { pillar: "educational_explainer", topic: "How to distinguish a wildlife fact from an interpretation", angle: "critical thinking", question: "What detail helps you separate observation from interpretation?" },
  { pillar: "authorized_behind_scenes", topic: "How a documentary team records source and licensing details", angle: "documentary workflow", question: "What behind-the-scenes production step would you like explained?" },
  { pillar: "wildlife_behaviour", topic: "What field notes can reveal that a single wildlife photo cannot", angle: "field observation", question: "Would you rather see field notes, camera settings or location context?" },
  { pillar: "conservation_education", topic: "How local habitat changes can be documented responsibly", angle: "local observation", question: "What habitat changes have you noticed, and where could they be verified?" },
  { pillar: "habitats_biodiversity", topic: "Why habitat connections matter when studying biodiversity", angle: "habitat corridors", question: "Which nearby habitat connections would you like to learn about?" },
  { pillar: "ethical_photography", topic: "How to photograph wildlife without baiting or chasing animals", angle: "responsible field craft", question: "Which ethical field practice should beginner photographers learn first?" },
  { pillar: "educational_explainer", topic: "How to read the date and context behind a wildlife image", angle: "media literacy", question: "What context do you want to see alongside wildlife images?" },
  { pillar: "authorized_behind_scenes", topic: "What a useful wildlife shot list records before filming", angle: "pre-production", question: "What should a beginner shot list include?" },
  { pillar: "wildlife_behaviour", topic: "How to describe animal behaviour without assigning human motives", angle: "careful interpretation", question: "What wording helps keep wildlife descriptions accurate?" },
  { pillar: "conservation_education", topic: "How to find primary sources for biodiversity information", angle: "research methods", question: "Which research source would you like a simple walkthrough of?" },
  { pillar: "habitats_biodiversity", topic: "How seasonal observations can change what you see in a habitat", angle: "seasonal ecology", question: "Which season would you like to compare with another?" },
  { pillar: "ethical_photography", topic: "Why leaving wildlife locations undisclosed can sometimes protect animals", angle: "location privacy", question: "When should wildlife locations be kept general rather than exact?" },
  { pillar: "educational_explainer", topic: "How captions can separate verified facts from uncertainty", angle: "transparent storytelling", question: "What makes an educational caption easier to trust?" },
  { pillar: "authorized_behind_scenes", topic: "How a documentary edit keeps captions aligned with the footage", angle: "editing workflow", question: "Which editing quality check would you like to see explained?" },
  { pillar: "wildlife_behaviour", topic: "How to record wildlife observations without disturbing the subject", angle: "field ethics", question: "What would you include in a responsible observation log?" },
  { pillar: "conservation_education", topic: "How to check the date and scope of a conservation report", angle: "report literacy", question: "What part of a report do you usually check first?" },
  { pillar: "habitats_biodiversity", topic: "How small habitat features can shape a field observation", angle: "habitat details", question: "Which habitat feature should an explainer cover next?" },
  { pillar: "ethical_photography", topic: "How to plan a wildlife shoot around animal welfare", angle: "shoot planning", question: "What welfare check belongs in every wildlife shoot plan?" },
  { pillar: "educational_explainer", topic: "How to correct a wildlife misconception without shaming people", angle: "respectful education", question: "What makes a correction informative rather than confrontational?" },
  { pillar: "authorized_behind_scenes", topic: "How source notes make a wildlife video easier to fact-check", angle: "provenance", question: "Which source-note detail would help you trust a documentary more?" }
]);

function normalizeText(value) {
  return String(value ?? "").normalize("NFKC").toLocaleLowerCase("en-ZA")
    .replace(/https?:[^ ]+/g, " ")
    .replace(new RegExp("[^\\p{L}\\p{N}]+", "gu"), " ").trim().replace(/ +/g, " ");
}
function similarityRatio(left, right) {
  const a = new Set(normalizeText(left).split(" ").filter(word => word.length > 2));
  const b = new Set(normalizeText(right).split(" ").filter(word => word.length > 2));
  if (!a.size || !b.size) return 0;
  let intersection = 0;
  for (const token of a) if (b.has(token)) intersection++;
  return intersection / (a.size + b.size - intersection);
}

export function generateDashboardFacebookIdea({ date, existingDrafts = [], recentPosts = [] }) {
  if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(String(date))) throw new Error("A valid YYYY-MM-DD date is required");
  const dateValue = new Date(date + "T12:00:00Z");
  if (Number.isNaN(dateValue.getTime()) || dateValue.toISOString().slice(0, 10) !== date) throw new Error("Idea date is invalid");
  const used = [...existingDrafts, ...recentPosts].filter(item => !["REJECTED", "CANCELLED"].includes(item.status));
  const offset = Math.abs([...date].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) | 0, 7)) % IDEA_BANK.length;
  for (let step = 0; step < IDEA_BANK.length; step++) {
    const idea = IDEA_BANK[(offset + step) % IDEA_BANK.length];
    if (used.some(item => similarityRatio(idea.topic, item.topic) >= 0.65)) continue;
    return {
      date, topic: idea.topic, pillar: idea.pillar, angle: idea.angle,
      captionStarter: `A closer look at ${idea.topic.toLocaleLowerCase("en-ZA")}. [Add one specific, sourced fact here, then explain why it matters.] ${idea.question}`,
      researchPrompt: `Find a reliable primary or authoritative source for: ${idea.topic}. Record the exact source URL and verify the claim before drafting.`,
      factualClaims: [], publishReady: false,
      note: "Idea only: replace placeholders, add verified sources and rights-cleared media, then pass compliance and human review."
    };
  }
  return { date, available: false, publishReady: false, note: "The current idea bank overlaps existing drafts; add genuinely new research-led ideas before generating more." };
}
