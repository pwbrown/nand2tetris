/**
 * VM Command
 * Author      : Philip Brown
 * Source Code : https://github.com/pwbrown/nand2tetris/n2t/src/translate/command.ts
 */

/** Arithmetic Command (ex. add, sub, neg) */
export interface ArithmeticCommand {
    type: 'Arithmetic';
    line: number;
    operator: string;
}

/** Push/Pop Command (ex. push constant 1, pop static 0)*/
export interface PushPopCommand {
    type: 'PushPop';
    line: number;
    operator: string;
    segment: string;
    operand: number;
}

/** Label Command (ex. label STOP) */
export interface LabelCommand {
    type: 'Label';
    line: number;
    label: string;
}

/** Goto Command (ex. goto STOP) */
export interface GotoCommand {
  type: 'Goto';
  line: number;
  label: string;
}

/** If-goto Command (ex. if-goto STOP) */
export interface IfCommand {
  type: 'If';
  line: number;
  label: string;
}

/** Call Command (ex. call Main.main 0) */
export interface CallCommand {
  type: 'Call';
  line: number;
  name: string;
  args: number;
}

/** Function Command (ex. function Main.main 0) */
export interface FunctionCommand {
  type: 'Function';
  line: number;
  name: string;
  local: number;
}

/** Return Command (ex. return) */
export interface ReturnCommand {
  type: 'Return';
  line: number;
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