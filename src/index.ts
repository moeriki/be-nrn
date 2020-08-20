import { differenceInYears } from 'date-fns/fp';
import { parseFromTimeZone } from 'date-fns-timezone';

/**
 * https://nl.wikipedia.org/wiki/Rijksregisternummer
 */

export interface Nrn {
  birthDate: readonly [string, string, string];
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

function getBirthDay(nrn: NrnInput): number {
  const { birthDate } = parse(nrn);
  return parseInt(birthDate[2]);
}

function getBirthMonth(nrn: NrnInput): number {
  const { birthDate } = parse(nrn);
  if (isBisNumber(nrn)) {
    return getBisBirthMonth(nrn);
  }
    return parseInt(birthDate[1]);
}

function getBirthYear(nrn: NrnInput): number {
  const { birthDate, serial, checksum } = parse(nrn);
  const partialYear = birthDate[0]; // Eg. '86' from '860814'
  let year: number;
  const checksum19 = mod97(`${birthDate.join('')}${serial}`);
  const checksum20 = mod97(`2${birthDate.join('')}${serial}`);
  if (checksum19 === checksum) {
    year = Number(`19${partialYear}`);
  } else if (checksum20 === checksum) {
    year = Number(`20${partialYear}`);
  } else {
    throw new Error(
      `Could not calculate birthDate with invalid checksum of "${checksum}", expected "${checksum19}" for 1900 or "${checksum20}" for 2000`,
    );
  }
  return year;
}

function getBisBirthMonth(nrn: NrnInput): number {
  if (!isBisNumber(nrn)) {
    throw new Error('This is not a BIS number');
  }
  const { birthDate } = parse(nrn);
  const month = parseInt(birthDate[1]);
  if (month === 0) {
    return month;
  }
  return month > 40 ? month - 40 : month - 20;
}

function makeReadonlyStringArray(inputString: string): readonly [string, string, string] {
  return [inputString.slice(0, 2), inputString.slice(2, 4), inputString.slice(4)];
}

export function getAge(
  nrn: NrnInput,
  { comparisonDate = new Date() }: { comparisonDate?: Date } = {},
): number {
  return differenceInYears(getBirthDate(nrn), comparisonDate);
}

export function getBirthDate(nrn: NrnInput): Date {
  const year = getBirthYear(nrn); // Eg. '86' from '860814'
  const month = getBirthMonth(nrn) ; // Eg. 8 from '860814'
  const day = getBirthDay(nrn); // Eg. 14 from '860814'
  if (month < 1 || day < 1) {
    throw new Error('Birth date is unknown');
  }
  return parseDate(`${year}-${month}-${day}`);
}

export function isBiologicalFemale(nrn: NrnInput): boolean {
  const { serial } = parse(nrn);
  return Number(serial) % 2 === 0;
}

export function isBiologicalMale(nrn: NrnInput): boolean {
  const { serial } = parse(nrn);
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
    return `${nrn.birthDate.join('')}${nrn.serial}${nrn.checksum}`;
  }
  throw new Error('Could not normalize nrn of invalid type');
}

export function parse(nrn: NrnInput): Nrn {
  if (typeof nrn === 'string') {
    const normalizedNrn = normalize(nrn);
    if (normalizedNrn.length !== LENGTH_VALID_NRN) {
      throw new Error('Could not parse nrn of invalid length');
    }
    const birthDateString = normalizedNrn.slice(0, 6); // Eg. '860814' from '86081441359'
    const birthDate = makeReadonlyStringArray(birthDateString); // ['86', '08', '14'] from '860814'
    const serial = normalizedNrn.slice(6, 9); // Eg. '413' from '86081441359'
    const checksum = normalizedNrn.slice(9, 11); // Eg. '59' from '86081441359'
    return { birthDate, serial, checksum };
  }
  if (matchesNrnInterface(nrn)) {
    return nrn as Nrn;
  }
  throw new Error('Could not parse nrn of invalid type');
}

export function isBisNumber(nrn: NrnInput): boolean {
  const { birthDate } = parse(nrn);
  const month = parseInt(birthDate[1]);
  return month > 12 || month === 0;
}

export function isBisBirthdateKnown(nrn: NrnInput): boolean {
  const month = getBisBirthMonth(nrn);
  const day = getBirthDay(nrn);
  return month > 0 && day > 0;
}

export function isBisGenderKnown(nrn: NrnInput): boolean {
  if (!isBisNumber(nrn)) {
    throw new Error('This is not a BIS number');
  }
  const { birthDate } = parse(nrn);
  return parseInt(birthDate[1]) > 40;
}

export function isNrnNumber(nrn: NrnInput): boolean {
  return !isBisNumber(nrn);
}

export function isValidNrnNumber(nrn: NrnInput) {
  try {
    getBirthYear(nrn);
    return true;
  } catch (error) {
    return false;
  }
}
