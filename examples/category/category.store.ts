import { createEntityListStore } from '@modelstack/effector'

import { categoryEntity } from './category.entity'

export const categoryStore = createEntityListStore(categoryEntity, {
  count: 0,
  list: [],
  checked: [],
  error: false,
  loading: true,
  fetching: false,
  filter: {
    page_size: 25,
    page: 1,
  },
})

export const {
  $store,
  setCount,
  setList,
  setFilter,
  setLoading,
  setFetching,
  setError,
  setChecked,
  reset,
  changeQueryFromInput,
} = categoryStore
