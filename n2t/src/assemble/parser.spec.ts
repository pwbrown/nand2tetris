/**
 * Assembly Parser Tests
 * Author      : Philip Brown
 * Source Code : https://github.com/pwbrown/nand2tetris/n2t/src/assemble/parser.spec.ts
 */

import { Lexer } from '../shared/lexer';
import { Parser, getDestBin } from './parser';
import { COMPUTATION, JUMP } from './constants';
import { AInstruction, CInstruction, LInstruction, Instruction } from './instruction';

describe('Assemble - Parser', () => {
    it('should parse numeric A Instructions', () => {
        const tests: [input: string, addr: number][] = [
            ['@10', 10],
            ['@2', 2],
        ];

        for (const [input, addr] of tests) {
            const instructions = parseInputExpectNoErrors(input);
            expect(instructions).toHaveLength(1);
            expect(instructions[0]).toEqual(aInst(addr));
        }
    });

    it('should parse label based A Instructions', () => {
        const tests: [input: string, addr: string][] = [
            ['@R10', 'R10'],
            ['@SP', 'SP'],
            ['@Main.Loop', 'Main.Loop'],
            ['@My.absurdly.long+pointless_label', 'My.absurdly.long+pointless_label'],
        ];

        for (const [input, addr] of tests) {
            const instructions = parseInputExpectNoErrors(input);
            expect(instructions).toHaveLength(1);
            expect(instructions[0]).toEqual(aInst(addr));
        }
    });

    it('should return an error for an A instruction with a missing label', () => {
        const [instructions, errors] = parseInput('@');
        expect(instructions.length).toBe(0);
        expect(errors.length).toBe(1);
    });

    it('should return an error for a numeric A instruction if the instruction contains extra tokens', () => {
        const [instructions, errors] = parseInput('@1 a');
        expect(instructions.length).toBe(0);
        expect(errors.length).toBeGreaterThan(0);
    });

    it('should parse L Instructions', () => {
        const tests: [input: string, label: string][] = [
            ['(STOP)', 'STOP'],
            ['(Foo.End)', 'Foo.End'],
            ['(Blah.something$end.0)', 'Blah.something$end.0'],
        ];

        for (const [input, label] of tests) {
            const instructions = parseInputExpectNoErrors(input);
            expect(instructions).toHaveLength(1);
            expect(instructions[0]).toEqual(lInst(label));
        }
    });

    it('should return an error for an L instruction with a missing label', () => {
        const [instructions, errors] = parseInput('()');
        expect(instructions.length).toBe(0);
        expect(errors.length).toBeGreaterThan(0);
    });

    it('should return an error for an L instruction with a missing right paren', () => {
        const [instructions, errors] = parseInput('(STOP');
        expect(instructions.length).toBe(0);
        expect(errors.length).toBeGreaterThan(0);
    });

    it('should return an error for an L instruction with extra tokens', () => {
        const [instructions, errors] = parseInput('(STOP) blah');
        expect(instructions.length).toBe(0);
        expect(errors.length).toBeGreaterThan(0);
    });

    it('should parse a C instruction with ONLY a computation (a waste but valid)', () => {
        const tests: string[] = ['0', '-1', 'D+M', 'M-D'];

        for (const input of tests) {
            const instructions = parseInputExpectNoErrors(input);
            expect(instructions).toHaveLength(1);
            expect(instructions[0]).toEqual(cInst(null, input, null));
        }
    });

    it('should parse a C instruction with computation and a jump string', () => {
        const tests: [input: string, comp: string, jump: string][] = [
            ['0;JMP', '0', 'JMP'],
            ['D;JEQ', 'D', 'JEQ'],
            ['M-D;JLT', 'M-D', 'JLT'],
            ['D+M;JNE', 'D+M', 'JNE'],
        ];

        for (const [input, comp, jump] of tests) {
            const instructions = parseInputExpectNoErrors(input);
            expect(instructions).toHaveLength(1);
            expect(instructions[0]).toEqual(cInst(null, comp, jump));
        }
    });

    it('should parse a C instruction with destination and computation string', () => {
        const tests: [input: string, dest: string, comp: string][] = [
            ['M=D', 'M', 'D'],
            ['AM = D', 'AM', 'D'],
            ['D= 0', 'D', '0'],
            ['ADM=M+1', 'ADM', 'M+1'],
        ];

        for (const [input, dest, comp] of tests) {
            const instructions = parseInputExpectNoErrors(input);
            expect(instructions).toHaveLength(1);
            expect(instructions[0]).toEqual(cInst(dest, comp, null));
        }
    });

    it('should parse a C instruction with destination, computation, and jump string', () => {
        const tests: [input: string, dest: string, comp: string, jump: string][] = [
            ['D=0;JMP', 'D', '0', 'JMP'],
            ['AD=M+1;JGT', 'AD', 'M+1', 'JGT'],
            ['D=A-1;JNE', 'D', 'A-1', 'JNE'],
        ];

        for (const [input, dest, comp, jump] of tests) {
            const instructions = parseInputExpectNoErrors(input);
            expect(instructions).toHaveLength(1);
            expect(instructions[0]).toEqual(cInst(dest, comp, jump));
        }
    });

    it('should not parse a C instruction that has a destination and empty computation string', () => {
        const tests: string[] = ['D=', 'AD='];

        for (const input of tests) {
            const [instructions, errors] = parseInput(input);
            expect(instructions).toHaveLength(0);
            expect(errors.length).toBeGreaterThan(0);
        }
    });

    it('should not parse a C instruction that has an empty computation string and a jump', () => {
        const tests: string[] = [';JMP', ';JEQ'];

        for (const input of tests) {
            const [instructions, errors] = parseInput(input);
            expect(instructions).toHaveLength(0);
            expect(errors.length).toBeGreaterThan(0);
        }
    });

    it('should not parse a C instruction that has a semicolon but no jump string', () => {
        const tests: string[] = ['0;', 'D;'];

        for (const input of tests) {
            const [instructions, errors] = parseInput(input);
            expect(instructions).toHaveLength(0);
            expect(errors.length).toBeGreaterThan(0);
        }
    });

    it('should not parse a C instruction that has extra tokens', () => {
        const tests: string[] = ['0;JMP blah', 'D;JEQ 0'];

        for (const input of tests) {
            const [instructions, errors] = parseInput(input);
            expect(instructions).toHaveLength(0);
            expect(errors.length).toBeGreaterThan(0);
        }
    });

    it('should not parse a C instruction with an invalid computation', () => {
        const tests: string[] = ['M+2'];

        for (const input of tests) {
            const [instructions, errors] = parseInput(input);
            expect(instructions).toHaveLength(0);
            expect(errors.length).toBeGreaterThan(0);
        }
    });

    it('should not parse a C instruction with an invalid jump', () => {
        const tests: string[] = ['0;JUMP'];

        for (const input of tests) {
            const [instructions, errors] = parseInput(input);
            expect(instructions).toHaveLength(0);
            expect(errors.length).toBeGreaterThan(0);
        }
    });

    it('should ignore comments and empty lines and retain original line numbers', () => {
        const input = [
            '',
            '// This is a comment',
            '@10 // My local variable',
            '0;JMP',
            '',
        ].join('\n');

        const expected: Instruction[] = [
            aInst(10, 3),
            cInst(null, '0', 'JMP', 4),
        ];

        const instructions = parseInputExpectNoErrors(input);
        for (const [i, inst] of instructions.entries()) {
            expect(inst).toEqual(expected[i]);
        }
    });
});

/** Parse the input and return instructions and errors */
const parseInput = (input: string): [instructions: Instruction[], errors: string[]] => {
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const instructions = parser.parseInstructions();
    return [instructions, parser.getErrors()];
}

/** Return parsed instructions and assert no errors */
const parseInputExpectNoErrors = (input: string) => {
    const [instructions, errors] = parseInput(input);
    expect(errors).toHaveLength(0);
    return instructions;
}

const cInst = (dest: string | null, comp: string, jump: string | null, line = 1): CInstruction => ({
    type: 'C',
    line,
    dest,
    destBin: getDestBin(dest || 'null'),
    comp,
    compBin: COMPUTATION[comp] || COMPUTATION['null'],
    jump,
    jumpBin: JUMP[jump || 'null'],
});

const aInst = (addr: string | number, line = 1): AInstruction => ({
    type: 'A',
    line,
    addr,
});

const lInst = (label: string, line = 1): LInstruction => ({
    type: 'L',
    line,
    label,
});


