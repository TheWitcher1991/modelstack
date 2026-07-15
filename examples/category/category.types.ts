import type { z } from 'zod'

import {
  CategoryQueryModel,
  categoryId,
  ReadonlyCategoryModel,
  WritableCategoryModel,
} from './category.model'

export type CategoryID = z.infer<typeof categoryId>

export type ICategory = z.infer<typeof ReadonlyCategoryModel>

export type ICreateCategory = z.infer<typeof WritableCategoryModel>

export type IUpdateCategory = z.infer<typeof WritableCategoryModel>

export type CategoryQuery = z.infer<typeof CategoryQueryModel>

export type WithCategoryID = {
  category: CategoryID
}

export type WithCategory = {
  category: ICategory
}
