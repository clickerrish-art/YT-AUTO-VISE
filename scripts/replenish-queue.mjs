import fs from "node:fs";
import path from "node:path";

const queuePath = process.env.QUEUE_PATH ?? "content/queue.json";
fs.mkdirSync(path.dirname(queuePath), { recursive: true });

const seed = [
  { id: "wildlife-short-story-structure", title: "How to Tell a Better Wildlife Story", topic: "wildlife video storytelling", keywords: ["wildlife video storytelling","wildlife filmmaking","nature documentary tips"], hook: "Wildlife footage becomes a story when every shot answers one clear question.", outline: ["Choose one animal behavior to explain","Plan a wide shot, detail, and behavior shot","Use only rights-cleared footage and music"], productUrl: "https://selar.com/0u19v8u99l", targetSeconds: 55, status: "HOLD_FOR_MEDIA_AND_HUMAN_REVIEW" },
  { id: "wildlife-short-footage-rights", title: "Check These Rights Before Posting Wildlife Videos", topic: "wildlife footage copyright and licensing", keywords: ["wildlife footage licensing","copyright free wildlife footage","wildlife video editing"], hook: "Before you publish a wildlife video, check these three things.", outline: ["Confirm footage usage rights","Confirm music and image licenses","Keep evidence of permissions and avoid misleading edits"], productUrl: "https://selar.com/0u19v8u99l", targetSeconds: 55, status: "HOLD_FOR_MEDIA_AND_HUMAN_REVIEW" },
  { id: "wildlife-short-documentary-plan", title: "Plan a Wildlife Documentary Short in Three Steps", topic: "planning a wildlife documentary Short", keywords: ["wildlife documentary","YouTube Shorts ideas","nature video production"], hook: "A focused wildlife Short starts before the edit.", outline: ["Ask one answerable question","Arrange footage into hook, behavior, and explanation","Check every factual claim and asset license"], productUrl: "https://selar.com/0u19v8u99l", targetSeconds: 55, status: "HOLD_FOR_MEDIA_AND_HUMAN_REVIEW" },
  { id: "wildlife-short-natural-behavior", title: "Film Wildlife Without Disturbing Animals", topic: "ethical wildlife filming", keywords: ["ethical wildlife photography","wildlife filming tips","nature documentary filmmaking"], hook: "The best wildlife shot should never come at an animal's expense.", outline: ["Keep a safe distance","Never bait, chase, or disturb animals","Use patient observation and footage you have permission to publish"], productUrl: "https://selar.com/0u19v8u99l", targetSeconds: 55, status: "HOLD_FOR_MEDIA_AND_HUMAN_REVIEW" },
  { id: "wildlife-short-hook-without-clickbait", title: "Write a Wildlife Video Hook Without Clickbait", topic: "wildlife documentary opening hooks", keywords: ["wildlife video hook","documentary storytelling","YouTube Shorts hook"], hook: "A strong wildlife hook creates a question the footage can genuinely answer.", outline: ["Open on a real behavior or question","Avoid misleading thumbnails and false promises","Pay off the opening with the actual footage"], productUrl: "https://selar.com/0u19v8u99l", targetSeconds: 55, status: "HOLD_FOR_MEDIA_AND_HUMAN_REVIEW" },
  { id: "wildlife-short-caption-readability", title: "Make Wildlife Video Captions Easier to Read", topic: "mobile-first wildlife video captions", keywords: ["video captions tips","YouTube Shorts editing","wildlife video editing"], hook: "If viewers cannot read your captions on a phone, the edit is working against the story.", outline: ["Keep each caption brief","Use strong contrast and safe margins","Check timing against the spoken narration"], productUrl: "https://selar.com/0u19v8u99l", targetSeconds: 55, status: "HOLD_FOR_MEDIA_AND_HUMAN_REVIEW" },
  { id: "wildlife-short-natural-sound", title: "Use Natural Sound to Improve Wildlife Videos", topic: "natural sound in wildlife documentaries", keywords: ["wildlife natural sound","nature documentary audio","wildlife filmmaking tips"], hook: "Sometimes the most powerful wildlife soundtrack is the real environment.", outline: ["Capture or use properly licensed natural sound","Keep narration intelligible","Do not add sound that falsely implies an animal action"], productUrl: "https://selar.com/0u19v8u99l", targetSeconds: 55, status: "HOLD_FOR_MEDIA_AND_HUMAN_REVIEW" },
  { id: "wildlife-short-fact-checking", title: "Fact-Check Wildlife Narration Before You Publish", topic: "wildlife documentary fact checking", keywords: ["animal behavior facts","wildlife documentary script","nature education videos"], hook: "A dramatic voiceover is only useful when the facts stand up.", outline: ["Verify species and behavior with reliable sources","Separate observation from interpretation","Remove claims the footage or evidence cannot support"], productUrl: "https://selar.com/0u19v8u99l", targetSeconds: 55, status: "HOLD_FOR_MEDIA_AND_HUMAN_REVIEW" },
  { id: "wildlife-short-thumbnail-truth", title: "Design a Wildlife Thumbnail That Matches the Video", topic: "honest wildlife video thumbnail design", keywords: ["wildlife YouTube thumbnail","YouTube thumbnail tips","nature documentary packaging"], hook: "A thumbnail should make people curious without promising a scene that never happens.", outline: ["Choose a real, clear subject","Keep text short and readable","Ensure the image represents the actual video"], productUrl: "https://selar.com/0u19v8u99l", targetSeconds: 55, status: "HOLD_FOR_MEDIA_AND_HUMAN_REVIEW" },
  { id: "wildlife-short-editing-pacing", title: "Improve Wildlife Video Pacing With Three Edits", topic: "wildlife video editing pacing", keywords: ["wildlife video editing","documentary editing tips","YouTube Shorts retention"], hook: "A faster edit is not always better; every cut should help viewers understand.", outline: ["Remove repetition, not meaningful behavior","Vary shot scale when footage supports it","Give important animal actions enough time to register"], productUrl: "https://selar.com/0u19v8u99l", targetSeconds: 55, status: "HOLD_FOR_MEDIA_AND_HUMAN_REVIEW" },
  { id: "wildlife-short-research-before-shoot", title: "Research Animal Behavior Before Filming", topic: "wildlife filming research and preparation", keywords: ["animal behavior research","wildlife filming tips","nature documentary planning"], hook: "A little research can help you notice behavior without interfering with it.", outline: ["Learn the species' natural context from reliable sources","Plan observation rather than staging","Record notes so narration remains accurate"], productUrl: "https://selar.com/0u19v8u99l", targetSeconds: 55, status: "HOLD_FOR_MEDIA_AND_HUMAN_REVIEW" },
  { id: "wildlife-short-description-seo", title: "Write a Clear YouTube Description for Wildlife Videos", topic: "YouTube wildlife video descriptions and metadata", keywords: ["YouTube description SEO","wildlife video keywords","YouTube metadata tips"], hook: "Metadata works best when it accurately describes what viewers will learn.", outline: ["Put the topic and viewer benefit first","Use relevant phrases naturally","Keep links accurate and disclose promotion clearly"], productUrl: "https://selar.com/0u19v8u99l", targetSeconds: 55, status: "HOLD_FOR_MEDIA_AND_HUMAN_REVIEW" }
];

let document = { cadence: { postsPerWeek: 2, days: ["Tuesday", "Friday"], timezone: "Africa/Johannesburg" }, publishingEnabled: false, items: [] };
if (fs.existsSync(queuePath)) {
  try {
    const parsed = JSON.parse(fs.readFileSync(queuePath, "utf8"));
    if (Array.isArray(parsed)) document.items = parsed;
    else if (parsed && Array.isArray(parsed.items)) document = parsed;
    else throw new Error("expected an array or an object with an items array");
  } catch (error) {
    console.error(`BLOCKED: cannot safely read queue: ${error.message}`);
    process.exit(2);
  }
}
if (document.publishingEnabled === true) {
  console.error("BLOCKED: queue replenishment must not enable publishing.");
  process.exit(1);
}
const known = new Set(document.items.map(item => item.id));
const additions = seed.filter(item => !known.has(item.id));
document.items.push(...additions);
fs.writeFileSync(queuePath, JSON.stringify(document, null, 2) + "\n");
console.log(JSON.stringify({
  queuePath,
  addedItems: additions.length,
  totalItems: document.items.length,
  publishingEnabled: document.publishingEnabled === true,
  note: "Adds topic briefs only; it does not render media, verify rights, upload, schedule, or publish."
}, null, 2));
