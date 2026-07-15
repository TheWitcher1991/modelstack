import type { createCategoryApi } from './category.api'
import { categoryForm } from './category.api'

type CategoryApi = ReturnType<typeof createCategoryApi>

interface CategoryCreateFieldProps {
  api: CategoryApi
  onCreated?: () => void
}

export const CategoryCreateField = ({ api, onCreated }: CategoryCreateFieldProps) => {
  const mutation = api.useCreateCategory()
  const form = categoryForm.useCreateForm({
    mutation,
    onSuccess: () => onCreated?.(),
  })

  return (
    <form onSubmit={form.submit}>
      <input placeholder="New category..." {...form.register('title')} />
      {form.formState.errors.title?.message && (
        <span>{form.formState.errors.title.message}</span>
      )}
      <button type="submit" disabled={form.isSubmitting}>
        Add
      </button>
    </form>
  )
}
