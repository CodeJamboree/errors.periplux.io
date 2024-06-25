import { FormControlState } from '@angular/forms';

const validate = (value: string | FormControlState<string>, pattern: RegExp, key: string) => {
  const text = typeof value === 'string' ? value : value.value;
  if (text === '') return null;
  if (!pattern.test(text)) return { [key]: true };
  return null;
}
export const alphaNumericOnlyValidator = (value: string | FormControlState<string>) => {
  return validate(value, /^[a-z\d]*$/i, 'alphaNumericOnly');
}
export const digitRequiredValidator = (value: string | FormControlState<string>) => {
  return validate(value, /\d/, 'digitRequired');
}
export const uppercaseRequiredValidator = (value: string | FormControlState<string>) => {
  return validate(value, /[A-Z]/, 'uppercaseRequired');
}
export const lowercaseRequiredValidator = (value: string | FormControlState<string>) => {
  return validate(value, /[a-z]/, 'lowercaseRequired');
}
export const symbolRequiredValidator = (value: string | FormControlState<string>) => {
  return validate(value, /[-[!@#$%^&*()_+={}|:";'<>?,.\/\\\]]/, 'symbolRequired');
}