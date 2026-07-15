import { zodResolver } from '@hookform/resolvers/zod'
import type { UseMutationResult } from '@tanstack/react-query'
import { useForm, type UseFormProps, type UseFormReturn } from 'react-hook-form'

import type { EntityDefinition, EntityRead, EntityWrite } from '@modelstack/core'

export interface EntityFormOptions<
  TEntity extends EntityDefinition<string, string, any>,
> {
  defaultValues: UseFormProps<EntityWrite<TEntity>>['defaultValues']
}

export interface UseEntityFormOptions<
  TEntity extends EntityDefinition<string, string, any>,
  TVariables,
> {
  mutation: UseMutationResult<EntityRead<TEntity>, Error, TVariables, unknown>
  onSuccess?: (data: EntityRead<TEntity>) => void
  onError?: (error: Error) => void
  resetOnSuccess?: boolean
}

export type UseEntityCreateFormOptions<
  TEntity extends EntityDefinition<string, string, any>,
> = UseEntityFormOptions<TEntity, EntityWrite<TEntity>>

export type UseEntityUpdateFormOptions<
  TEntity extends EntityDefinition<string, string, any>,
> = UseEntityFormOptions<TEntity, Partial<EntityWrite<TEntity>>> & {
  defaultValues?: UseFormProps<EntityWrite<TEntity>>['defaultValues']
}

export interface EntityFormApi<TEntity extends EntityDefinition<string, string, any>> {
  useCreateForm: (options: UseEntityCreateFormOptions<TEntity>) => UseFormReturn<
    EntityWrite<TEntity>
  > & {
    submit: ReturnType<UseFormReturn<EntityWrite<TEntity>>['handleSubmit']>
    isSubmitting: boolean
  }

  useUpdateForm: (options: UseEntityUpdateFormOptions<TEntity>) => UseFormReturn<
    EntityWrite<TEntity>
  > & {
    submit: ReturnType<UseFormReturn<EntityWrite<TEntity>>['handleSubmit']>
    isSubmitting: boolean
  }
}

export function createEntityForm<TEntity extends EntityDefinition<string, string, any>>(
  entity: TEntity,
  options: EntityFormOptions<TEntity>,
): EntityFormApi<TEntity> {
  const useCreateForm: EntityFormApi<TEntity>['useCreateForm'] = ({
    mutation,
    onSuccess,
    onError,
    resetOnSuccess = true,
  }) => {
    const form = useForm<EntityWrite<TEntity>>({
      defaultValues: options.defaultValues,
      resolver: zodResolver(entity.schemas.write),
    })

    const submit = form.handleSubmit(async values => {
      try {
        const result = await mutation.mutateAsync(values)
        onSuccess?.(result)
        if (resetOnSuccess) form.reset(options.defaultValues)
      } catch (error) {
        onError?.(error as Error)
      }
    })

    return {
      ...form,
      submit,
      isSubmitting: form.formState.isSubmitting || mutation.isPending,
    }
  }

  const useUpdateForm: EntityFormApi<TEntity>['useUpdateForm'] = ({
    mutation,
    onSuccess,
    onError,
    resetOnSuccess = true,
    defaultValues,
  }) => {
    const form = useForm<EntityWrite<TEntity>>({
      defaultValues: defaultValues ?? options.defaultValues,
      resolver: zodResolver(entity.schemas.write),
    })

    const submit = form.handleSubmit(async values => {
      try {
        const result = await mutation.mutateAsync(values)
        onSuccess?.(result)
        if (resetOnSuccess) form.reset(defaultValues ?? options.defaultValues)
      } catch (error) {
        onError?.(error as Error)
      }
    })

    return {
      ...form,
      submit,
      isSubmitting: form.formState.isSubmitting || mutation.isPending,
    }
  }

  return { useCreateForm, useUpdateForm }
}
