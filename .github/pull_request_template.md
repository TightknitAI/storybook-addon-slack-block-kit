## Summary

<!-- One or two sentences on what changes and why. -->

## Why

<!-- The motivation: the bug, user need, or constraint behind this change.
     If the "what" already conveys the "why" (e.g. a typo fix), delete this section. -->

<!-- ## Breaking change

     Delete this section unless the PR is a breaking change (`feat!:` or
     `BREAKING CHANGE:` in the commit body). Include a migration snippet
     for consumers, e.g.:

     ```ts
     // Before
     parameters: { slackBlocks: [...] }
     // After
     parameters: { slackBlocks: { blocks: [...], surface: 'message' } }
     ```
-->

## Test plan

- [ ] `pnpm typecheck`
- [ ] `pnpm lint`
- [ ] `pnpm test`
- [ ] Spot-checked in `pnpm storybook` (if decorator / renderer / panel changed)

<!-- Add any manual steps specific to this change — surfaces touched,
     theme toggle, MDX doc block, edge cases verified, etc. -->

<!-- ## Notes for reviewer

     Optional: rebase concerns, follow-ups deferred, alternatives considered.
     Delete if not needed. -->

---

<sub>**Title:** use a [Conventional Commit](https://www.conventionalcommits.org/) prefix — `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`, `build:`, `ci:`, or `perf:`. Append `!` (e.g. `feat!:`) for breaking changes. The squashed title becomes the changelog entry via release-please.</sub>
