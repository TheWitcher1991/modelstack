import { createQueryBridge } from '@modelstack/effector'
import { useUnit } from 'effector-react'

import { DataLoader } from '@modelstack/react-ui'

import type { createCategoryApi } from './category.api'
import { categoryStore } from './category.store'

type CategoryApi = ReturnType<typeof createCategoryApi>

interface CategoryListProps {
  api: CategoryApi
}

export const CategoryList = ({ api }: CategoryListProps) => {
  const store = useUnit(categoryStore.$store)
  const query = api.useCategories(store.filter)

  createQueryBridge(categoryStore, query)

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
