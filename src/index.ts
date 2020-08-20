import { differenceInYears } from 'date-fns/fp';
import { parseFromTimeZone } from 'date-fns-timezone';

/**
 * https://nl.wikipedia.org/wiki/Rijksregisternummer
 */

type NrnBirthDate = readonly [string, string, string];

export interface Nrn {
  birthDate: NrnBirthDate;
  serial: string;
  checksum: string;
}

type NrnInput = string | Nrn;

const AGE_LEGAL_ADULT = 18;

const BIS_MONTH_INCREMENT_GENDER_UNKNOWN = 20;
const BIS_MONTH_INCREMENT_GENDER_KNOWN = 40;

const LENGTH_VALID_NRN = 11; // Eg. 86081441359

const matchesNrnInterface = (nrn: Nrn): boolean =>
  Boolean(nrn && nrn.birthDate && nrn.serial && nrn.checksum);

const mod97 = (input: string): string =>
  String(97 - (Number(input) % 97)).padStart(2, '0');

const parseDate = (input: string) =>
  parseFromTimeZone(input, { timeZone: 'Europe/Brussels' });

function getBirthDay(birthDate: NrnBirthDate): number {
  return parseInt(birthDate[2]);
}

function getBirthMonth(birthDate: NrnBirthDate): number {
  let birthMonth = parseInt(birthDate[1]);
  while (birthMonth >= BIS_MONTH_INCREMENT_GENDER_UNKNOWN) {
    birthMonth -= BIS_MONTH_INCREMENT_GENDER_UNKNOWN;
  }
  return birthMonth;
}

export function getAge(
  nrn: NrnInput,
  { comparisonDate = new Date() }: { comparisonDate?: Date } = {},
): number {
  return differenceInYears(getBirthDate(nrn), comparisonDate);
}

export function getBirthDate(nrn: NrnInput): Date {
  const parsedNrn = parse(nrn);
  const year = getBirthYear(parsedNrn); // Eg. '86' from '860814'
  const month = getBirthMonth(parsedNrn.birthDate); // Eg. 8 from '860814'
  const day = getBirthDay(parsedNrn.birthDate); // Eg. 14 from '860814'
  if (month === 0 || day === 0) {
    throw new Error('Birth date is unknown');
  }
  return parseDate(`${year}-${month}-${day}`);
}

export function getBirthYear(nrn: NrnInput): number {
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

export function isBiologicalFemale(nrn: NrnInput): boolean {
  const { serial } = parse(nrn);
  return Number(serial) % 2 === 0;
}

export function isBiologicalMale(nrn: NrnInput): boolean {
  const { serial } = parse(nrn);
  return Number(serial) % 2 === 1;
}

export function isBirthDateKnown(nrn: NrnInput): boolean {
  const { birthDate } = parse(nrn);
  const month = getBirthMonth(birthDate);
  const day = getBirthDay(birthDate);
  return month !== 0 && day !== 0;
}

export function isBisNumber(nrn: NrnInput): boolean {
  const { birthDate } = parse(nrn);
  const month = parseInt(birthDate[1]);
  return month >= BIS_MONTH_INCREMENT_GENDER_UNKNOWN;
}

export function isEqual(nrn1: NrnInput, nrn2: NrnInput): boolean {
  return normalize(nrn1) === normalize(nrn2);
}

export function isGenderKnown(nrn: NrnInput): boolean {
  const { birthDate } = parse(nrn);
  const nrnMonth = parseInt(birthDate[1]);
  return (
    nrnMonth < BIS_MONTH_INCREMENT_GENDER_UNKNOWN ||
    nrnMonth >= BIS_MONTH_INCREMENT_GENDER_KNOWN
  );
}

export function isNrnNumber(nrn: NrnInput): boolean {
  return !isBisNumber(nrn);
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
    const birthDate: NrnBirthDate = [
      birthDateString.slice(0, 2),
      birthDateString.slice(2, 4),
      birthDateString.slice(4),
    ]; // Eg. ['86', '08', '14'] from '860814'
    const serial = normalizedNrn.slice(6, 9); // Eg. '413' from '86081441359'
    const checksum = normalizedNrn.slice(9, 11); // Eg. '59' from '86081441359'
    return { birthDate, serial, checksum };
  }
  if (matchesNrnInterface(nrn)) {
    return nrn as Nrn;
  }
  throw new Error('Could not parse nrn of invalid type');
}
