import { defineField, type Path, type ValidationContext } from 'sanity'

const KEY_PATTERN = /^[a-z0-9][a-z0-9-]*$/

function valueAt(doc: unknown, path: Path): unknown {
  let node: any = doc
  for (const segment of path) {
    if (node == null) return undefined
    if (typeof segment === 'object' && !Array.isArray(segment) && '_key' in segment) {
      node = Array.isArray(node) ? node.find((item) => item?._key === segment._key) : undefined
    } else if (typeof segment === 'string' || typeof segment === 'number') {
      node = node[segment]
    } else {
      return undefined
    }
  }
  return node
}

/** Compares against the published document, so a key can be fixed until first publish. */
async function unchangedSincePublish(value: unknown, context: ValidationContext) {
  const id = context.document?._id?.replace(/^drafts\./, '')
  if (!value || !id || !context.path) return true
  const published = await context
    .getClient({ apiVersion: '2024-01-01' })
    .fetch('*[_id == $id][0]', { id }, { perspective: 'published' })
  const before = valueAt(published, context.path)
  return before === undefined || before === value
    ? true
    : `Key was "${before}" when published. Keys can't change, because stored survey responses use them.`
}

/** Permanent key stored with every response. Unique per document type when `uniqueInType`. */
export function keyField({ uniqueInType = false } = {}) {
  return defineField({
    name: 'key',
    title: 'Key',
    type: 'string',
    description: 'Permanent ID (lowercase letters, numbers, dashes). It cannot change after publishing.',
    validation: (Rule) =>
      Rule.required()
        .regex(KEY_PATTERN, { name: 'lowercase key' })
        .custom(async (value, context) => {
          const unchanged = await unchangedSincePublish(value, context)
          if (unchanged !== true || !uniqueInType || !value) return unchanged
          const id = context.document!._id.replace(/^drafts\./, '')
          const taken = await context
            .getClient({ apiVersion: '2024-01-01' })
            .fetch('count(*[_type == $type && key == $key && !(_id in [$id, "drafts." + $id])])', {
              type: context.document!._type,
              key: value,
              id,
            })
          return taken ? `Another ${context.document!._type} already uses "${value}".` : true
        }),
  })
}

/** Array-level rule: item keys are unique within the array. */
export function uniqueItemKeys(items: unknown) {
  const keys = ((items as { key?: string }[] | undefined) ?? []).map((item) => item.key).filter(Boolean)
  const dupe = keys.find((k, i) => keys.indexOf(k) !== i)
  return dupe ? `Key "${dupe}" is used twice.` : true
}
