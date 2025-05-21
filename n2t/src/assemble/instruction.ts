/**
 * Assembly Instruction
 * Author      : Philip Brown
 * Source Code : https://github.com/pwbrown/nand2tetris/n2t/src/assemble/instruction.ts
 */

/** Address Instruction */
export interface AInstruction {
    type: 'A';
    line: number;
    addr: string | number;
}

/** Computational Instruction */
export interface CInstruction {
    type: 'C';
    line: number;
    dest: string | null;
    destBin: string;
    comp: string;
    compBin: string;
    jump: string | null;
    jumpBin: string;
}

/** Label Instruction */
export interface LInstruction {
    type: 'L';
    line: number;
    label: string;
}

/** Instruction */
export type Instruction = AInstruction | CInstruction | LInstruction;