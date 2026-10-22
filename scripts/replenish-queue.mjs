import fs from "node:fs";
import path from "node:path";

const queuePath = process.env.QUEUE_PATH ?? "content/queue.json";
const queueDir = path.dirname(queuePath);
fs.mkdirSync(queueDir, { recursive: true });

const seed = [
  {
    id: "wildlife-short-story-structure",
    title: "How to Tell a Better Wildlife Story",
    topic: "wildlife video storytelling",
    keywords: ["wildlife video storytelling", "wildlife filmmaking", "nature documentary tips"],
    hook: "Wildlife footage becomes a story when every shot answers one clear question.",
    outline: ["Choose one animal behavior to explain", "Plan a wide shot, detail, and behavior shot", "Use only rights-cleared footage and music"],
    productUrl: "https://selar.com/0u19v8u99l",
    targetSeconds: 55,
    status: "HOLD_FOR_MEDIA_AND_HUMAN_REVIEW"
  },
  {
    id: "wildlife-short-footage-rights",
    title: "Check These Rights Before Posting Wildlife Videos",
    topic: "wildlife footage copyright and licensing",
    keywords: ["wildlife footage licensing", "copyright free wildlife footage", "wildlife video editing"],
    hook: "Before you publish a wildlife video, check these three things.",
    outline: ["Confirm footage usage rights", "Confirm music and image licenses", "Keep evidence of permissions and avoid misleading edits"],
    productUrl: "https://selar.com/0u19v8u99l",
    targetSeconds: 55,
    status: "HOLD_FOR_MEDIA_AND_HUMAN_REVIEW"
  },
  {
    id: "wildlife-short-documentary-plan",
    title: "Plan a Wildlife Documentary Short in Three Steps",
    topic: "planning a wildlife documentary Short",
    keywords: ["wildlife documentary", "YouTube Shorts ideas", "nature video production"],
    hook: "A focused wildlife Short starts before the edit.",
    outline: ["Ask one answerable question", "Arrange footage into hook, behavior, and explanation", "Check every factual claim and asset license"],
    productUrl: "https://selar.com/0u19v8u99l",
    targetSeconds: 55,
    status: "HOLD_FOR_MEDIA_AND_HUMAN_REVIEW"
  },
  {
    id: "wildlife-short-natural-behavior",
    title: "Film Wildlife Without Disturbing Animals",
    topic: "ethical wildlife filming",
    keywords: ["ethical wildlife photography", "wildlife filming tips", "nature documentary filmmaking"],
    hook: "The best wildlife shot should never come at an animal's expense.",
    outline: ["Keep a safe distance", "Never bait, chase, or disturb animals", "Use patient observation and footage you have permission to publish"],
    productUrl: "https://selar.com/0u19v8u99l",
    targetSeconds: 55,
    status: "HOLD_FOR_MEDIA_AND_HUMAN_REVIEW"
  }
];

let queue = [];
if (fs.existsSync(queuePath)) {
  try {
    const parsed = JSON.parse(fs.readFileSync(queuePath, "utf8"));
    if (!Array.isArray(parsed)) throw new Error("queue must be a JSON array");
    queue = parsed;
  } catch (error) {
    console.error(`BLOCKED: cannot safely read queue: ${error.message}`);
    process.exit(2);
  }
}

const known = new Set(queue.map(item => item.id));
const additions = seed.filter(item => !known.has(item.id));
queue.push(...additions);
fs.writeFileSync(queuePath, JSON.stringify(queue, null, 2) + "\n");
console.log(JSON.stringify({
  queuePath,
  existingItems: queue.length - additions.length,
  addedItems: additions.length,
  totalItems: queue.length,
  status: "HOLD_FOR_MEDIA_AND_HUMAN_REVIEW",
  note: "This replenishes topic briefs only. It does not render media, verify rights, upload, schedule, or publish."
}, null, 2));
