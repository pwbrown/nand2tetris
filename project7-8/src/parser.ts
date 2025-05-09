/**
 * Author: Philip Brown
 * Language: TypeScript
 * Source Code: https://github.com/pwbrown/n2t/tree/main/project7/src/parser.ts
 */

import { ARITHMETIC_OPERATOR, MEMORY_SEGMENT, PUSH_POP_OPERATOR } from './constants';

/** Arithmetic Command */
export interface ArithmeticCommand {
  type: 'Arithmetic';
  operator: string;
}

/** Push/Pop Command */
export interface PushPopCommand {
  type: 'PushPop';
  operator: string;
  segment: string;
  operand: string;
}

/** Combined instruction type */
export type Command = ArithmeticCommand | PushPopCommand;

/** Parse a complete command line */
export const parseLine = (line: string): Command | null => {
  /** Clean up the line by removing comments and trimming whitespace */
  line = line.split('//')[0].trim();
  /** Ignore empty lines */
  if (!line) {
    return null;
  }
  /** Parse line into words */
  const words = line.split(/\s+/);
  /** Check the first word to decide what type of instruction it is */
  const first = words[0];
  if (ARITHMETIC_OPERATOR[first]) {
    return parseArithmeticCommand(words);
  } else if (PUSH_POP_OPERATOR[first]) {
    return parsePushPopCommand(words);
  } else {
    throw new Error(`Unrecognized command: '${first}'`);
  }
}

/** Parses an arithmetic command (which is just a single operator word) */
const parseArithmeticCommand = (words: string[]): ArithmeticCommand => {
  return {
    type: 'Arithmetic',
    operator: words[0],
  };
}

/** Parses a push/pop command */
const parsePushPopCommand = (words: string[]): PushPopCommand => {
  const [operator, segment, operand] = words;
  /** Validate segment name */
  if (!segment || !MEMORY_SEGMENT[segment]) {
    throw new Error(`Error parsing PushPop command: Unrecognized segment '${segment || 'NOT_PROVIDED'}'`);
  }
  /** Validate operand */
  if (!operand) {
    throw new Error('Error parsing PushPop command: Missing operand');
  }
  return {
    type: 'PushPop',
    operator,
    segment,
    operand,
  };
}