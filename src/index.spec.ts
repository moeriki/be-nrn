import timekeeper from 'timekeeper';
import { parseFromTimeZone } from 'date-fns-timezone';

import * as nrnUtils from './index';

const parseDate = (input: string) =>
  parseFromTimeZone(input, { timeZone: 'Europe/Brussels' });

describe('getAge()', () => {
  beforeEach(() => {
    timekeeper.freeze(new Date('2018-08-14T05:30:00.000Z'));
  });

  it('should get age from nrn', () => {
    expect(nrnUtils.getAge('860813 000 17')).toBe(32);
    expect(nrnUtils.getAge('860814 000 84')).toBe(32);
    expect(nrnUtils.getAge('860815 000 54')).toBe(31);
  });

  afterEach(() => {
    timekeeper.reset();
  });
});

describe('getBirthDate()', () => {
  it('should get 1900 birthDate from nrn', () => {
    expect(nrnUtils.getBirthDate('860814 000 84').getTime()).toBe(
      parseDate('1986-08-14').getTime(),
    );
  });

  it('should get 2000 birthDate from nrn', () => {
    expect(nrnUtils.getBirthDate('010814 000 74').getTime()).toBe(
      parseDate('2001-08-14').getTime(),
    );
  });
  it('should extract the correct birthdate from a NRN', () => {
    expect(nrnUtils.getBirthDate('810212 896 71')).toEqual(new Date('02-12-1981'));
  });
  it('should extract the correct birthdate from a BIS number', () => {
    expect(nrnUtils.getBirthDate('814212 896 60')).toEqual(new Date('02-12-1981'));
    expect(nrnUtils.getBirthDate('812212 896 17')).toEqual(new Date('02-12-1981'));
    expect(nrnUtils.getBirthDate('810000 896 29')).toEqual(new Date('06-01-1981'));
  });
  it('should always parse in Belgian timezone', () => {
    // This test depends on the timezone's current computer.
    // If it succeeds locally (running on a computer in Belgian timezone),
    // but fails on the CI, then it's broken.
    const birthDate = nrnUtils.getBirthDate('860814 000 84');
    expect(String(birthDate.getUTCHours())).toMatch(/22|23/);
  });

  it('should throw on invalid checksum', () => {
    expect(() =>
      nrnUtils.getBirthDate('860814 000 11'),
    ).toThrowErrorMatchingSnapshot();
  });
});

describe('isBiologicalFemale()', () => {
  it('should be true for even serial number', () => {
    expect(nrnUtils.isBiologicalFemale('860814 000 11')).toBe(true);
  });

  it('should be false for odd serial number', () => {
    expect(nrnUtils.isBiologicalFemale('860814 001 11')).toBe(false);
  });
});

describe('isBiologicalMale()', () => {
  it('should be true for odd serial number', () => {
    expect(nrnUtils.isBiologicalMale('860814 001 00')).toBe(true);
  });

  it('should be false for even serial number', () => {
    expect(nrnUtils.isBiologicalMale('860814 000 00')).toBe(false);
  });
});

describe('isEqual()', () => {
  it('should be equal', () => {
    expect(nrnUtils.isEqual('92060600000', '920606 000 00')).toBe(true);
    expect(nrnUtils.isEqual('920606 000 00', '920606 000 00')).toBe(true);
    expect(nrnUtils.isEqual('92.06.06-000.00', '920606 000 00')).toBe(true);
  });

  it('should not be equal', () => {
    expect(nrnUtils.isEqual('92.06.06-000.11', '92060600022')).toBe(false);
  });
});

describe('isLegalAdult()', () => {
  beforeEach(() => {
    timekeeper.freeze(new Date('2018-08-14T05:30:00.000Z'));
  });

  it('should return false if person is not an adult', () => {
    expect(nrnUtils.isLegalAdult('100815 000 39')).toBe(false);
  });

  it('should return true if person is an adult', () => {
    expect(nrnUtils.isLegalAdult('860814 000 84')).toBe(true);
    expect(nrnUtils.isLegalAdult('860813 000 17')).toBe(true);
  });

  afterEach(() => {
    timekeeper.reset();
  });
});

describe('normalize()', () => {
  it('should throw on non-string types', () => {
    expect(() =>
      nrnUtils.normalize(null as any),
    ).toThrowErrorMatchingSnapshot();
    expect(() =>
      nrnUtils.normalize(undefined as any),
    ).toThrowErrorMatchingSnapshot();
  });

  it('should return string from nrn object', () => {
    expect(
      nrnUtils.normalize({
        birthDate: '860814',
        serial: '000',
        checksum: '59',
      }),
    ).toBe('86081400059');
  });

  it('should normalize nrn', () => {
    expect(nrnUtils.normalize('92060600011')).toBe('92060600011');
    expect(nrnUtils.normalize('920606 000 11')).toBe('92060600011');
    expect(nrnUtils.normalize('92.06.06-000.11')).toBe('92060600011');
  });
});

describe('parse()', () => {
  // Implicitely tested through other utils.
  // Only testing exceptional code paths.

  it('should throw if invalid format', () => {
    expect(() => nrnUtils.parse('-')).toThrowErrorMatchingSnapshot();
  });

  it('should return valid nrn object', () => {
    expect(
      nrnUtils.parse({ birthDate: '860814', serial: '000', checksum: '11' }),
    ).toEqual({ birthDate: '860814', serial: '000', checksum: '11' });
  });

  it('should throw on invalid type', () => {
    expect(() => nrnUtils.parse(null as any)).toThrowErrorMatchingSnapshot();
  });
});
