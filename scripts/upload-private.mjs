import fs from "node:fs";
import path from "node:path";
import { google } from "googleapis";

const metadataPath = process.argv[2] ?? "content/next-short.json";
const videoPath = process.argv[3] ?? "media/next-short.mp4";
const expectedChannelId = process.env.SONICVHIBEZ_CHANNEL_ID;
const requiredEnv = ["YOUTUBE_CLIENT_ID", "YOUTUBE_CLIENT_SECRET", "YOUTUBE_REFRESH_TOKEN", "SONICVHIBEZ_CHANNEL_ID"];
const missing = requiredEnv.filter(k => !process.env[k]);
if (missing.length) {
  console.error(`BLOCKED: missing required environment variables: ${missing.join(", ")}`);
  process.exit(2);
}
if (!fs.existsSync(metadataPath)) {
  console.error(`BLOCKED: metadata file not found: ${metadataPath}`);
  process.exit(2);
}
if (!fs.existsSync(videoPath) || path.extname(videoPath).toLowerCase() !== ".mp4") {
  console.error("BLOCKED: provide an existing MP4 video file.");
  process.exit(2);
}
const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
const { stdout, stderr } = await import("node:child_process").then(({ execFileSync }) => {
  try {
    const output = execFileSync("node", ["scripts/check-content.mjs", metadataPath], {
      env: process.env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"]
    });
    return { stdout: output, stderr: "" };
  } catch (error) {
    return { stdout: error.stdout ?? "", stderr: error.stderr ?? error.message };
  }
});
if (stderr || !stdout.includes("PASS")) {
  console.error(stderr || "BLOCKED: metadata checker did not pass.");
  process.exit(1);
}
if (metadata.visibility !== "private") {
  console.error("BLOCKED: uploader only permits private uploads.");
  process.exit(1);
}

const oauth = new google.auth.OAuth2(
  process.env.YOUTUBE_CLIENT_ID,
  process.env.YOUTUBE_CLIENT_SECRET
);
oauth.setCredentials({ refresh_token: process.env.YOUTUBE_REFRESH_TOKEN });
const youtube = google.youtube({ version: "v3", auth: oauth });
const channel = await youtube.channels.list({ part: ["id", "snippet"], mine: true });
const authenticatedChannelId = channel.data.items?.[0]?.id;
if (!authenticatedChannelId || authenticatedChannelId !== expectedChannelId || metadata.channelId !== expectedChannelId) {
  console.error("BLOCKED: authenticated YouTube channel does not match the configured SonicVhibez channel ID.");
  process.exit(1);
}

const response = await youtube.videos.insert({
  part: ["snippet", "status"],
  requestBody: {
    snippet: {
      title: metadata.title,
      description: metadata.description,
      tags: metadata.tags,
      categoryId: "27"
    },
    status: { privacyStatus: "private", selfDeclaredMadeForKids: false }
  },
  media: { body: fs.createReadStream(videoPath) }
});
const videoId = response.data.id;
if (!videoId) {
  console.error("UPLOAD UNCERTAIN: YouTube returned no video ID. Check YouTube Studio before retrying.");
  process.exit(1);
}
const log = {
  timestamp: new Date().toISOString(),
  channelId: authenticatedChannelId,
  videoId,
  privacyStatus: response.data.status?.privacyStatus ?? "unknown",
  title: metadata.title
};
fs.mkdirSync("run-logs", { recursive: true });
fs.writeFileSync(`run-logs/upload-${videoId}.json`, JSON.stringify(log, null, 2) + "\\n");
console.log(JSON.stringify({ ...log, url: `https://www.youtube.com/watch?v=${videoId}` }, null, 2));
