# be-nrn

Belgian NRN (National Registry Number) utility functions.

## Quick start

```sh
npm install be-nrn
```

```js
import { getAge } from 'be-nrn';

getAge('860814 000 00'); // => 32 (at time of writing)
```

## API

**NOTE:** All NRN input strings are normalized

### `getAge(nrn: string, options): number`

Get the age of a citizen's NRN.

```js
getAge('860814 000 00'); // => 32 (at time of writing)
```

Age calculation is based on midnight in the Brussels timezone, regardless of the timezone in which the code is run.

#### options

* `comparisonDate: Date` – get the age on a specific date

### `getBirthDate(nrn: string): Date`

Get the birth date of a citizen's NRN.

```js
getBirthDate('860814 000 00'); // => 1986-08-13T22:00:00.000Z
```

The birth date's time is set to midnight in the Brussels timezone, regardless of the timezone in which the code is run.

### `isBiologicalFemale(nrn: string): boolean`

Determine if the biological birth gender of a citizen's NRN is female.

```js
isBiologicalFemale('860814 000 00'); // => true
```

### `isBiologicalMale(nrn: string): boolean`

Determine if the biological birth gender of a citizen's NRN is male.

```js
isBiologicalMale('860814 001 00'); // => true
```

### `isEqual(nrn1: string, nrn2: string): boolean`

Compare two NRN's for equality.

```js
isEqual('860814 000 00', '86.08.14-000.00'); // => true
```

### `isLegalAdult(nrn: string): boolean`

Determine if a citizen is legal adult.

```js
isLegalAdult('860814 000 00'); // => true
```

### `normalize(nrn: string): string`

Used internally for normalizing nrn strings. All we do is remove non-numeric characters.

```js
normalize('86.08.14-000.84'); // => 86081400084
normalize('860814 000 84'); // => 86081400084
```

### `parse(nrn: string): Nrn`

Used internally for parsing nrn strings. The resulting object can be used as input for all other functions.

```js
parse('86.08.14-000.84');
// => { birthDate: '860814', serial: '000', checksum: '84' }
```
