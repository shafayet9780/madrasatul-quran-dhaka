import { Card, Checkbox, Flex, Stack, Text } from '@sanity/ui';
import { set, useFormValue, type ArrayOfPrimitivesInputProps } from 'sanity';
import type { FinancialEntry } from '../../src/types/fees';

export function FeeTargetsInput(props: ArrayOfPrimitivesInputProps) {
  const fees = (useFormValue(['fees']) || []) as FinancialEntry[];
  const transport = (useFormValue(['transport']) || []) as FinancialEntry[];
  const entries = [...fees, ...transport];
  const selected = (props.value || []).filter(
    (value): value is string => typeof value === 'string'
  );
  const keys = [...new Set([...entries.map(e => e._key), ...selected])];
  return (
    <Stack space={3}>
      {keys.length ? (
        keys.map(key => {
          const entry = entries.find(e => e._key === key);
          return (
            <Card key={key} padding={2} border radius={2}>
              <Flex as="label" align="center" gap={3}>
                <Checkbox
                  disabled={props.readOnly}
                  checked={selected.includes(key)}
                  onChange={event =>
                    props.onChange(
                      set(
                        event.currentTarget.checked
                          ? [...selected, key]
                          : selected.filter(v => v !== key)
                      )
                    )
                  }
                />
                <Text size={1}>
                  {entry
                    ? `${entry.name?.english || entry.name?.bengali || 'Unnamed entry'}${entry.visible ? '' : ' (hidden)'}`
                    : 'Deleted entry — uncheck to remove'}
                </Text>
              </Flex>
            </Card>
          );
        })
      ) : (
        <Text size={1}>Add school fees or vehicles first.</Text>
      )}
    </Stack>
  );
}
