import type { CategoryID } from './category.types'
import type { createCategoryApi } from './category.api'
import { categoryForm } from './category.api'

type CategoryApi = ReturnType<typeof createCategoryApi>

interface CategoryUpdateFieldProps {
  api: CategoryApi
  categoryId: CategoryID
  initialTitle: string
  onUpdated?: () => void
}

export const CategoryUpdateField = ({
  api,
  categoryId,
  initialTitle,
  onUpdated,
}: CategoryUpdateFieldProps) => {
  const mutation = api.useUpdateCategory(categoryId, {
    onMutate: async variables => {
      console.log('Optimistic update:', variables)
    },
    onError: error => {
      console.error('Update failed, rolled back:', error)
    },
  })

  const form = categoryForm.useUpdateForm({
    mutation,
    defaultValues: { title: initialTitle },
    onSuccess: () => onUpdated?.(),
  })

  return (
    <form onSubmit={form.submit}>
      <input placeholder="Category title..." {...form.register('title')} />
      {form.formState.errors.title?.message && (
        <span>{form.formState.errors.title.message}</span>
      )}
      <button type="submit" disabled={form.isSubmitting}>
        Save
      </button>
    </form>
  )
}
