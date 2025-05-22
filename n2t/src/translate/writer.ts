/**
 * Translate Code Writer
 * Author      : Philip Brown
 * Source Code : https://github.com/pwbrown/nand2tetris/n2t/src/translate/writer.ts
 */

import { BaseWriter } from '../shared/base-writer';
import { Options } from '../utils';
import { ArithmeticCommand, CallCommand, Command, FunctionCommand, GotoCommand, IfCommand, LabelCommand, PushPopCommand, ReturnCommand } from './command';
import { MEMORY_SEGMENT } from './constants';
import { build, HackBuilder } from './hack-builder';

/** Maximum pop operand value to use for direct addressing (this is just an optimization) */
const POP_DIRECT_ADDR_MAX = 2;

/** Register to use when storing pop command addresses */
const POP_TEMP_REGISTER = 13;

/** Register to use when storing the end frame register */
const END_FRAME_REGISTER = 13;

/** Register to use when storing the return address */
const RETURN_ADDR_REGISTER = 14;

/** Label of the shared return function */
const RETURN_LABEL = 'SharedReturn';

export interface WriterInput {
    name: string;
    commands: Command[];
}

export interface WriterOptions {
    /** List of inputs with their name and parsed commands */
    inputs: WriterInput[];
    /** Output file to generate */
    outputFile: string;
    /** Command line options */
    cliOpts: Options;
    /** Indicates if the bootstrap code should be injected first */
    bootstrap: boolean;
}

export class Writer extends BaseWriter {
    private inputs: WriterInput[];
    private annotate: boolean;
    private bootstrap: boolean;
    private writeReturn = false; // Indicates if the shared return block should be appended
    private inputContext = ''; // Holds the name of the current context
    private functionContext: string | null = null; // Holds the name of the function context
    private labelIndexes: { [label: string]: number } = {}; // Holds next index value for each unique label
    
    constructor(options: WriterOptions) {
        super(options.outputFile);
        this.inputs = options.inputs;
        this.annotate = !!options.cliOpts.annotate;
        this.bootstrap = options.bootstrap;
    }

    /** Primary entrypoint for the writer */
    public async writeAssembly() {
        if (this.bootstrap) {
            this.writeBootstrap();
        }
        
        /** Write the commands from all of the inputs */
        for (const input of this.inputs) {
            /** Update input context */
            this.inputContext = input.name;
            for (const command of input.commands) {
                this.writeCommand(command);
            }
        }

        /** Write the shared return function */
        if (this.writeReturn) {
            this.writeSharedReturn();
        }

        /** Close the output file */
        const linesWritten = await this.closeOutput();
        return linesWritten;
    }

    /** Write a command to the output file (switches based on command type) */
    private writeCommand(command: Command) {
        this.annotateCommand(command);
        if (command.type === 'Arithmetic') {
            this.writeArithmeticCommand(command);
        } else if (command.type === 'Call') {
            this.writeCallCommand(command);
        } else if (command.type === 'Function') {
            this.writeFunctionCommand(command);
        } else if (command.type === 'Goto') {
            this.writeGotoCommand(command);
        } else if (command.type === 'If') {
            this.writeIfCommand(command);
        } else if (command.type === 'Label') {
            this.writeLabelCommand(command);
        } else if (command.type === 'Return') {
            this.writeReturnCommand(command);
        } else if (command.type === 'PushPop') {
            if (command.operator === 'push') {
                this.writePushCommand(command);
            } else {
                this.writePopCommand(command);
            }
        }
    }

    /** Wrapper for hack builder */
    private build() {
        return build(this.annotate);
    }

    /** Initializes a new builder and writes the content to the output file */
    private buildAndWrite(cb: (b: HackBuilder) => HackBuilder) {
        const builder = cb(this.build());
        this.writeLine(builder.toString())
    }

    /** Writes an annotate command  */
    private annotateCommand(command: Command) {
        if (!this.annotate) {
            return;
        }
        let cmdStr = '';
        if (command.type === 'Arithmetic') {
            cmdStr = command.operator;
        } else if (command.type === 'Call') {
            cmdStr = `call ${command.name} ${command.args}`;
        } else if (command.type === 'Function') {
            cmdStr = `function ${command.name} ${command.local}`;
        } else if (command.type === 'Goto') {
            cmdStr = `goto ${command.label}`;
        } else if (command.type === 'If') {
            cmdStr = `if-goto ${command.label}`;
        } else if (command.type === 'Label') {
            cmdStr = `label ${command.label}`;
        } else if (command.type === 'Return') {
            cmdStr = 'return';
        } else if (command.type === 'PushPop') {
            cmdStr = `${command.operator} ${command.segment} ${command.operand}`;
        }
        const context = this.functionContext || this.inputContext;
        this.writeLine(`\n// ${context} (line ${command.line}): '${cmdStr || 'N/A'}'`);
    }

    /** Writes the bootstrap section to the output file */
    private writeBootstrap() {
        this.buildAndWrite((b) => b
            .comment('Bootstrap code', '')
            .comment('initialize stack pointer to address 256')
            .intToLbl(256, 'SP')
            .comment('initialize LCL as -1')
            .intToLbl(-1, 'LCL')
            .comment('initialize ARG as -2')
            .intToLbl(-2, 'ARG')
            .comment('initialize THIS as -3')
            .intToLbl(-3, 'THIS')
            .comment('initialize THAT as -4')
            .intToLbl(-4, 'THAT')
        );
        this.writeCallCommand({
            type: 'Call',
            line: -1,
            name: 'Sys.init',
            args: 0,
        });
    }

    /** Write the shared return function */
    private writeSharedReturn() {
        const endFrame = `R${END_FRAME_REGISTER}`;
        const returnAddr = `R${RETURN_ADDR_REGISTER}`;
        this.buildAndWrite((b) => b
            .label(RETURN_LABEL)
            /** Store end frame and return address in temp registers */
            .comment('store end frame address to a temp register')
            .lblToD('LCL')
            .dToLbl(endFrame)
            .comment('store return address in temp register')
            .ptrToD(endFrame, -5)
            .dToLbl(returnAddr)
            /** Put callee return value on callers's stack and reposition SP */
            .comment('replace caller args with callee return value')
            .popD()
            .dToPtr('ARG')
            .comment('move stack pointer back to the caller')
            .custom(
                `@ARG`,
                'D=M+1',
            )
            .dToLbl('SP')
            /** Restore all pointer values from the caller's frame */
            .comment('restore THAT pointer to the caller')
            .ptrToD(endFrame, -1)
            .dToLbl('THAT')
            .comment('restore THIS pointer to the caller')
            .ptrToD(endFrame, -2)
            .dToLbl('THIS')
            .comment('restore ARG pointer to the caller')
            .ptrToD(endFrame, -3)
            .dToLbl('ARG')
            .comment('restore LCL pointer to the caller')
            .ptrToD(endFrame, -4)
            .dToLbl('LCL')
            /** Goto the return address */
            .comment('goto return address')
            .lblToA(returnAddr)
            .custom('0;JMP')
        );
    }

    /** Write an aritchmetic command to the output file */
    private writeArithmeticCommand(command: ArithmeticCommand) {
        const operator = command.operator;
        const popRh = 'pop right hand (rh) operand';
        const popLh = 'pop left hand (lh) operand';
        const popOp = 'pop the operand';
        const pushRes = 'push result to the stack';
        
        if (operator === 'add') {
            this.buildAndWrite((b) => b
                .comment(popRh)
                .popD()
                .comment(popLh)
                .decSP()
                .comment('calculate (rh + lh)')
                .custom('D=D+M')
                .comment(pushRes)
                .pushD()
            );
        } else if (operator === 'sub') {
            this.buildAndWrite((b) => b
                .comment('pop 2 values from the stack and put difference in D register')
                .popDiffToD()
                .comment(pushRes)
                .pushD()
            );
        } else if (operator === 'neg') {
            this.buildAndWrite((b) => b
                .comment(popOp)
                .decSP()
                .comment('negate the operand')
                .custom('D=-M')
                .comment(pushRes)
                .pushD()
            );
        } else if (operator === 'eq' || operator === 'gt' || operator === 'lt') {
            const trueLabel = this.indexLabel(this.contextLabel(operator));
            const endLabel = this.indexLabel(this.contextLabel(`end_${operator}`));
            this.buildAndWrite((b) => b
                .comment('pop the top 2 stack values and store the difference in the D register')
                .popDiffToD()
                .comment(`if (D ${operator} 0) goto ${trueLabel}`)
                .custom(
                    `@${trueLabel}`,
                    `D;J${operator.toUpperCase()}`,
                )
                .comment(`else push false and goto ${endLabel}`)
                .pushBool(false)
                .goto(endLabel)
                .comment('push true')
                .label(trueLabel)
                .pushBool(true)
                .comment('end of condition')
                .label(endLabel)
            );
        } else if (operator === 'and') {
            this.buildAndWrite((b) => b
                .comment(popRh)
                .popD()
                .comment(popLh)
                .decSP()
                .comment('calculate (rh & lh)')
                .custom('D=D&M')
                .comment(pushRes)
                .pushD()
            );
        } else if (operator === 'or') {
            this.buildAndWrite((b) => b
                .comment(popRh)
                .popD()
                .comment(popLh)
                .decSP()
                .comment('calculate (rh | lh)')
                .custom('D=D|M')
                .comment(pushRes)
                .pushD()
            );
        } else if (operator === 'not') {
            this.buildAndWrite((b) => b
                .comment(popOp)
                .decSP()
                .comment('not (!) the operand')
                .custom('D=!M')
                .comment(pushRes)
                .pushD()
            );
        } else {
            this.throwError(`Unhandled arithmetic operator: ${operator}`, command.line);
        }
    }

    /** Writes a push command to the output file */
    private writePushCommand(command: PushPopCommand) {
        const segment = command.segment;
        const i = command.operand;

        if (segment === 'static') {
            const label = `${this.inputContext}.${i}`;
            this.buildAndWrite((b) => b
                .comment(`set D register to the value at ${label}`)
                .lblToD(label)
                .comment('push the D register to the stack')
                .pushD()
            );
        } else if (segment === 'constant') {
            this.buildAndWrite((b) => b
                .comment(`push the constant value ${i} to the stack`)
                .pushInt(i)
            );
        } else if (segment === 'temp') {
            if (i < 0 || i > 7) {
                return this.throwInvalidIndexError(command, '0-7');
            }
            this.buildAndWrite((b) => b
                .comment(`set D register to the value at R(5 + ${i}) -> R${5 + i}`)
                .lblToD(`R${5 + i}`)
                .comment('push the D register to the stack')
                .pushD()
            );
        } else if (segment === 'pointer') {
            if (i !== 0 && i !== 1) {
                return this.throwInvalidIndexError(command, '0 or 1');
            }
            const label = i === 0 ? 'THIS' : 'THAT';
            this.buildAndWrite((b) => b
                .comment(`set the D register to the value at ${label}`)
                .lblToD(label)
                .comment('push the D register to the stack')
                .pushD()
            );
        } else {
            if (i < 0) {
                return this.throwInvalidIndexError(command, '>= 0');
            }
            const label = MEMORY_SEGMENT[segment];
            this.buildAndWrite((b) => b
                .comment(`set the D register to the value at (${label} + ${i})`)
                .ptrToD(label, i)
                .comment('push the D register to the stack')
                .pushD()
            );
        }
    }

    /** Writes a pop command to the output file */
    private writePopCommand(command: PushPopCommand) {
        const segment = command.segment;
        const i = command.operand;

        if (segment === 'constant') {
            return this.throwError("cannot pop from the 'constant' segment", command.line);
        }

        if (i < 0) {
            return this.throwInvalidIndexError(command, '>= 0');
        }

        if (segment === 'static') {
            const label = `${this.inputContext}.${i}`;
            this.buildAndWrite((b) => b
                .comment('pop value from the stack to the D register')
                .popD()
                .comment(`set value of ${label} to the value in the D register`)
                .dToLbl(label)
            );
        } else if (segment === 'temp') {
            if (i < 0 || i > 7) {
                return this.throwInvalidIndexError(command, '0-7');
            }
            const label = `R${5 + i}`;
            this.buildAndWrite((b) => b
                .comment('pop value from the stack to the D register')
                .popD()
                .comment(`set value of R(5 + ${i}) -> ${label} to the value in the D register`)
                .dToLbl(label)
            );
        } else if (segment === 'pointer') {
            if (i !== 0 && i !== 1) {
                return this.throwInvalidIndexError(command, '0 or 1');
            }
            const label = i === 0 ? 'THIS' : 'THAT';
            this.buildAndWrite((b) => b
                .comment('pop value from the stack to the D register')
                .popD()
                .comment(`set value of ${label} to the value in the D register`)
                .dToLbl(label)
            );
        } else {
            if (i < 0) {
                return this.throwInvalidIndexError(command, '>= 0');
            }
            const label = MEMORY_SEGMENT[segment];

            if (i <= POP_DIRECT_ADDR_MAX) {
                this.buildAndWrite((b) => b
                    .comment('pop value from the stack to the D register')
                    .popD()
                    .comment(`set value of (${label} + ${i}) to the value in the D register`)
                    .lblToA(label, i, POP_DIRECT_ADDR_MAX)
                    .custom('M=D')
                );
            } else {
                const temp = `R${POP_TEMP_REGISTER}`;
                this.buildAndWrite((b) => b
                    .comment(`set the D register to the address at (${label} + ${i})`)
                    .lblToA(label, i, POP_DIRECT_ADDR_MAX)
                    .custom('D=A')
                    .comment(`set the value at the temp register ${temp} to the value in the D register`)
                    .dToLbl(temp)
                    .comment('pop value from the stack into the D register')
                    .popD()
                    .comment(`recover the address stored in the temp register ${temp}`)
                    .lblToA(temp)
                    .comment(`store the popped value to the address at (${label} + ${i})`)
                    .custom('M=D')
                );
            }
        }
    }

    /** Write a label command to the output file */
    private writeLabelCommand(command: LabelCommand) {
        const label = this.contextLabel(command.label);
        this.buildAndWrite((b) => b.label(label));
    }

    /** Write a goto command to the output file */
    private writeGotoCommand(command: GotoCommand) {
        const label = this.contextLabel(command.label);
        this.buildAndWrite((b) => b.goto(label));
    }

    /** Write an if command to the output file */
    private writeIfCommand(command: IfCommand) {
        const label = this.contextLabel(command.label);
        this.buildAndWrite((b) => b
            .comment('pop value off the stack into the D register')
            .popD()
            .comment(`goto ${label} if D is true (not 0)`)
            .custom(
                `@${label}`,
                'D;JNE'
            )
        );
    }

    /** Write a call command to the output file */
    private writeCallCommand(command: CallCommand) {
        const returnLabel = this.indexLabel(`${command.name}$ret`);
        this.buildAndWrite((b) => b
            /** Save caller frame */
            .comment('push return address to the stack')
            .custom(
                `@${returnLabel}`,
                'D=A',
            )
            .pushD()
            .comment('push LCL pointer to the stack')
            .pushLbl('LCL')
            .comment('push ARG pointer to the stack')
            .pushLbl('ARG')
            .comment('push THIS pointer to the stack')
            .pushLbl('THIS')
            .comment('push THIS pointer to the stack')
            .pushLbl('THAT')
            /** Reposition ARG/LCL */
            .comment(`reposition ARG pointer to (SP - frame(5) - args(${command.args}))`)
            .custom(
                `@${5 + command.args}`,
                'D=A',
                '@SP',
                'D=M-D',
            )
            .dToLbl('ARG')
            .comment('reposition LCL pointer to the current SP')
            .lblToD('SP')
            .dToLbl('LCL')
            /** Goto the function and set the return label */
            .comment('goto callee function and set the caller return label')
            .goto(command.name)
            .label(returnLabel)
        );
    }

    /** Write a function command to the output file */
    private writeFunctionCommand(command: FunctionCommand) {
        /** Update the current function context globally */
        this.functionContext = command.name;

        this.buildAndWrite((b) => {
            b.comment('set function label')
                .label(command.name);
            if (command.local > 0) {
                b.comment(`push 0 for the number of local variables (${command.local})`)
                    .custom('D=0');
                for (let i = 0; i < command.local; i += 1) {
                    b.pushD();
                }
            }
            return b;
        });
    }

    private writeReturnCommand(command: ReturnCommand) {
        this.writeReturn = true;
        this.buildAndWrite((b) => b
            .comment('goto the shared return section')
            .goto(RETURN_LABEL)
        );
    }

    /** Generates a context label */
    private contextLabel(label: string) {
        return `${this.functionContext || this.inputContext}$${label}`;
    }

    /** Appends an index to the end of a label */
    private indexLabel(label: string) {
        const index = this.labelIndexes[label] || 0;
        this.labelIndexes[label] = index + 1;
        return `${label}.${index}`;
    }

    /** Throws an invalid index error for a segment */
    private throwInvalidIndexError(
        command: PushPopCommand,
        format: string,
    ): never {
        const { segment, operand, line } = command;
        this.throwError(
            `invalid index '${operand}' for segment '${segment}' (Must be ${format})`,
            line,
        );
    }

    /** Throw a contextual error */
    private throwError(message: string, line?: number): never {
        const context = this.functionContext || this.inputContext;
        const lineTxt = typeof line === 'number' ? ` - line ${line}` : '';
        throw new Error(`Translation Error (${context}${lineTxt}): ${message}`);
    }
}