/**
 * Author: Philip Brown
 * Language: TypeScript
 * Source Code: https://github.com/pwbrown/n2t/tree/main/project7/src/translate.ts
 */

import { createWriteStream } from "node:fs";
import { ArithmeticCommand, Command, PushPopCommand } from "./parser";
import { MEMORY_SEGMENT } from "./constants";
import { once } from "node:events";

/** Maximum index value for direct addressing while popping */
const POP_DIRECT_ADDR_MAX = 0;

/** Register to use when storing pop command addresses */
const POP_TEMP_REGISTER = 13;

/**
 * Translate a list of VM commands and write them to an output file as assembly
 * @param commands list of parsed VM commands
 * @param name name of the input file without the extension (used for static segment)
 * @param outputFile path to the output file
 * @param options command line options object
 */
export const translateAndWrite = async (
  commands: Command[],
  name: string,
  outputFile: string,
  options: { [opt: string]: boolean },
) => {
  /** Setup the output file writer */
  const outputWriter = createWriteStream(outputFile, { encoding: 'utf-8' });

  /** Options */
  const annotate = !!options['annotate']; // If the original command should be prepended as a comment before each block of assembly

  let firstLine = true;

  /** Iterate through each command and generate the assembly code  */
  for (const [index, command] of commands.entries()) {
    const translation = translateCommand(command, index, name);
    if (firstLine) {
      firstLine = false;
    } else {
      outputWriter.write('\n');
    }
    if (annotate) {
      outputWriter.write(`// ${translation.original}\n`);
    }
    outputWriter.write(translation.assembly.join('\n'));
  }

  /** Stop writing to the file and wait for it to close */
  outputWriter.end();
  await once(outputWriter, 'close');
}

/** The return type of the translate command functions */
interface Translation {
  /** Line(s) of assembly code associated with the command */
  assembly: string[];
  /** Original command string for writing optional comments in the final assembly */
  original: string;
}

/** Translate a VM command */
const translateCommand = (command: Command, index: number, name: string): Translation => {
  switch(command.type) {
    case 'Arithmetic':
      return translateArithmeticCommand(command, index);
    case 'PushPop':
      if (command.operator === 'push') {
        return translatePushCommand(command, name);
      } else {
        return translatePopCommand(command, name);
      }
    default:
      throw new Error('Silly boy: you need to add a new command type handler');
  }
}

/**
 * Translate a Push Command
 * Flow:
 *  addr=SEG+i, RAM[SP] = RAM[addr], SP++
 */
const translatePushCommand = (command: PushPopCommand, name: string): Translation => {
  const { operator, segment, operand } = command;

  return {
    original: `${operator} ${segment} ${operand}`,
    assembly: [
      // D = segment value (depends on segment)
      ...setDRegToSegmentValue(segment, operand, name),
      // RAM[SP] = D, SP++
      ...pushFromDRegister(),
    ]
  }
};

/** Translate a Pop Command */
const translatePopCommand = (command: PushPopCommand, name: string): Translation => {
  const { operator, segment, operand } = command;

  if (segment === 'constant') {
    throw new Error('Translate Error: Cannot pop from the \'constant\' segment');
  }

  /** Check operand (i) value */
  const iNum = parseInt(operand, 10);
  if (isNaN(iNum) || iNum < 0) {
    return throwInvalidIndexError(operand, segment, '>= 0');
  }

  return {
    original: `${operator} ${segment} ${operand}`,
    assembly: [
      // RAM[13] = RAM[SEGMENT_ADDR + i] --or-- N/A
      ...storeSegmentAddrOrBypass(segment, iNum, name),
      // SP--, D = RAM[SP]
      ...popToDRegister(),
      // A = SEGMENT_ADDR_WITH_OFFSET
      ...recoverSegmentAddrToA(segment, iNum, name),
      // M = D
      'M=D'
    ],
  } 
};

/** Translate an Arithmetic command (ex. add, sub, neg, etc.) */
const translateArithmeticCommand = (command: ArithmeticCommand, index: number): Translation => {
  const { operator } = command;

  /** Setup assembly variable */
  let assembly: string[];

  switch(operator) {
    /** Add top 2 stack values */
    case 'add':
      assembly = [
        // SP--, D = RAM[SP]
        ...popToDRegister(),
        // SP--
        ...decrementStackPointer(),
        // D = D + RAM[SP]
        'D=D+M',
        // RAM[SP] = D, SP++
        ...pushFromDRegister(),
      ];
      break;
    /** Subtract top 2 stack values */
    case 'sub':
      assembly = [
        // SP--, D = RAM[SP]
        ...popToDRegister(),
        // SP--
        ...decrementStackPointer(),
        // D = RAM[SP] - D
        'D=M-D',
        // RAM[SP] = D, SP++
        ...pushFromDRegister(),
      ];
      break;
    /** Get negative of top stack value */
    case 'neg':
      assembly = [
        // SP--
        ...decrementStackPointer(),
        // D = -RAM[SP]
        'D=-M',
        // RAM[SP] = D, SP++
        ...pushFromDRegister(),
      ];
      break;
    /** Equality operator */
    case 'eq':
      assembly = [
        // SP--, D = RAM[SP]
        ...popToDRegister(),
        // SP--
        ...decrementStackPointer(),
        // D = D - RAM[SP]
        'D=D-M',
        // if (d == 0) push true else push false
        ...pushBooleanOnDCondition(operator, index),
      ];
      break;
    /** Greater than operator */
    case 'gt':
      assembly = [
        // SP--, D = RAM[SP]
        ...popToDRegister(),
        // SP--
        ...decrementStackPointer(),
        // D = RAM[SP] - D
        'D=M-D',
        // if (d > 0) push true else push false
        ...pushBooleanOnDCondition(operator, index),
      ];
      break;
    /** Less than operator */
    case 'lt':
      assembly = [
        // SP--, D = RAM[SP]
        ...popToDRegister(),
        // SP--
        ...decrementStackPointer(),
        // D = D - RAM[SP]
        'D=M-D',
        // if (d < 0) push true else push false
        ...pushBooleanOnDCondition(operator, index),
      ];
      break;
    /** And operation */
    case 'and':
      assembly = [
        // SP--, D = RAM[SP]
        ...popToDRegister(),
        // SP--
        ...decrementStackPointer(),
        // D = D & RAM[SP]
        'D=D&M',
        // RAM[SP] = D, SP++
        ...pushFromDRegister(),
      ];
      break;
    /** Or operation */
    case 'or':
      assembly = [
        // SP--, D = RAM[SP]
        ...popToDRegister(),
        // SP--
        ...decrementStackPointer(),
        // D = D | RAM[SP]
        'D=D|M',
        // RAM[SP] = D, SP++
        ...pushFromDRegister(),
      ];
      break;
    /** Not operation */
    case 'not':
      assembly = [
        // SP--
        ...decrementStackPointer(),
        // D = !RAM[SP]
        'D=!M',
        // RAM[SP] = D, SP++
        ...pushFromDRegister(),
      ];
      break;
    default:
      throw new Error(`Translation Error: Unrecognized arithmetic operator '${operator}'`);
  }

  return {
    original: `${operator}`,
    assembly,
  }
};

/** Throws an invalid index error for a segment */
const throwInvalidIndexError = (
  i: string | number,
  segment: string,
  format: string,
): never => {
  throw new Error(
    `Translation Error: Invalid index '${i}' for segment '${segment}' (Must be ${format})`
  ); 
}

/************************* ASSEMBLY UTILITIES ***************************/

/** Increment the Stack Pointer */
const incrementStackPointer = (): string[] => [
  // SP++
  '@SP',
  'M=M+1',
];

/** Decrement the Stack Pointer and set A to the new SP value */
const decrementStackPointer = (): string[] => [
  // SP--
  '@SP',
  'AM=M-1',
];

/** Push the value of the D register to the stack and increment SP */
const pushFromDRegister = (): string[] => [
  // RAM[SP] = D
  '@SP',
  'A=M',
  'M=D',
  // SP++
  ...incrementStackPointer(),
];

/** Decrements the SP and puts the value at the new SP into the D-Register */
const popToDRegister = (): string[] => [
  // SP--, A = SP
  ...decrementStackPointer(),
  // D = RAM[SP]
  'D=M'
];

/** Push a boolean value to the stack (true = -1, false = 0) */
const pushBoolean = (value: boolean): string[] => [
  // RAM[SP] = (-1 | 0)
  '@SP',
  'A=M',
  `M=${value ? -1 : 0}`,
  // SP++
  ...incrementStackPointer(),
];

/** Goto a label */
const goto = (label: string): string[] => [
  `@${label}`,
  '0;JMP',
];

/** Pushes a boolean value onto the stack based on the condition of the D register */
const pushBooleanOnDCondition = (op: string, index: number): string[] => [
  // if (D (eq|lt|gt) 0) goto opLabel
  `@${op}_${index}`,
  `D;J${op.toUpperCase()}`,
  // else push false and goto end label
  ...pushBoolean(false),
  ...goto(`end_${index}`),
  // push true
  `(${op}_${index})`,
  ...pushBoolean(true),
  // end
  `(end_${index})`,
];

/**
 * Returns the assembly code that sets the D register value to the
 * value in a memory segment at the given offset
 * @param segment segment name
 * @param i segment offset
 */
const setDRegToSegmentValue = (segment: string, i: string, name: string): string[] => {
  const iNum = parseInt(i, 10);
  
  switch(segment) {
    /** Static segment (create named label and assign value) */
    case 'static':
      return [
        // D = RAM[Foo.i]
        `@${name}.${i}`,
        'D=M',
      ];
    /** Constant segment (assign operand to the D-Register) */
    case 'constant':
      return [
        // D = i
        `@${i}`,
        'D=A',
      ];
    /** Temp segment (Fixed memory segment at RAM[5 + i] up to RAM[12]) */
    case 'temp':
      if (isNaN(iNum) || iNum < 0 || iNum > 7) {
        return throwInvalidIndexError(i, segment, '0-7');
      }
      return [
        // D = RAM[5 + i]
        `@R${5 + iNum}`,
        'D=M',
      ];
    /** Pointer segment (Index 0 = THIS, Index 1 = THAT) */
    case 'pointer':
      if (i !== '0' && i !== '1') {
        return throwInvalidIndexError(i, segment, '0 or 1');
      }
      const label = i === '0' ? 'THIS' : 'THAT';
      return [
        // D = RAM[THIS|THAT]
        `@${label}`,
        'D=M',
      ];
    /** All other segments (Associated with labeled address as base) */
    default:
      if (isNaN(iNum) || iNum < 0) {
        return throwInvalidIndexError(i, segment, '>= 0');
      } else if (iNum <= 2) {
        /** For small offsets, just increment A directly (3-4 steps) */
        return [
          // A = SEGMENT_POINTER
          `@${MEMORY_SEGMENT[segment]}`,
          // A = RAM[SEGMENT_POINTER + (0 or 1)]
          `A=M${iNum > 0 ? '+1' : ''}`,
          // Optional: A = RAM[SEGMENT_POINTER + 2]
          ...(iNum === 2 ? ['A=A+1'] : []),
          // D = RAM[SEGMENT_POINTER + i]
          'D=M',
        ];
      } else {
        /** For larger offsets, calculate the offset (5 steps) */
        return [
          // D = i
          `@${i}`,
          `D=A`,
          // D = RAM[D + segmentPointer]
          `@${MEMORY_SEGMENT[segment]}`,
          `A=D+M`,
          `D=M`
        ];
      }
  }
}

/**
 * Stores the calculated segment address in a register or returns
 * no commands if the address does not need to be stored
 */
const storeSegmentAddrOrBypass = (segment: string, i: number, name: string): string[] => {
  switch(segment) {
    /** These virtual segments do not need to be stored */
    case 'static':
    case 'temp':
    case 'pointer':
      return [];
    /** Handle segments with a pointer label */
    default:
      /** An index value under this threshold can be manually recovered with less steps */
      if (i <= POP_DIRECT_ADDR_MAX) {
        return [];
      } else {
        return [
          // D = i
          `@${i}`,
          'D=A',
          // D = D + segmentPointer
          `@${MEMORY_SEGMENT[segment]}`,
          `D=D+M`,
          // RAM[POP_TEMP_REGISTER] = D
          `@R${POP_TEMP_REGISTER}`,
          'M=D',
        ];
      }
  }
}

const recoverSegmentAddrToA = (segment: string, i: number, name: string): string[] => {
  switch(segment) {
    /** Access static address directly */
    case 'static':
      return [
        // A = Foo.i
        `@${name}.${i}`,
      ];
    /** Access temp address directly */
    case 'temp':
      if (i < 0 || i > 7) {
        return throwInvalidIndexError(i, segment, '0-7');
      }
      return [
        // A = 5 + i
        `@R${5 + i}`,
      ];
    /** Access pointer address directly */
    case 'pointer':
      if (i < 0 || i > 1) {
        return throwInvalidIndexError(i, segment, '0 or 1');
      }
      return [
        // A = THIS|THAT
        `@${!i ? 'THIS' : 'THAT'}`,
      ];
    /** Handle other segments based on the max index setting */
    default:
      if (i <= POP_DIRECT_ADDR_MAX) {
        /** Increment A as many times as needed based on the max */
        return [
          // A = RAM[SEG_ADDR + (0 or 1)]
          `@${MEMORY_SEGMENT[segment]}`,
          `A=M${i > 0 ? '+1' : ''}`,
          // A = A + 1 (for i > 1)
          ...(i > 1 ? Array(i - 1).fill('A=A+1') : []),
        ];
      } else {
        /** Recover the stored address */
        return [
          // A = RAM[POP_TEMP_REGISTER]
          `@R${POP_TEMP_REGISTER}`,
          'A=M',
        ];
      }
  }
}