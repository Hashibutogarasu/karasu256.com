# /pr

Create a branch, commit staged or specified changes, push, and open a pull request.

## Rules

- Commit format: `type: description` — no scope, no parentheses. Types: `feat` `fix` `docs` `ci` `chore` `refactor` `test` `build`
- Branch name derived from commit message: `type/short-description` (e.g. `feat/add-prettier`)
- Never reuse an existing branch for unrelated work
- Never push directly to `main`
- Always end with `gh pr create`
- Execute all steps without pausing to ask for confirmation — deletions and file operations that are part of the task are pre-approved
- Each PR must address exactly one concern — never bundle fixes, features, or unrelated changes together; if multiple concerns exist, create separate branches and PRs (chaining base branches as needed)
- Verify changes with a single build (e.g. `pnpm build`) rather than running `tsc --noEmit` and `eslint` as separate steps — lint and type-checking are already covered by the build
- Never add a new dependency by hand-editing `package.json` — use the package manager CLI (e.g. `pnpm add <pkg> --filter <workspace>`) so the lockfile stays in sync

## Steps

1. Determine the commit type and short description from `$ARGUMENTS` or from the changes staged.
2. Create a new branch: `git checkout -b <type>/<short-description>`
3. Stage relevant files (or use what is already staged).
4. Commit:
   ```
   git commit -m "type: description

   Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
   ```
5. Push: `git push -u origin <branch>`
6. Open PR: `gh pr create --title "type: description" --body "..."`

## PR body style

- Language: English only
- Structure:
  ```
  ## Summary

  - bullet point describing each change

  🤖 Generated with [Claude Code](https://claude.com/claude-code)
  ```
- No "## Test plan" section
- No Japanese text anywhere in the title or body
- Bullets are concise: describe what changed, not step-by-step reasoning
