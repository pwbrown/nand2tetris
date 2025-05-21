/**
 * Assembly Writer
 * Author      : Philip Brown
 * Source Code : https://github.com/pwbrown/nand2tetris/n2t/src/assemble/writer.ts
 */

import { BaseWriter } from '../shared/base-writer';
import { Instruction } from './instruction';
import { RESERVED_SYMBOL } from './constants';

export class Writer extends BaseWriter {
    private symbolsProcessed = false;

    /** Symbol Tracking */
    private symbolMap = new Map<string, string>();
    private pendingSymbols = new Set<string>();

    constructor(
        private instructions: Instruction[],
        outputFile: string,
    ) {
        super(outputFile);
        /** Initialize symbol map with reserved symbols */
        Object.entries(RESERVED_SYMBOL).forEach(([sym, addrNum]) => {
            this.symbolMap.set(sym, toBinaryAddress(addrNum));
        });
    }

    /** Iterates through all instructions to build the symbol map */
    public buildSymbolMap() {
        /** Track the current instruction line number for labels */
        let line = 0;
        
        /** Iterate through all instructions to process label instructions and add pending symbols */
        for (const instruction of this.instructions) {
            if (instruction.type === 'L') {
                this.symbolMap.set(instruction.label, toBinaryAddress(line));
            } else {
                if (
                    instruction.type === 'A' &&
                    typeof instruction.addr === 'string' &&
                    !this.symbolMap.has(instruction.addr)
                ) {
                    this.pendingSymbols.add(instruction.addr);
                }
                /** increment line count for all non label instructions */
                line += 1;
            }
        }

        /** Process pending symbols */
        let addr = 16;
        for (const symbol of this.pendingSymbols) {
            if (!this.symbolMap.has(symbol)) {
                this.symbolMap.set(symbol, toBinaryAddress(addr));
                addr += 1;
            }
        }

        this.pendingSymbols.clear();
        this.symbolsProcessed = true;
    }

    /** Iterates through all the instructions to write the final assembly */
    public async writeAssembly() {
        if (!this.symbolsProcessed) {
            throw new Error('Must call buildSymbolMap before writeAssembly');
        }

        for (const instruction of this.instructions) {
            switch(instruction.type) {
                case 'A':
                    const addrBin = typeof instruction.addr === 'string'
                        ? this.symbolMap.get(instruction.addr)!
                        : toBinaryAddress(instruction.addr);
                    this.writeLine(`0${addrBin}`);
                    break;
                case 'C':
                    const cBin = `111${instruction.compBin}${instruction.destBin}${instruction.jumpBin}`;
                    this.writeLine(cBin);
                    break;
            }
        }

        /** Close the output file */
        const linesWritten = await this.closeOutput();
        return linesWritten;
    }
}

/**
 * Converts a decimal number into a binary string (w/ optional padding)
 * @param num number to convert
 * @param length target length of the final binary string (0's added as left padding)
 * @returns binary string
 */
const toBinaryAddress = (num: number, length = 15) => {
  const binStr = num.toString(2);
  if (typeof length === 'number' && length > binStr.length) {
    return binStr.padStart(length, '0');
  }
  return binStr;
};