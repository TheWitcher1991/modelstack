# Development

## Install

```sh
pnpm install
```

## Typecheck

```sh
pnpm typecheck
```

## Test

```sh
pnpm test
```

## Format

```sh
pnpm format
pnpm format:check
```

## Notes

- Zod schemas are the source of truth for entity types.
- Do not add React dependencies to `@modelstack/core`.
- Keep generated UI optional.
- Prefer adding adapter packages over growing one large package.
