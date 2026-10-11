import { Select } from '@sanity/ui';
import { set, unset, useFormValue, type StringInputProps } from 'sanity';
import type { TransportFee } from '../../src/types/fees';

// A route's vehicle: one of the vehicles above in the same document (stored by its key).
export function VehicleSelectInput(props: StringInputProps) {
  const vehicles = (useFormValue(['transport']) || []) as TransportFee[];
  const known = vehicles.some(v => v._key === props.value);
  return (
    <Select
      id={props.elementProps.id}
      onFocus={props.elementProps.onFocus}
      onBlur={props.elementProps.onBlur}
      readOnly={props.readOnly}
      value={props.value ?? ''}
      onChange={event =>
        props.onChange(
          event.currentTarget.value ? set(event.currentTarget.value) : unset()
        )
      }
    >
      <option value="">Choose a vehicle</option>
      {vehicles.map(v => (
        <option key={v._key} value={v._key}>
          {v.name?.bengali || v.name?.english || 'Unnamed vehicle'}
        </option>
      ))}
      {props.value && !known && (
        <option value={props.value}>Deleted vehicle, choose another</option>
      )}
    </Select>
  );
}
