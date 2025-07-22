/**
 * Hack Builder Tests
 * Author      : Philip Brown
 * Source Code : https://github.com/pwbrown/nand2tetris/n2t/src/translate/hack-builder.spec.ts
 */

import { build, HackBuilder } from "./hack-builder";

describe('Translate - Hack Builder', () => {
    it('should not insert a comment if annotate is disabled', () => {
        expectAssembly(
            build()
                .comment('My cool comment')
                .custom('D=1'),
            [
                'D=1',
            ],
        );
    });

    it('should insert a comment if annotate is enabled with a default prefix', () => {
        expectAssembly(
            build(true)
                .comment('My cool comment')
                .custom('D=1'),
            [
                '// ---- My cool comment',
                'D=1',
            ],
        );
    });

    it('should insert a comment if annotate is enabled with a custom prefix', () => {
        expectAssembly(
            build(true)
                .comment('My cool comment', '')
                .custom('D=1'),
            [
                '// My cool comment',
                'D=1',
            ],
        );
    });

    it('should increment the stack pointer', () => {
        expectAssembly(
            build().incSP(),
            [
                '@SP',
                'M=M+1',
            ],
        );
    });

    it('should increment the stack pointer by 2', () => {
        expectAssembly(
            build().incSP(2),
            [
                '@SP',
                'M=M+1',
                'M=M+1',
            ],
        );
    });

    it('should increment the stack pointer by a value greater than 2', () => {
        const tests = [3, 5, 7];
        for (const test of tests) {
            expectAssembly(
                build().incSP(test),
                [
                    `@${test}`,
                    'D=A',
                    '@SP',
                    'M=D+M',
                ],
            );
        }
    });

    it('should throw an error if incSP is invoked with a value that does not increment', () => {
        const tests = [0, -1, -5];
        for (const test of tests) {
            expect(() => build().incSP(test)).toThrow();
        }
    });

    it('should decrement the stack pointer and assign A to new pointer value', () => {
        expectAssembly(
            build().decSP(),
            [
                '@SP',
                'AM=M-1',
            ],
        );
    });

    it('should assign a label value to the A register with no offset', () => {
        expectAssembly(
            build().lblToA('myLabel'),
            [
                '@myLabel',
                'A=M',
            ],
        );
    });

    it('should assign a label value to the A register with an offset of 1', () => {
        expectAssembly(
            build().lblToA('myLabel', 1),
            [
                '@myLabel',
                'A=M+1',
            ],
        );
    });

    it('should assign a label value to the A register with an offset within the threshold', () => {
        expectAssembly(
            build().lblToA('myLabel', 3, 3),
            [
                '@myLabel',
                'A=M+1',
                'A=A+1',
                'A=A+1',
            ],
        );
    });

    it('should assign a label value to the A register with an offset of -1', () => {
        expectAssembly(
            build().lblToA('myLabel', -1),
            [
                '@myLabel',
                'A=M-1',
            ],
        );
    });

    it('should assign a label value to the A register with a negative offset within the threshold', () => {
        expectAssembly(
            build().lblToA('myLabel', -3, 3),
            [
                '@myLabel',
                'A=M-1',
                'A=A-1',
                'A=A-1',
            ],
        );
    });

    it('should assign a label value to the A register with an offset above the threshold', () => {
        expectAssembly(
            build().lblToA('myLabel', 3),
            [
                '@3',
                'D=A',
                '@myLabel',
                'A=D+M',
            ],
        );
    });

    it('should assign a label value to the A register with a negative offset above the threshold', () => {
        expectAssembly(
            build().lblToA('myLabel', -3),
            [
                '@3',
                'D=A',
                '@myLabel',
                'A=M-D',
            ],
        );
    });

    it('should put the value at a label into the D register', () => {
        expectAssembly(
            build().lblToD('myLabel'),
            [
                '@myLabel',
                'D=M',
            ],
        );
    });

    it('should put the value in the D register into the value at a label', () => {
        expectAssembly(
            build().dToLbl('myLabel'),
            [
                '@myLabel',
                'M=D',
            ],
        );
    });

    it('should put the dereferenced pointer value into the D register', () => {
        expectAssembly(
            build().ptrToD('myLabel'),
            [
                '@myLabel',
                'A=M',
                'D=M',
            ],
        );
    });

    it('should put the dereferenced pointer value into the D register with an offset', () => {
        expectAssembly(
            build().ptrToD('myLabel', -4),
            [
                '@4',
                'D=A',
                '@myLabel',
                'A=M-D',
                'D=M',
            ],
        );
    });

    it('should put the value in the D register into the dereferenced pointer value', () => {
        expectAssembly(
            build().dToPtr('myLabel'),
            [
                '@myLabel',
                'A=M',
                'M=D',
            ],
        );
    });

    it('should push the D register onto the stack', () => {
        expectAssembly(
            build().pushD(),
            [
                '@SP',
                'M=M+1',
                'A=M-1',
                'M=D',
            ],
        );
    });

    it('should pop the stack value into the D register', () => {
        expectAssembly(
            build().popD(),
            [
                '@SP',
                'AM=M-1',
                'D=M',
            ],
        );
    });

    it('should push the value at a label onto the stack', () => {
        expectAssembly(
            build().pushLbl('myValue'),
            [
                '@myValue',
                'D=M',
                '@SP',
                'M=M+1',
                'A=M-1',
                'M=D',
            ],
        );
    });

    it('should push a small integer onto the stack', () => {
        const tests = [-1, 0, 1];

        for (const test of tests) {
            expectAssembly(
                build().pushInt(test),
                [
                    '@SP',
                    'M=M+1',
                    'A=M-1',
                    `M=${test}`,
                ],
            );
        }
    });

    it('should push a 2 onto the stack', () => {
        const tests = [-2, 2];

        for (const test of tests) {
            const isNeg = test < 0;
            expectAssembly(
                build().pushInt(test),
                [
                    '@SP',
                    'M=M+1',
                    'A=M-1',
                    `M=${isNeg ? '-1' : '1'}`,
                    `M=M${isNeg ? '-' : '+'}1`,
                ],
            );
        }
    });

    it('should push a larger integer onto the stack', () => {
        const tests = [5, -6, 10, -4];
        
        for (const test of tests) {
            const posTest = Math.abs(test);
            const isNeg = test < 0;
            expectAssembly(
                build().pushInt(test),
                [
                    `@${posTest}`,
                    `D=${isNeg ? '-' : ''}A`,
                    '@SP',
                    'M=M+1',
                    'A=M-1',
                    `M=D`,                
                ],
            );
        }
    });

    it('should perform an unconditional goto', () => {
        expectAssembly(
            build().goto('END'),
            [
                '@END',
                '0;JMP',
            ],
        );
    });

    it('should generate a label', () => {
        expectAssembly(
            build().label('END'),
            ['(END)'],
        );
    });
});

const expectAssembly = (builder: HackBuilder, expected: string[]) => {
    expect(builder.toString()).toBe(expected.join('\n'));
}