# ModelStack

ModelStack is a type-safe entity toolkit for frontend application layers.

It keeps the entity contract declarative and lets adapters build repositories,
React Query hooks, React Hook Form bindings, Effector stores, and small UI helpers
from the same Zod schemas.

## Packages

- `@modelstack/core` - entity declarations, schema inference, query keys, paths.
- `@modelstack/http` - HTTP client contract, Axios client, CRUD repository.
- `@modelstack/react-query` - typed React Query hooks for CRUD entities.
- `@modelstack/react-form` - typed React Hook Form integration with Zod.
- `@modelstack/effector` - list state stores with filters, loading, errors, checked items.
- `@modelstack/react-ui` - small optional React helpers.

## Documentation

- [Overview](docs/overview.md)
- [Architecture](docs/architecture.md)
- [Packages](docs/packages.md)
- [Entity Example](docs/entity-example.md)
- [Forms](docs/forms.md)
- [Development](docs/development.md)

## Example

See the complete category example in `examples/category`.

```ts
import { z } from 'zod'
import { defineEntity } from '@modelstack/core'

const categoryId = z.coerce.number().int().positive().brand<'CategoryID'>()

const WritableCategoryModel = z.object({
  title: z.string().trim().min(1).max(120),
})

const ReadonlyCategoryModel = WritableCategoryModel.extend({
  id: categoryId,
})

export const categoryEntity = defineEntity({
  key: 'category',
  endpoint: 'categories',
  schemas: {
    id: categoryId,
    read: ReadonlyCategoryModel,
    write: WritableCategoryModel,
  },
})
```

Adapters can then derive typed hooks and forms:

```ts
import { createCrudQueries } from '@modelstack/react-query'
import { createEntityForm } from '@modelstack/react-form'

export const categoryApi = createCrudQueries(categoryEntity, http)

export const categoryForm = createEntityForm(categoryEntity, {
  defaultValues: {
    title: '',
  },
})
```

## Scripts

```sh
pnpm install
pnpm typecheck
pnpm test
pnpm format:check
```

## License

Apache-2.0
