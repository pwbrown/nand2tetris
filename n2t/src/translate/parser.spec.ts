/**
 * Translate Parser Tests
 * Author      : Philip Brown
 * Source Code : https://github.com/pwbrown/nand2tetris/n2t/src/translate/parser.spec.ts
 */

import { Lexer } from '../shared/lexer';
import { ArithmeticCommand, CallCommand, Command, FunctionCommand, GotoCommand, IfCommand, LabelCommand, PushPopCommand, ReturnCommand } from './command';
import { Parser } from './parser';

describe('Translate - Parser', () => {
    it('should parse a function command', () => {
        const tests: [input: string, label: string, local: number][] = [
            ['function Main.main 0', 'Main.main', 0],
            ['function Sys.init$1 10', 'Sys.init$1', 10],
        ];

        for (const [input, label, local] of tests) {
            const commands = parseInputExpectNoErrors(input);
            expect(commands).toHaveLength(1);
            expect(commands[0]).toEqual(functionCmd(label, local));
        }
    });

    it('should not parse a function command with a missing label', () => {
        const tests: string[] = ['function'];

        for (const input of tests) {
            const [commands, errors] = parseInput(input);
            expect(commands).toHaveLength(0);
            expect(errors.length).toBeGreaterThan(0);
        }
    });

    it('should not parse a function command with a missing local number', () => {
        const tests: string[] = ['function Main.main'];

        for (const input of tests) {
            const [commands, errors] = parseInput(input);
            expect(commands).toHaveLength(0);
            expect(errors.length).toBeGreaterThan(0);
        }
    });

    it('should parse a return command', () => {
        const tests: string[] = ['return'];

        for (const input of tests) {
            const commands = parseInputExpectNoErrors(input);
            expect(commands).toHaveLength(1);
            expect(commands[0]).toEqual(returnCmd());
        }
    });

    it('should not parse a return command with extra tokens', () => {
        const tests: string[] = ['return 1'];

        for (const input of tests) {
            const [commands, errors] = parseInput(input);
            expect(commands).toHaveLength(0);
            expect(errors.length).toBeGreaterThan(0);
        }
    });

    it('should parse a label command', () => {
        const tests: [input: string, label: string][] = [
            ['label END', 'END'],
            ['label Main.loop', 'Main.loop'],
        ];

        for (const [input, label] of tests) {
            const commands = parseInputExpectNoErrors(input);
            expect(commands).toHaveLength(1);
            expect(commands[0]).toEqual(labelCmd(label));
        }
    });

    it('should not parse a label command without a label', () => {
        const tests: string[] = ['label'];

        for (const input of tests) {
            const [commands, errors] = parseInput(input);
            expect(commands).toHaveLength(0);
            expect(errors.length).toBeGreaterThan(0);
        }
    });

    it('should parse a goto command', () => {
        const tests: [input: string, label: string][] = [
            ['goto END', 'END'],
            ['goto Main.loop', 'Main.loop'],
        ];

        for (const [input, label] of tests) {
            const commands = parseInputExpectNoErrors(input);
            expect(commands).toHaveLength(1);
            expect(commands[0]).toEqual(gotoCmd(label));
        }
    });

    it('should not parse a goto command without a label', () => {
        const tests: string[] = ['goto'];

        for (const input of tests) {
            const [commands, errors] = parseInput(input);
            expect(commands).toHaveLength(0);
            expect(errors.length).toBeGreaterThan(0);
        }
    });

    it('should parse an if-goto command', () => {
        const tests: [input: string, label: string][] = [
            ['if-goto END', 'END'],
            ['if-goto Main.loop', 'Main.loop'],
        ];

        for (const [input, label] of tests) {
            const commands = parseInputExpectNoErrors(input);
            expect(commands).toHaveLength(1);
            expect(commands[0]).toEqual(ifCmd(label));
        }
    });

    it('should not parse a malformed if-goto command', () => {
        const tests: string[] = [
            'if',
            'if-',
            'if-goto',
        ];

        for (const input of tests) {
            const [commands, errors] = parseInput(input);
            expect(commands).toHaveLength(0);
            expect(errors.length).toBeGreaterThan(0);
        }
    });

    it('should parse a call command', () => {
        const tests: [input: string, label: string, AggregateErrorConstructor: number][] = [
            ['call Main.main 0', 'Main.main', 0],
            ['call Sys.init$1 10', 'Sys.init$1', 10],
        ];

        for (const [input, label, args] of tests) {
            const commands = parseInputExpectNoErrors(input);
            expect(commands).toHaveLength(1);
            expect(commands[0]).toEqual(callCmd(label, args));
        }
    });

    it('should not parse a call command with a missing label', () => {
        const tests: string[] = ['call'];

        for (const input of tests) {
            const [commands, errors] = parseInput(input);
            expect(commands).toHaveLength(0);
            expect(errors.length).toBeGreaterThan(0);
        }
    });

    it('should not parse a call command with a missing args number', () => {
        const tests: string[] = ['call Main.main'];

        for (const input of tests) {
            const [commands, errors] = parseInput(input);
            expect(commands).toHaveLength(0);
            expect(errors.length).toBeGreaterThan(0);
        }
    });

    it('should parse an arithmetic command', () => {
        const tests: string[] = [
            'add',
            'sub',
            'neg',
            'eq',
            'gt',
            'lt',
            'and',
            'or',
            'not',
        ];

        for (const input of tests) {
            const commands = parseInputExpectNoErrors(input);
            expect(commands).toHaveLength(1);
            expect(commands[0]).toEqual(arithCmd(input));
        }
    });

    it('should not parse an arithmetic command with extra tokens', () => {
        const tests: string[] = [
            'add 1',
        ];

        for (const input of tests) {
            const [commands, errors] = parseInput(input);
            expect(commands).toHaveLength(0);
            expect(errors.length).toBeGreaterThan(0);
        }
    });

    it('should parse a push command', () => {
        const tests: [input: string, segment: string, operand: number][] = [
            ['push local 1', 'local', 1],
            ['push argument 2', 'argument', 2],
            ['push static 3', 'static', 3],
            ['push constant 4', 'constant', 4],
            ['push this 0', 'this', 0],
            ['push that 1', 'that', 1],
            ['push temp 5', 'temp', 5],
            ['push pointer 0', 'pointer', 0],
        ];

        for (const [input, segment, operand] of tests) {
            const commands = parseInputExpectNoErrors(input);
            expect(commands).toHaveLength(1);
            expect(commands[0]).toEqual(pushPopCmd('push', segment, operand));
        }
    });

    it('should not parse an invalid push command', () => {
        const tests: string[] = [
            'push 1',
            'push local',
            'push blah 1',
            'push local 1 a',
        ];

        for (const input of tests) {
            const [commands, errors] = parseInput(input);
            expect(commands).toHaveLength(0);
            expect(errors.length).toBeGreaterThan(0);
        }
    });

    it('should ignore comments and empty lines and retain original line numbers', () => {
        const input = [
            '',
            '// This is a comment',
            'push local 1 // My local variable',
            'goto END',
            '',
        ].join('\n');

        const expected: Command[] = [
            pushPopCmd('push', 'local', 1, 3),
            gotoCmd('END', 4),
        ];

        const commands = parseInputExpectNoErrors(input);
        for (const [i, inst] of commands.entries()) {
            expect(inst).toEqual(expected[i]);
        }
    });
});

/** Parse the input and return commands and errors */
const parseInput = (input: string): [commands: Command[], errors: string[]] => {
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const instructions = parser.parseCommands();
    return [instructions, parser.getErrors()];
}

/** Return parsed instructions and assert no errors */
const parseInputExpectNoErrors = (input: string) => {
    const [instructions, errors] = parseInput(input);
    expect(errors).toHaveLength(0);
    return instructions;
}

const functionCmd = (name: string, local: number, line = 1): FunctionCommand => ({
    type: 'Function',
    line,
    name,
    local,
});

const returnCmd = (line = 1): ReturnCommand => ({
    type: 'Return',
    line,
});

const labelCmd = (label: string, line = 1): LabelCommand => ({
    type: 'Label',
    line,
    label,
});

const gotoCmd = (label: string, line = 1): GotoCommand => ({
    type: 'Goto',
    line,
    label,
});

const ifCmd = (label: string, line = 1): IfCommand => ({
    type: 'If',
    line,
    label,
});

const callCmd = (name: string, args: number, line = 1): CallCommand => ({
    type: 'Call',
    line,
    name,
    args,
});

const arithCmd = (operator: string, line = 1): ArithmeticCommand => ({
    type: 'Arithmetic',
    line,
    operator,
});

const pushPopCmd = (operator: 'push' | 'pop', segment: string, operand: number, line = 1): PushPopCommand => ({
    type: 'PushPop',
    line,
    operator,
    segment,
    operand,
});


