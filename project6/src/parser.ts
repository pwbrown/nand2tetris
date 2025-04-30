import { RESERVED_SYMBOL, MAX_ADDRESS, COMPUTATION, JUMP } from './constants';

/** A (Address) Instruction */
export interface AInstruction {
  type: 'A',
  addr: string | number;
}

/** C (Computation) Instruction */
export interface CInstruction {
  type: 'C';
  dest: string | null;
  destBin: string;
  comp: string;
  compBin: string;
  jump: string | null;
  jumpBin: string;
}

/** L (Label) Instruction */
export interface LInstruction {
  type: 'L';
  label: string;
}

/** Combined instruction type */
export type Instruction = AInstruction | CInstruction | LInstruction;

/** Parse a complete instruction line */
export const parseLine = (line: string): Instruction | null => {
  /** Clean up the line by removing comments and trimming whitespace */
  line = line.split('//')[0].trim();
  /** Ignore empty lines */
  if (!line) {
    return null;
  }
  /** Check the first character to decide what type of instruction it is */
  switch(line[0]) {
    case '(':
      return parseLInstruction(line);
    case '@':
      return parseAInstruction(line);
    default:
      return parseCInstruction(line);
  }
}

/** Parse an L (Label) instruction */
export const parseLInstruction = (line: string): LInstruction => {
  const end = line.length - 1;
  if (line[end] !== ')') {
    throw new Error('Label Error: missing closing paren!');
  }
  /** Find the identifier between the opening and closing parens */
  const label = line.substring(1, end).trim();
  if (!label) {
    throw new Error('Label Error: label cannot be empty!')
  } else if (RESERVED_SYMBOL[label]) {
    throw new Error(`Label Error: cannot use the reserved symbol '${label}' as a label`);
  } else {
    return { type: 'L', label };
  }
}

/** Parse an A (Address) Instruction */
export const parseAInstruction = (line: string): AInstruction => {
  const addrStr = line.substring(1); // ignore the '@' character
  /** Attempt to parse the string as an integer */
  const addrNum = parseInt(addrStr, 10);
  if (!isNaN(addrNum)) {
    if (addrNum < 0) {
      throw new Error('A Instruction Error: cannot use a negative address');
    } else if (addrNum > MAX_ADDRESS) {
      throw new Error(`A Instruction Error: cannot exceed the maximum memory address ${MAX_ADDRESS}`);
    }
    return { type: 'A', addr: addrNum };
  } else {
    return { type: 'A', addr: addrStr };
  }
}

/** Parses a C (Computation) Instruction */
export const parseCInstruction = (line: string): CInstruction => {
  const semiSplit = line.split(';').map((v) => v.trim());
  const eqSplit = semiSplit[0].split('=').map((v) => v.trim());
  /** Process Destination */
  let dest: string | null = null;
  let destBin = '000';
  if (eqSplit.length === 2 && eqSplit[0] !== 'null') {
    const destStr = eqSplit[0];
    const hasA = destStr.includes('A');
    const hasM = destStr.includes('M');
    const hasD = destStr.includes('D');
    if (!hasA && !hasM && !hasD) {
      throw new Error('C Instruction Error: invalid destination');
    }
    dest = `${hasA ? 'A' : ''}${hasM ? 'M' : ''}${hasD ? 'D' : ''}` || null;
    destBin = `${hasA ? '1' : '0'}${hasD ? '1' : '0'}${hasM ? '1' : '0'}`;
  }
  /** Process Comp */
  const comp = (eqSplit.length === 2 ? eqSplit[1] : eqSplit[0]).replace(/ /g, '');
  if (!comp) {
    throw new Error('C Instruction Error: computation must be included');
  }
  const compBin = COMPUTATION[comp];
  if (!compBin) {
    throw new Error(`C Instruction Error: invalid compute string '${comp}'`);
  }
  /** Process jump */
  let jump: string | null = null;
  let jumpBin = '000';
  if (semiSplit.length === 2) {
    jump = semiSplit[1];
    jumpBin = JUMP[jump];
    if (!jump || !JUMP[jump]) {
      throw new Error(`C Instruction Error: invalid jump command '${jump}'`);
    }
  }

  /** Final instruction */
  return {
    type: 'C',
    dest,
    destBin,
    comp,
    compBin,
    jump,
    jumpBin,
  };
}