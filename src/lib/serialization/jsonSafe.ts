/**
 * Values Prisma returns that `JSON.stringify` / `NextResponse.json` cannot handle by default.
 */
export function jsonSafeReplacer(_key: string, value: unknown): unknown {
  if (typeof value === 'bigint') {
    return Number(value);
  }
  if (isDecimalLike(value)) {
    return value.toNumber();
  }
  return value;
}

function isDecimalLike(value: unknown): value is { toNumber: () => number } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'toNumber' in value &&
    typeof (value as { toNumber: unknown }).toNumber === 'function'
  );
}

/** Deep-clone via JSON round-trip with BigInt / Decimal handling (API + Redis payloads). */
export function toJsonSafe<T>(value: T): T {
  return JSON.parse(JSON.stringify(value, jsonSafeReplacer)) as T;
}
