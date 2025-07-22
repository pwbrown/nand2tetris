/**
 * Hack Builder
 * Author      : Philip Brown
 * Source Code : https://github.com/pwbrown/nand2tetris/n2t/src/translate/hack-builder.ts
 */

/** Returns a new HackBuilder */
export const build = (annotate = false) => new HackBuilder(annotate);

/**
 * HackBuilder is a helper class with chainable methods for constructing
 * hack assembly code using commmon patterns
 */
export class HackBuilder {
    private lines: string[] = [];

    constructor(private annotate: boolean) {}

    /** Returns the string version of the final assembly */
    public toString() {
        return this.lines.join('\n');
    }

    /** Appends custom assembly lines */
    public custom(...lines: string[]) {
        this.lines.push(...lines);
        return this;
    }

    /** Appends a comment to the assembly code (if annotate is enabled) */
    public comment(comment: string, prefix = '---- ') {
        if (this.annotate) {
            this.custom(`// ${prefix}${comment}`);
        }
        return this;
    }

    /** Increment the Stack Pointer */
    public incSP(num = 1) {
        if (num < 1) {
            throw new Error('incSP must receive a positive integer greater than 0');
        }
        if (num <= 2) {
            const b = this.custom(
                '@SP',
                'M=M+1',
            );
            if (num > 1) {
                b.custom('M=M+1');
            }
            return b;
        } else {
            return this.custom(
                `@${Math.floor(num)}`,
                'D=A',
                '@SP',
                'M=D+M',
            );
        }
    }

    /** Decrement the Stack Pointer and set A register to new stack pointer */
    public decSP() {
        return this.custom(
            '@SP',
            'AM=M-1',
        );
    }

    /** Put the value at a label into the A register */
    public lblToA(label: string, offset = 0, threshold = 2) {
        /** A instruction can only handle positive numbers so handle negative here */
        const isNeg = offset < 0;
        const op = isNeg ? '-' : '+';
        const posOffset = Math.abs(offset);
        /** Handle offsets equal to or below the threshold */
        if (posOffset <= threshold) {
            this.custom(
                `@${label}`,
                `A=M${posOffset > 0 ? `${op}1` : ''}`,
            );
            /** Manually update A register for offset values above 1 */
            for (let i = 0; i < posOffset - 1; i += 1) {
                this.custom(`A=A${op}1`);
            }
        }
        /** Handle offsets larger than the threshold */
        else {
            this.custom(
                `@${posOffset}`,
                'D=A',
                `@${label}`,
                `A=${isNeg ? 'M-D' : 'D+M'}`,
            );
        }
        return this;
    }

    /** Put the value at a label into the D register */
    public lblToD(label: string) {
        return this.custom(
            `@${label}`,
            'D=M',
        );
    }

    /** Put the value in the D register into the value at a label */
    public dToLbl(label: string) {
        return this.custom(
            `@${label}`,
            'M=D',
        );
    }

    /** Puts the dereferenced pointer value into the D register */
    public ptrToD(label: string, offset = 0) {
        return this
            .lblToA(label, offset)
            .custom('D=M');
    }

    /** Put the D register value into the derefernced pointer value (no offset support) */
    public dToPtr(label: string) {
        return this
            .lblToA(label)
            .custom('M=D');
    }

    /** Push the value in the D register onto the stack */
    public pushD() {
        return this
            .incSP()
            .custom(
                'A=M-1',
                'M=D',
            );
    }

    /** Pop a value off the stack and put it in the D register */
    public popD() {
        return this
            .decSP()
            .custom('D=M');
    }

    /** Push a label value onto the stack */
    public pushLbl(label: string) {
        return this
            .lblToD(label)
            .pushD();
    }

    /** Push a constant value onto the stack (either integer or boolean) */
    public pushInt(value: number) {
        if (value === 0 || value === 1 || value === -1) {
            return this
                .incSP()
                .custom(
                    'A=M-1',
                    `M=${value}`,
                );
        } else {
            const isNeg = value < 0;
            const posVal = Math.abs(value);
            if (posVal === 2) {
                return this
                    .incSP()
                    .custom(
                        'A=M-1',
                        `M=${isNeg ? '-' : ''}1`,
                        `M=M${isNeg ? '-' : '+'}1`
                    )
            } else {
                return this
                    .custom(
                        `@${posVal}`,
                        `D=${isNeg ? '-' : ''}A`,
                    )
                    .incSP()
                    .custom(
                        'A=M-1',
                        'M=D'
                    );
            }
        }
    }

    /** Goto a label */
    public goto(label: string) {
        return this.custom(
            `@${label}`,
            '0;JMP',
        );
    }

    /** Creates a label */
    public label(label: string) {
        return this.custom(`(${label})`);
    }
}