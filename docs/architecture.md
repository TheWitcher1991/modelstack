# Architecture

ModelStack uses an entity-first structure.

```txt
model -> entity -> repository -> query/form/store -> presentation
```

## Model

The model layer contains Zod schemas.

```ts
export const categoryId = z.coerce.number().int().positive().brand<'CategoryID'>()

export const WritableCategoryModel = z.object({
  title: z.string().trim().min(1),
})

export const ReadonlyCategoryModel = WritableCategoryModel.extend({
  id: categoryId,
})
```

## Entity

The entity layer binds schemas to a stable key and API endpoint.

```ts
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

## Repository

The repository layer knows how to talk to HTTP.

```ts
export const createCategoryRepository = (http: HttpClient) =>
  createCrudRepository(categoryEntity, http)
```

## Query

The query layer derives typed React Query hooks.

```ts
const api = createCrudQueries(categoryEntity, http)
api.useList()
api.useDetail(id)
api.useCreate()
```

## Forms

The form layer derives React Hook Form logic from the write schema.

```ts
const categoryForm = createEntityForm(categoryEntity, {
  defaultValues: { title: '' },
})
```

## Store

The store layer provides optional list state for filters, checked rows, loading,
fetching, and error state.

```ts
const categoryStore = createEntityListStore(categoryEntity, initialState)
```

## Query + Loader + Store

A list screen usually combines three pieces:

- React Query fetches and caches server data.
- The entity store keeps view state: filters, checked rows, loading flags, and list contents.
- `DataLoader` renders loading, error, empty, or ready states.

```tsx
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
    {children}
  </DataLoader>
)
```
