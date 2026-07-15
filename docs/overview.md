# Overview

ModelStack is a small toolkit for building typed frontend entity layers.

The main idea is simple: describe an entity once with Zod schemas, then derive
the repetitive application pieces from that contract.

```txt
zod schemas -> entity contract -> repository -> query hooks -> forms/store/ui
```

ModelStack does not try to own the whole app. It provides typed building blocks
for common CRUD-like feature modules while leaving screens, layout, copy, and
business-specific behavior in the application.

## Goals

- Keep Zod schemas as the source of truth.
- Infer TypeScript types from schemas instead of duplicating DTO interfaces.
- Centralize entity keys, paths, and CRUD contracts.
- Make React Query, React Hook Form, and Effector integration repeatable.
- Keep UI generation optional.

## Non-goals

- Generate full applications.
- Force one UI kit.
- Hide all network details behind magic.
- Replace domain-specific components or workflows.
