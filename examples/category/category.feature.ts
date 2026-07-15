import { useMemo } from 'react'

import type { HttpClient } from '@modelstack/http'

import { createCategoryApi } from './category.api'

export type SelectOption<TValue extends string | number = string | number> = {
  label: string
  value: TValue
}

export const createCategoryFeature = (http: HttpClient) => {
  const api = createCategoryApi(http)

  const useCategorySelectOptions = () => {
    const { data = [], isLoading } = api.useCategories({
      ordering: '-created_at',
    })

    const categories = useMemo<SelectOption[]>(
      () =>
        data.map(category => ({
          label: category.title,
          value: category.id,
        })),
      [data],
    )

    return { categories, isLoading }
  }

  return {
    ...api,
    useCategorySelectOptions,
  }
}
