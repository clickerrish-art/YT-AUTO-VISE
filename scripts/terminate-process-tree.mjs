import { spawn } from "node:child_process";

export function terminateProcessTree(
  child,
  signal = "SIGTERM",
  {
    platform = process.platform,
    kill = process.kill.bind(process),
    spawnImpl = spawn
  } = {}
) {
  if (!child || !Number.isInteger(child.pid) || child.pid <= 0) return false;
  if (signal !== "SIGTERM" && signal !== "SIGKILL") throw new Error("Unsupported process-tree signal");

  if (platform === "win32") {
    const args = ["/pid", String(child.pid), "/t"];
    if (signal === "SIGKILL") args.push("/f");
    const killer = spawnImpl("taskkill", args, { windowsHide: true, stdio: "ignore" });
    killer.unref?.();
    return true;
  }

  try {
    kill(-child.pid, signal);
    return true;
  } catch (error) {
    if (error?.code !== "ESRCH") throw error;
    return child.kill(signal);
  }
}
