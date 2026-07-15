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

export const CategoryQueryModel = z.object({
  page: z.number().int().positive().optional(),
  page_size: z.number().int().positive().optional(),
  limit: z.number().int().positive().optional(),
  query: z.string().optional(),
  ordering: z.string().optional(),
})
