# Entity Example

The complete example lives in `examples/category`.

The naming convention is:

```txt
category.model.ts
category.types.ts
category.entity.ts
category.repository.ts
category.api.ts
category.feature.ts
category.store.ts
category.list.tsx
category.create-field.tsx
category.utils.ts
```

## Model

```ts
import { z } from 'zod'

export const categoryId = z.coerce.number().int().positive().brand<'CategoryID'>()

export const BaseCategoryModel = z.object({
  title: z.string().trim().min(1, 'Title is required').max(120, 'Title is too long'),
})

export const ReadonlyCategoryModel = BaseCategoryModel.extend({
  id: categoryId,
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
})

export const WritableCategoryModel = BaseCategoryModel
```

## Entity

```ts
import { defineEntity } from '@modelstack/core'

export const categoryEntity = defineEntity({
  key: 'category',
  endpoint: 'categories',
  schemas: {
    id: categoryId,
    read: ReadonlyCategoryModel,
    write: WritableCategoryModel,
    query: CategoryQueryModel,
  },
})
```

## API

```ts
import { createCrudQueries } from '@modelstack/react-query'

export const createCategoryApi = (http: HttpClient) => {
  const api = createCrudQueries(categoryEntity, http)

  return {
    ...api,
    useCategories: api.useList,
    useCategory: api.useDetail,
    useCreateCategory: api.useCreate,
  }
}
```

## Query, DataLoader, and Store

Use the entity store as the view state, React Query as the data source, and
`DataLoader` as the loading/error/empty boundary.

```tsx
import { useEffect } from 'react'
import { useUnit } from 'effector-react'

import { DataLoader } from '@modelstack/react-ui'

import { $store, setCount, setError, setFetching, setList, setLoading } from './category.store'

export const CategoryList = ({ api }: CategoryListProps) => {
  const store = useUnit($store)
  const query = api.useCategories(store.filter)

  useEffect(() => {
    setLoading(query.isLoading)
    setFetching(query.isFetching)
    setError(query.isError)
  }, [query.isError, query.isFetching, query.isLoading])

  useEffect(() => {
    if (!query.data) return

    setList(query.data)
    setCount(query.data.length)
  }, [query.data])

  return (
    <DataLoader isLoading={store.loading} hasError={store.error} countData={store.count}>
      <ul>
        {store.list.map(category => (
          <li key={category.id}>{category.title}</li>
        ))}
      </ul>
    </DataLoader>
  )
}
```

This keeps the query layer responsible for fetching and cache invalidation, while
the store keeps screen state such as filters, selected rows, and current list
contents.
