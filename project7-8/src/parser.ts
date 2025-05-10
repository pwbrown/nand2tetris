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

/** Label Command */
export interface LabelCommand {
  type: 'Label';
  label: string;
}

/** Goto Command */
export interface GotoCommand {
  type: 'Goto';
  label: string;
}

/** If-goto Command */
export interface IfCommand {
  type: 'If';
  label: string;
}

/** Call Command */
export interface CallCommand {
  type: 'Call';
  name: string;
  args: number;
}

/** Function Command */
export interface FunctionCommand {
  type: 'Function';
  name: string;
  local: number;
}

/** Return Command */
export interface ReturnCommand {
  type: 'Return';
}

/** Combined instruction type */
export type Command =
  ArithmeticCommand |
  PushPopCommand |
  LabelCommand |
  GotoCommand |
  IfCommand |
  CallCommand |
  FunctionCommand |
  ReturnCommand;

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
  switch(first) {
    case 'label':
      return parseLabelCommand(words);
    case 'goto':
      return parseGotoCommand(words);
    case 'if-goto':
      return parseIfCommand(words);
    case 'call':
      return parseCallCommand(words);
    case 'function':
      return parseFunctionCommand(words);
    case 'return':
      return { type: 'Return' };
    default:
      if (ARITHMETIC_OPERATOR[first]) {
        return { type: 'Arithmetic', operator: first };
      } else if (PUSH_POP_OPERATOR[first]) {
        return parsePushPopCommand(words);
      } else {
        throw new Error(`Unrecognized command: '${first}'`);
      }
  }
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

/** Parses a label command */
const parseLabelCommand = (words: string[]): LabelCommand => {
  const label = words[1];
  /** Validate label */
  if (!label) {
    throw new Error(`Error parsing Label command: Missing label`);
  }
  return { type: 'Label', label };
}

/** Parses a goto command */
const parseGotoCommand = (words: string[]): GotoCommand => {
  const label = words[1];
  /** Validate label */
  if (!label) {
    throw new Error(`Error parsing Goto command: Missing label`);
  }
  return { type: 'Goto', label };
}

/** Parses an if command */
const parseIfCommand = (words: string[]): IfCommand => {
  const label = words[1];
  /** Validate label */
  if (!label) {
    throw new Error(`Error parsing If command: Missing label`);
  }
  return { type: 'If', label };
}

/** Parses a call command */
const parseCallCommand = (words: string[]): CallCommand => {
  const [name, argsStr] = words.slice(1);
  /** Validate name */
  if (!name) {
    throw new Error(`Error parsing Call command: Missing function name`);
  }
  /** Validate arguments count */
  const args = argsStr ? parseInt(argsStr, 10) : null;
  if (args === null || isNaN(args) || args < 0) {
    throw new Error(`Error parsing Call command: Invalid args number '${argsStr}`);
  }
  return { type: 'Call', name, args };
}

/** Parses a function command */
const parseFunctionCommand = (words: string[]): FunctionCommand => {
  const [name, localStr] = words.slice(1);
  /** Validate name */
  if (!name) {
    throw new Error(`Error parsing Function command: Missing function name`);
  }
  /** Validate local count */
  const local = localStr ? parseInt(localStr, 10) : null;
  if (local === null || isNaN(local) || local < 0) {
    throw new Error(`Error parsing Call command: Invalid local number '${localStr}`);
  }
  return { type: 'Function', name, local };
}