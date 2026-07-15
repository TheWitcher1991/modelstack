import type { HttpClient } from '@modelstack/http'
import { createEntityForm } from '@modelstack/react-form'
import { createCrudQueries } from '@modelstack/react-query'

import { categoryEntity } from './category.entity'

export const categoryForm = createEntityForm(categoryEntity, {
  defaultValues: {
    title: '',
  },
})

export const createCategoryApi = (http: HttpClient) => {
  const api = createCrudQueries(categoryEntity, http)

  return {
    ...api,
    useCategories: api.useList,
    useCategory: api.useDetail,
    useInfinityCategories: api.useInfiniteList,
    useCreateCategory: api.useCreate,
    useUpdateCategory: api.useUpdate,
    useDeleteCategory: api.useDelete,
    categoryRepository: api.repo,
  }
}
