export function isPhone(value: string) {
  const digits = value.replace(/\D/g, '');
  return (
    /^\+?[\d\s().-]+$/.test(value) &&
    (value.trim().startsWith('+')
      ? digits.length >= 7 && digits.length <= 15
      : digits.length === 10 || (digits.length === 11 && digits.startsWith('1')))
  );
}
