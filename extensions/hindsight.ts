import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

// Hindsight's official Pi adapter ships in @vectorize-io/hindsight-coding-agents, which
// hindsight-agent-setup stages here and keeps updated for every agent on the machine. The adapter
// also installs its hindsight-coding-agent skill into ~/.pi/agent/skills on session start.
const root = process.env.HINDSIGHT_CODING_AGENTS_DIR || join(homedir(), ".hindsight", "coding-agents");
const adapter = join(root, "dist", "pi.js");
const SETUP_URL = "https://github.com/cskwork/hindsight-agent-setup";
const LOADED = Symbol.for("pi-hindsight-memory.loaded");

// `npx @vectorize-io/hindsight-coding-agents install pi` registers dist/pi.js in settings.json
// directly; loading it a second time would register every hindsight_* tool twice.
function adapterAlreadyRegistered(): boolean {
  const dir = process.env.PI_CODING_AGENT_DIR || join(homedir(), ".pi", "agent");
  try {
    const { extensions } = JSON.parse(readFileSync(join(dir, "settings.json"), "utf8"));
    return Array.isArray(extensions) && extensions.some((e) => /coding-agents.*[\\/]dist[\\/]pi\.js$/.test(String(e)));
  } catch {
    return false;
  }
}

export default async function (pi: ExtensionAPI) {
  if (!existsSync(adapter)) {
    pi.on("session_start", (_event, ctx) => {
      ctx.ui.notify(`Hindsight memory is off: ${adapter} not found. Install it with ${SETUP_URL}`, "warning");
    });
    return;
  }
  if (adapterAlreadyRegistered()) return;
  // Installed from both npm and git (Pi treats those as two packages): load once.
  const g = globalThis as { [LOADED]?: boolean };
  if (g[LOADED]) return;
  g[LOADED] = true;

  const { default: hindsight } = await import(pathToFileURL(adapter).href);
  hindsight(pi);
}
