import { useEffect } from 'react'
import { useUnit } from 'effector-react'

import { DataLoader } from '@modelstack/react-ui'

import type { createCategoryApi } from './category.api'
import {
  $store,
  setCount,
  setError,
  setFetching,
  setList,
  setLoading,
} from './category.store'

type CategoryApi = ReturnType<typeof createCategoryApi>

interface CategoryListProps {
  api: CategoryApi
}

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
    <DataLoader
      isLoading={store.loading}
      hasError={store.error}
      countData={store.count}
      loadingFallback="Loading categories..."
      errorFallback="Failed to load categories"
      emptyFallback="No categories yet"
    >
      <ul>
        {store.list.map(category => (
          <li key={category.id}>{category.title}</li>
        ))}
      </ul>
    </DataLoader>
  )
}
