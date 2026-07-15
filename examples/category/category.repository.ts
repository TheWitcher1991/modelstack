import { createCrudRepository, type HttpClient } from '@modelstack/http'

import { categoryEntity } from './category.entity'

export const createCategoryRepository = (http: HttpClient) =>
  createCrudRepository(categoryEntity, http)
