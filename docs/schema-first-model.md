# ModelStack: Schema-Driven Fullstack

## Проблема

В индустрии два подхода к фронт-бек взаимодействию:

**Code-first** (tRPC, Hono): бекенд пишет код → фронтенд потребляет типы. Контракт неявный (`typeof router`), не документируется, не версионируется.

**Contract-first** (oRPC, OpenAPI): контракт определяется отдельно → обе стороны генерируют код. Но контракт — это JSON/YAML, не исполняемый код. Нет runtime-валидации на стороне фронта.

ModelStack предлагает **третий путь**: **Executable Schema** — Zod-схема одновременно является контрактом, валидацией, типом и исполняемым кодом на обеих сторонах.

---

## Суть

**Одна Zod-схема = контракт. Фронтенд и бекенд — потребители.**

Фронтенд получает: React hooks, формы, UI-компоненты, Effector stores.
Бекенд получает: CRUD-маршруты, Zod-валидацию, Drizzle-миграции, OpenAPI-документацию.

---

## Архитектура

```
                    ┌─────────────────────────┐
                    │  @modelstack/schemas     │
                    │  (шаредный пакет)        │
                    │                          │
                    │  defineEntity({          │
                    │    schemas: { Zod },     │
                    │    relations: { ... },   │
                    │    permissions: { ... }, │
                    │  })                      │
                    └──────────┬──────────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                 ▼
     ┌────────────────┐ ┌───────────────┐ ┌──────────────┐
     │ Frontend       │ │ Backend       │ │ Tooling      │
     │ @modelstack/   │ │ @modelstack/  │ │ @modelstack/ │
     │ react          │ │ server        │ │ openapi      │
     │                │ │ @modelstack/  │ │ @modelstack/ │
     │ useEntity()    │ │ drizzle       │ │ cli          │
     │ <EntityForm /> │ │               │ │              │
     │ <EntityList /> │ │ route(entity) │ │ generate     │
     └────────────────┘ └───────────────┘ └──────────────┘
```

---

## Пакеты

### `@modelstack/schemas`

Шаредный пакет. Не зависит от React, Axios или любого фреймворка. Потребители: и фронт, и бек.

Содержимое:
- `defineEntity()` — основная функция
- Типы: `EntityDefinition`, `EntitySchemas`, `EntityRead`, `EntityWrite`, `EntityId`, `EntityQuery`
- Бренды: `Brand<T, Name>`
- Утилиты: `InferSchema`, `Dictionary`, `Id`

Расширенный `defineEntity`:

```ts
defineEntity({
  key: 'post',
  endpoint: 'posts',
  schemas: {
    id: z.coerce.number().int().positive().brand<'PostID'>(),
    read: PostReadModel,
    write: PostWriteModel,
    query: PostQueryModel,
  },
  // Новое: связи
  relations: {
    author: { type: 'belongs_to', entity: 'user', foreignKey: 'author_id' },
    comments: { type: 'has_many', entity: 'comment', foreignKey: 'post_id' },
  },
  // Новое: индексы (для миграций)
  indexes: ['author_id', ['-created_at']],
  // Новое: права доступа
  permissions: {
    list: 'authenticated',
    create: 'authenticated',
    update: 'owner',
    delete: 'admin',
  },
})
```

---

### `@modelstack/react`

Объединяет `react-query`, `react-form`, `react-ui` в один пакет. Одна точка входа для фронтенда.

**Хуки:**

```ts
// Список сущностей + фильтры + пагинация
const { data, filter, setFilter, isLoading, createForm, deleteOne } = useEntityList(postEntity)

// Детали сущности
const { data, isLoading } = useEntityDetail(postEntity, postId)
```

**Компоненты:**

```tsx
// Список с автоматическим DataLoader
<EntityList entity={postEntity} filter={filter} renderItem={item => <li>{item.title}</li>} />

// Форма с Zod-валидацией
<EntityForm entity={postEntity} onSubmit={create} defaultValues={{ title: '' }}>
  <input {...form.register('title')} />
</EntityForm>
```

**API:**

| Хук/компонент | Что делает |
|---|---|
| `useEntityList(entity, params?)` | useQuery + фильтры + Effector store |
| `useEntityDetail(entity, id)` | useQuery для единичной сущности |
| `useEntityCreate(entity, options?)` | useMutation + автоматическая инвалидация кэша |
| `useEntityUpdate(entity, id, options?)` | useMutation + optimistic update |
| `useEntityDelete(entity, options?)` | useMutation + инвалидация кэша |
| `useEntityForm(entity, options?)` | useForm + zodResolver + submit |
| `<DataLoader>` | Условный рендер (loading/error/empty) |
| `<EntityList>` | Обёртка над списком с DataLoader |
| `<EntityForm>` | Обёртка над формой с DataLoader |

---

### `@modelstack/http`

Текущий `AxiosHttpClient` + runtime-валидация ответов.

```ts
// Сейчас: данные попадают в кэш как есть
const data = await http.get('/posts/') // unknown → Post[]

// Новая модель: данные валидируются через read-схему
const data = await http.get('/posts/', { responseSchema: postReadSchema })
// unknown → parse → Post[] (или ошибка валидации)
```

Принцип: **"Parse, Don't Validate"**. Данные считаются `unknown` до прохождения через Zod-парсер.

---

### `@modelstack/server`

CRUD-маршруты из entity + Zod-валидация. Работает поверх Hono, Express или любого HTTP-фреймворка.

```ts
import { createEntityRoutes } from '@modelstack/server'

const app = new Hono()

app.route('/api', createEntityRoutes(postEntity, {
  findAll: async (query) => db.query.posts.findMany({ ... }),
  findById: async (id) => db.query.posts.findFirst({ where: eq(posts.id, id) }),
  create: async (data) => db.insert(posts).values(data).returning(),
  update: async (id, data) => db.update(posts).set(data).where(eq(posts.id, id)).returning(),
  delete: async (id) => db.delete(posts).where(eq(posts.id, id)),
}))
```

Генерирует:
- `GET /posts/` — список с пагинацией (query-параметры валидируются через `query` схему)
- `GET /posts/:id` — детали
- `POST /posts/` — создание (тело валидируется через `write` схему)
- `PATCH /posts/:id` — обновление
- `DELETE /posts/:id` — удаление

---

### `@modelstack/drizzle`

Генерация Drizzle-схем и миграций из entity.

```ts
import { generateDrizzleSchema } from '@modelstack/drizzle'

const postsTable = generateDrizzleSchema(postEntity)
// → Drizzle-таблица с колонками из read/write схем

import { generateMigration } from '@modelstack/drizzle'

const migration = generateMigration([postEntity, userEntity])
// → SQL-миграция
```

---

### `@modelstack/openapi`

Генерация OpenAPI 3.1 JSON из entities.

```ts
import { generateOpenAPI } from '@modelstack/openapi'

const spec = generateOpenAPI([postEntity, userEntity, commentEntity])
// → OpenAPI 3.1 JSON с описанием endpoints, request/response bodies, query parameters
```

---

### `@modelstack/cli`

CLI для генерации кода.

```bash
# Генерация из базы данных
modelstack generate --from-db postgres://localhost/mydb

# Генерация из OpenAPI-спеки
modelstack generate --from-openapi ./openapi.json

# Генерация миграции
modelstack migrate --entity post

# Генерация OpenAPI из entities
modelstack openapi --entities ./entities/
```

---

## Процесс разработки

### Сейчас (10 шагов на сущность)

```
1.  Описать Zod-схемы                    (category.model.ts)
2.  Определить entity                     (category.entity.ts)
3.  Вывести TypeScript-типы               (category.types.ts)
4.  Создать репозиторий                   (category.repository.ts)
5.  Создать API-хуки + форму             (category.api.ts)
6.  Создать Effector-store                (category.store.ts)
7.  Создать feature-хук                  (category.feature.ts)
8.  Создать компонент列表                  (category.list.tsx)
9.  Создать компонент创建                  (category.create-field.tsx)
10. Создать компонент更新                 (category.update-field.tsx)
```

### Новая модель (3 шага на сущность)

```
1. Описать entity (шаредный пакет)        (post.entity.ts)
2. Подключить на фронте                    (useEntity(postEntity))
3. Подключить на беке                      (createEntityRoutes(postEntity, db))
```

---

## Сравнение с existing подходами

| | ModelStack (текущий) | tRPC | oRPC | Новая модель |
|---|---|---|---|---|
| Контракт | Zod-схемы | typeof router | Contract объект | Zod-схемы |
| Формы из коробки | Да | Нет | Нет | Да |
| List stores | Да (Effector) | Нет | Нет | Да |
| Backend валидация | Нет | Да | Да | Да |
| Миграции | Нет | Нет | Нет | Да (Drizzle) |
| OpenAPI | Нет | Нет | Да | Да |
| Runtime response validation | Нет | Нет | Нет | Да |
| Кол-во файлов на сущность | 12 | 2-3 | 2-3 | 3 |

---

## Ключевое отличие от tRPC/oRPC

tRPC и oRPC — это **RPC-слои**. Они определяют *как* фронтенд вызывает бекенд.

ModelStack — это **entity-слои**. Он определяет *что* является сущностью и автоматически генерирует всё вокруг: хуки, формы, UI, маршруты, валидацию, миграции, документацию.

Это разные уровни абстракции. Их можно комбинировать: `@modelstack/server` может работать поверх tRPC или Hono.

---

## Порядок реализации

| Шаг | Пакет | Что делает | Сложность |
|---|---|---|---|
| 1 | `@modelstack/schemas` | Выносит `defineEntity` + типы в шаредный пакет | Низкая |
| 2 | `@modelstack/schemas` | Добавляет `relations`, `indexes`, `permissions` в `defineEntity` | Средняя |
| 3 | `@modelstack/react` | Объединяет react-query + react-form + react-ui в один `useEntity` хук | Средняя |
| 4 | `@modelstack/http` | Добавляет runtime валидацию ответов через Zod | Низкая |
| 5 | `@modelstack/server` | CRUD-маршруты из entity + Zod-валидация | Средняя |
| 6 | `@modelstack/drizzle` | Генерация Drizzle-схем из entity | Средняя |
| 7 | `@modelstack/openapi` | Генерация OpenAPI 3.1 из entities | Низкая |
| 8 | CLI | `modelstack generate` из базы данных | Высокая |

---

## Пример: полный цикл

### 1. Шаредный контракт

```ts
// shared/post.entity.ts
import { defineEntity } from '@modelstack/schemas'
import { z } from 'zod'

export const postEntity = defineEntity({
  key: 'post',
  endpoint: 'posts',
  schemas: {
    id: z.coerce.number().int().positive().brand<'PostID'>(),
    read: z.object({
      id: z.number(),
      title: z.string(),
      body: z.string(),
      author_id: z.number(),
      created_at: z.string(),
      updated_at: z.string(),
    }),
    write: z.object({
      title: z.string().min(1).max(200),
      body: z.string().min(1),
      author_id: z.number(),
    }),
    query: z.object({
      page: z.number().optional(),
      page_size: z.number().optional(),
      search: z.string().optional(),
      author_id: z.number().optional(),
    }),
  },
  relations: {
    author: { type: 'belongs_to', entity: 'user', foreignKey: 'author_id' },
    comments: { type: 'has_many', entity: 'comment', foreignKey: 'post_id' },
  },
  permissions: {
    list: 'public',
    create: 'authenticated',
    update: 'owner',
    delete: 'admin',
  },
})
```

### 2. Фронтенд

```tsx
// features/posts/PostList.tsx
import { useEntityList, EntityList } from '@modelstack/react'
import { postEntity } from '../../shared/post.entity'

export const PostList = () => {
  const { data, filter, setFilter, isLoading } = useEntityList(postEntity)

  return (
    <EntityList
      isLoading={isLoading}
      data={data}
      renderItem={post => (
        <li key={post.id}>{post.title}</li>
      )}
    />
  )
}

// features/posts/PostForm.tsx
import { useEntityForm, EntityForm } from '@modelstack/react'
import { postEntity } from '../../shared/post.entity'

export const PostForm = () => {
  const { submit, isSubmitting, register, formState } = useEntityForm(postEntity, {
    defaultValues: { title: '', body: '', author_id: 0 },
  })

  return (
    <EntityForm onSubmit={submit} isSubmitting={isSubmitting}>
      <input {...register('title')} />
      {formState.errors.title?.message && <span>{formState.errors.title.message}</span>}
      <textarea {...register('body')} />
      <button type="submit" disabled={isSubmitting}>Create</button>
    </EntityForm>
  )
}
```

### 3. Бекенд

```ts
// server/posts.ts
import { createEntityRoutes } from '@modelstack/server'
import { postEntity } from '../shared/post.entity'
import { db } from './db'
import { posts } from './schema'

export const postRoutes = createEntityRoutes(postEntity, {
  findAll: async (query) => {
    return db.select().from(posts).where(
      query.search ? ilike(posts.title, `%${query.search}%`) : undefined
    )
  },
  findById: async (id) => {
    return db.query.posts.findFirst({ where: eq(posts.id, id) })
  },
  create: async (data) => {
    return db.insert(posts).values(data).returning()
  },
  update: async (id, data) => {
    return db.update(posts).set(data).where(eq(posts.id, id)).returning()
  },
  delete: async (id) => {
    return db.delete(posts).where(eq(posts.id, id))
  },
})
```

### 4. Миграция

```bash
modelstack migrate --entity post
# → CREATE TABLE posts (
#     id SERIAL PRIMARY KEY,
#     title VARCHAR(200) NOT NULL,
#     body TEXT NOT NULL,
#     author_id INTEGER REFERENCES users(id),
#     created_at TIMESTAMP DEFAULT NOW(),
#     updated_at TIMESTAMP DEFAULT NOW()
#   );
```

### 5. OpenAPI

```bash
modelstack openapi --entities ./shared/
# → openapi.json с описанием всех endpoints
```
