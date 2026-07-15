import { defineEntity } from '@modelstack/core'

import {
  CategoryQueryModel,
  categoryId,
  ReadonlyCategoryModel,
  WritableCategoryModel,
} from './category.model'

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
