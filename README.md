# Tiny Tribe
Tiny tribe is a minimal social media platform built on Vinext and Cloesce.

## Getting Started

```bash
bun run compile
bun run migrate:wrangler
bun run dev
```

## Development
If you add new models to `src/data/models.cloesce.ts`, you'll need to run migrations with
```bash
bunx cloesce migrate db <name of migration>
bun run migrate:wrangler
```
Verify your code compiles and passes lints with
```bash
bun run type-check
bun run lint
```
