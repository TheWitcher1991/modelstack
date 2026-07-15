import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { defineEntity } from './index'

describe('defineEntity', () => {
  it('creates stable query keys and paths from a zod-backed entity contract', () => {
    const entity = defineEntity({
      key: 'category',
      endpoint: 'categories',
      schemas: {
        id: z.number(),
        read: z.object({ id: z.number(), title: z.string() }),
        write: z.object({ title: z.string() }),
      },
    })

    expect(entity.keys.all).toEqual(['category'])
    expect(entity.keys.list({ page: 1 })).toEqual(['category', 'list', { page: 1 }])
    expect(entity.keys.detail(7)).toEqual(['category', 'detail', 7])
    expect(entity.paths.detail(7)).toBe('categories/7')
  })
})
