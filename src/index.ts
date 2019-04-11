import { differenceInYears } from 'date-fns/fp';
import { parseFromTimeZone } from 'date-fns-timezone';

/**
 * https://nl.wikipedia.org/wiki/Rijksregisternummer
 */

export interface Nrn {
  birthDate: string;
  serial: string;
  checksum: string;
}

type NrnInput = string | Nrn;

const AGE_LEGAL_ADULT = 18;

const LENGTH_VALID_NRN = 11; // Eg. 86081441359

const matchesNrnInterface = (nrn: Nrn): boolean =>
  Boolean(nrn && nrn.birthDate && nrn.serial && nrn.checksum);

const mod97 = (input: string): string =>
  String(97 - (Number(input) % 97)).padStart(2, '0');

const parseDate = (input: string) =>
  parseFromTimeZone(input, { timeZone: 'Europe/Brussels' });

export function getAge(
  nrn: NrnInput,
  { comparisonDate = new Date() }: { comparisonDate?: Date } = {},
): number {
  return differenceInYears(getBirthDate(nrn), comparisonDate);
}

export function getBirthDate(nrn: NrnInput): Date {
  const { birthDate, serial, checksum } = parse(nrn);
  const partialYear = birthDate.slice(0, 2); // Eg. '86' from '860814'
  const month = Number(birthDate.slice(2, 4)); // Eg. 8 from '860814'
  const day = Number(birthDate.slice(4, 6)); // Eg. 14 from '860814'
  let year: number;
  const checksum19 = mod97(`${birthDate}${serial}`);
  const checksum20 = mod97(`2${birthDate}${serial}`);
  if (checksum19 === checksum) {
    year = Number(`19${partialYear}`);
  } else if (checksum20 === checksum) {
    year = Number(`20${partialYear}`);
  } else {
    throw new Error(
      `Could not calculate birthDate with invalid checksum of "${checksum}", expected "${checksum19}" for 1900 or "${checksum20}" for 2000`,
    );
  }
  return parseDate(`${year}-${month}-${day}`);
}

export function isBiologicalFemale(nrnInput: NrnInput): boolean {
  const { serial } = parse(nrnInput);
  return Number(serial) % 2 === 0;
}

export function isBiologicalMale(nrnInput: NrnInput): boolean {
  const { serial } = parse(nrnInput);
  return Number(serial) % 2 === 1;
}

export function isEqual(nrn1: NrnInput, nrn2: NrnInput): boolean {
  return normalize(nrn1) === normalize(nrn2);
}

export function isLegalAdult(nrn: NrnInput): boolean {
  return getAge(nrn) >= AGE_LEGAL_ADULT;
}

export function normalize(nrn: NrnInput): string {
  if (typeof nrn === 'string') {
    return nrn.replace(/[^\d]+/g, '');
  }
  if (matchesNrnInterface(nrn)) {
    return `${nrn.birthDate}${nrn.serial}${nrn.checksum}`;
  }
  throw new Error('Could not normalize nrn of invalid type');
}

export function parse(nrnInput: NrnInput): Nrn {
  if (typeof nrnInput === 'string') {
    const normalizedNrn = normalize(nrnInput);
    normalizedNrn;
    if (normalizedNrn.length !== LENGTH_VALID_NRN) {
      throw new Error('Could not parse nrn of invalid length');
    }
    const birthDate = normalizedNrn.slice(0, 6); // Eg. '860814' from '86081441359'
    const serial = normalizedNrn.slice(6, 9); // Eg. '413' from '86081441359'
    const checksum = normalizedNrn.slice(9, 11); // Eg. '59' from '86081441359'
    return { birthDate, serial, checksum };
  }
  if (matchesNrnInterface(nrnInput)) {
    return nrnInput as Nrn;
  }
  throw new Error('Could not parse nrn of invalid type');
}
