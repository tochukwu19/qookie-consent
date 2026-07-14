# Changesets

This directory is managed by [Changesets](https://github.com/changesets/changesets).

To record a change for the next release, run:

```bash
pnpm changeset
```

Pick the affected packages (`@qookie-consent/core`, `@qookie-consent/vue`, `@qookie-consent/nuxt`) and the
bump type (patch / minor / major), and write a short summary. The generated
markdown file should be committed alongside your change.

On merge to `main`, the release workflow opens (or updates) a "Version Packages"
PR that applies the pending changesets; merging that PR publishes the bumped
packages to npm.

Private packages (the playgrounds and the monorepo root) are skipped
automatically.
