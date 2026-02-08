# AGENTS.md — MakerKit CLI Architecture Rules

## MCP Handlers

- MCP handlers in `src/mcp.ts` are **thin wrappers** — no business logic
- Each handler: validate input → delegate to utility → format output
- Handler bodies should be ≤10 lines

## Business Logic

- Business logic lives in `src/utils/` as standalone async functions
- Follow the pattern in `src/utils/create-project.ts`:
  - `Options` interface for input
  - `Result` interface (or discriminated union) for output
  - Single exported async function
- Throw on unrecoverable errors (invalid project, missing files)
- Return `{ success: false, reason }` for expected failures (dirty git, already installed, no username)

## Side Effects

- Utilities never call `console.log`, `chalk`, `ora`, or `process.exit()`
- Side effects (fs, network, git, shell) go through importable modules so they can be mocked with `vi.mock()`
- Use `withProjectDir()` from `src/utils/with-project-dir.ts` for cwd-switching

## Testing

- Tests are colocated: `foo.test.ts` next to `foo.ts`
- Pure functions get direct tests (no mocks needed)
- Side-effectful functions mock their I/O deps with `vi.mock()`
- `pnpm test` must pass before merging
- Run `pnpm test` and `pnpm run typecheck` to validate changes
