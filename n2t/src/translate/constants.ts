/**
 * Translate Constants
 * Author      : Philip Brown
 * Source Code : https://github.com/pwbrown/nand2tetris/n2t/src/translate/constants.ts
 */
/** Available arithmetic operators */
export const ARITHMETIC_OPERATOR: { [op: string]: string } = {
  add: 'add',
  sub: 'sub',
  neg: 'neg',
  eq: 'eq',
  gt: 'gt',
  lt: 'lt',
  and: 'and',
  or: 'or',
  not: 'not',
}

/** Push/pop operators */
export const PUSH_POP_OPERATOR: { [op: string]: string } = {
  push: 'push',
  pop: 'pop',
}

/** Available memory segments and their associated assembly pointer symbol */
export const MEMORY_SEGMENT: { [seg: string]: string } = {
  local: 'LCL',
  argument: 'ARG',
  static: 'N/A',
  constant: 'N/A',
  this: 'THIS',
  that: 'THAT',
  temp: 'N/A',
  pointer: 'N/A',
}