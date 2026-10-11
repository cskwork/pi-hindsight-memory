// Run: npm test
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

// A fake adapter that records the call, standing in for Hindsight's dist/pi.js.
function fixture(registeredInSettings: boolean) {
  const dir = mkdtempSync(join(tmpdir(), "pi-hindsight-"));
  const root = join(dir, "coding-agents");
  mkdirSync(join(root, "dist"), { recursive: true });
  mkdirSync(join(root, "skill"));
  writeFileSync(join(root, "skill", "SKILL.md"), "---\nname: x\ndescription: x\n---\n");
  writeFileSync(join(root, "dist", "pi.js"), "export default (pi) => { pi.loaded = (pi.loaded ?? 0) + 1; };\n");
  const agentDir = join(dir, "agent");
  mkdirSync(agentDir);
  const extensions = registeredInSettings ? [join(root, "dist", "pi.js")] : [];
  writeFileSync(join(agentDir, "settings.json"), JSON.stringify({ extensions }));
  return { root, agentDir };
}

function fakePi() {
  const handlers: Record<string, Function[]> = {};
  return { handlers, loaded: 0, on: (e: string, h: Function) => (handlers[e] ??= []).push(h) } as any;
}

async function load(env: Record<string, string>) {
  Object.assign(process.env, env);
  return (await import(`../extensions/hindsight.ts?${Math.random()}`)).default;
}

test("loads the adapter and adds its skill", async () => {
  const { root, agentDir } = fixture(false);
  const ext = await load({ HINDSIGHT_CODING_AGENTS_DIR: root, PI_CODING_AGENT_DIR: agentDir });
  const pi = fakePi();
  await ext(pi);
  assert.equal(pi.loaded, 1);
  assert.deepEqual(pi.handlers.resources_discover[0](), { skillPaths: [join(root, "skill")] });
});

test("skips when the official installer already registered dist/pi.js", async () => {
  const { root, agentDir } = fixture(true);
  const ext = await load({ HINDSIGHT_CODING_AGENTS_DIR: root, PI_CODING_AGENT_DIR: agentDir });
  const pi = fakePi();
  await ext(pi);
  assert.equal(pi.loaded, 0);
});

test("warns at session start when Hindsight is not installed", async () => {
  const ext = await load({ HINDSIGHT_CODING_AGENTS_DIR: join(tmpdir(), "no-such-hindsight") });
  const pi = fakePi();
  await ext(pi);
  const notes: string[] = [];
  pi.handlers.session_start[0]({}, { ui: { notify: (m: string) => notes.push(m) } });
  assert.match(notes[0], /hindsight-agent-setup/);
});
