# pi-hindsight-memory

[Hindsight](https://github.com/vectorize-io/hindsight) long-term memory for [Pi](https://github.com/badlogic/pi-mono). Pi gets the same memory your Claude Code, Codex, and Hermes sessions use:

- **Recall before each turn.** Relevant past decisions, conventions, and the repository's knowledge pages are added to the system prompt.
- **Save after each turn.** The conversation is sent to Hindsight, which keeps what is worth remembering.
- **Tools.** `hindsight_search_knowledge_pages`, `hindsight_reflect`, `hindsight_ingest_document`, and the rest of the `hindsight_*` tools, plus the `hindsight-coding-agent` skill, which the adapter installs into `~/.pi/agent/skills`.

This package is a thin loader. The memory behaviour is Hindsight's official Pi adapter (`dist/pi.js` in [`@vectorize-io/hindsight-coding-agents`](https://www.npmjs.com/package/@vectorize-io/hindsight-coding-agents)), so Pi stays on the same adapter version as your other agents.

## Install

1. Set up the Hindsight server and its agent hooks with [hindsight-agent-setup](https://github.com/cskwork/hindsight-agent-setup). It installs this package for you when `pi` is on your PATH.
2. Or add it to Pi yourself:

   ```bash
   pi install npm:pi-hindsight-memory
   ```

Start a new Pi session. Without a Hindsight install, the extension loads nothing and shows a warning at session start.

## How it works

The extension imports `~/.hindsight/coding-agents/dist/pi.js` (override with `HINDSIGHT_CODING_AGENTS_DIR`) and hands it Pi's extension API. If you already registered that file directly with `npx @vectorize-io/hindsight-coding-agents install pi`, the extension stands down so the tools are not registered twice.

Memory settings (server URL, bank, per-repo opt-in) come from `~/.hindsight/coding-agent.json`, the same file the other agents read. Pi events appear as `"harness":"pi"` in `~/.hindsight/coding-agents-logs/diag.jsonl`: look for `inject_ok` and `retain_ok` to confirm recall and saving.

## Develop

```bash
npm test                                  # unit tests (Node 22+)
pi -e . -p "hello" < /dev/null            # load this checkout into one Pi run
```

## License

MIT. Hindsight and its Pi adapter are MIT, © 2025 Vectorize AI, Inc.
