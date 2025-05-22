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

    it('should push the D register onto the stack', () => {
        expectAssembly(
            build().pushD(),
            [
                '@SP',
                'A=M',
                'M=D',
                '@SP',
                'M=M+1',
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
                'A=M',
                'M=D',
                '@SP',
                'M=M+1',
            ],
        );
    });

    it('should assign 0, 1, or -1 to a label value', () => {
        const tests = [0, 1, -1];

        for (const test of tests) {
            expectAssembly(
                build().intToLbl(test, 'myValue'),
                [
                    '@myValue',
                    `M=${test}`,
                ],
            );
        }
    });

    it('should assign a positive value greater than 1 to a label value', () => {
        expectAssembly(
            build().intToLbl(4, 'myValue'),
            [
                '@4',
                'D=A',
                '@myValue',
                'M=D',
            ],
        );
    });

    it('should assign a negative value less than -1 to a label value', () => {
        expectAssembly(
            build().intToLbl(-4, 'myValue'),
            [
                '@4',
                'D=-A',
                '@myValue',
                'M=D',
            ],
        );
    });

    it('should assign 0, 1, or -1 to a pointer value', () => {
        const tests = [0, 1, -1];

        for (const test of tests) {
            expectAssembly(
                build().intToPtr(test, 'myValue'),
                [
                    '@myValue',
                    'A=M',
                    `M=${test}`,
                ],
            );
        }
    });

    it('should assign a positive value greater than 1 to a pointer value', () => {
        expectAssembly(
            build().intToPtr(4, 'myValue'),
            [
                '@4',
                'D=A',
                '@myValue',
                'A=M',
                'M=D',
            ],
        );
    });

    it('should assign a negative value less than -1 to a pointer value', () => {
        expectAssembly(
            build().intToPtr(-4, 'myValue'),
            [
                '@4',
                'D=-A',
                '@myValue',
                'A=M',
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
                    'A=M',
                    `M=${test}`,
                    '@SP',
                    'M=M+1',
                ],
            );
        }
    });

    it('should push a larger positive integer onto the stack', () => {
        expectAssembly(
            build().pushInt(4),
            [
                '@4',
                'D=A',
                '@SP',
                'A=M',
                'M=D',
                '@SP',
                'M=M+1',
            ],
        );
    });

    it('should push a larger negative integer onto the stack', () => {
        expectAssembly(
            build().pushInt(-4),
            [
                '@4',
                'D=-A',
                '@SP',
                'A=M',
                'M=D',
                '@SP',
                'M=M+1',
            ],
        );
    });

    it('should push a boolean value to the stack', () => {
        const tests: [boolean, number][] = [
            [true, -1],
            [false, 0],
        ];

        for (const [value, int] of tests) {
            expectAssembly(
                build().pushBool(value),
                [
                    '@SP',
                    'A=M',
                    `M=${int}`,
                    '@SP',
                    'M=M+1',
                ],
            );
        }
    });

    it('should pop 2 values off the stack and store their difference in the D register', () => {
        expectAssembly(
            build().popDiffToD(),
            [
                '@SP',
                'AM=M-1',
                'D=M',
                '@SP',
                'AM=M-1',
                'D=M-D',
            ],
        );
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