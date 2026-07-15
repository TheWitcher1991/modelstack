import type { CategoryID } from './category.types'

export const toCategoryID = (id: number | string): CategoryID => Number(id) as CategoryID
