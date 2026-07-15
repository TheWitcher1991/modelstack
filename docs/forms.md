# Forms

Forms are part of ModelStack, but they are not part of `@modelstack/core`.

`@modelstack/react-form` handles form logic:

- Zod validation through `zodResolver`
- typed `useForm`
- typed default values
- typed create submit handler
- mutation integration
- reset after success

It intentionally does not render a full form UI.

## Create Form

```ts
export const categoryForm = createEntityForm(categoryEntity, {
  defaultValues: {
    title: '',
  },
})
```

```tsx
const mutation = api.useCreateCategory()

const form = categoryForm.useCreateForm({
  mutation,
  onSuccess: () => onCreated?.(),
})

return (
  <form onSubmit={form.submit}>
    <input {...form.register('title')} />
    <button type="submit" disabled={form.isSubmitting}>
      Add
    </button>
  </form>
)
```

## UI Boundary

Applications can wrap ModelStack form logic with their own UI kit.

```tsx
<Field>
  <Input error={form.formState.errors.title?.message} {...form.register('title')} />
  <FieldError>{form.formState.errors.title?.message}</FieldError>
</Field>
```

This keeps ModelStack portable while still removing the repeated form logic.
