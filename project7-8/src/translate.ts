/**
 * Author: Philip Brown
 * Language: TypeScript
 * Source Code: https://github.com/pwbrown/n2t/tree/main/project7/src/translate.ts
 */

import { createWriteStream, WriteStream } from "node:fs";
import { ArithmeticCommand, CallCommand, Command, FunctionCommand, GotoCommand, IfCommand, LabelCommand, PushPopCommand, ReturnCommand } from "./parser";
import { MEMORY_SEGMENT } from "./constants";
import { once } from "node:events";

/** Maximum index value for direct addressing while popping */
const POP_DIRECT_ADDR_MAX = 0;

/** Register to use when storing pop command addresses */
const POP_TEMP_REGISTER = 13;

export interface TranslateOptions {
  /** Each input with its corresponding file name and list of parsed VM commands */
  inputs: {
    name: string;
    commands: Command[];
  }[];
  /** Path to the output file that should be created and written to */
  output: string;
  /** Options passed as CLI arguments */
  argOpts: { [opt: string]: boolean };
  /** Indicates if the bootstrap code should be injected */
  bootstrap: boolean;
}

/** The return type of the translate command functions */
interface Translation {
  /** Line(s) of assembly code associated with the command */
  assembly: string[];
  /** Original command string for writing optional comments in the final assembly */
  original: string;
}


/**
 * Translate a list of VM commands and write them to an output file as assembly
 * @param commands list of parsed VM commands
 * @param name name of the input file without the extension (used for static segment)
 * @param outputFile path to the output file
 * @param options command line options object
 */
export const translateAndWrite = async (options: TranslateOptions) => {
  /** Setup translator class and start the translation  */
  const translator = new Translator(options);
  /** Start translating */
  await translator.translate();
}

class Translator {
  private annotate = false; // Toggles comment annotation in the final assembly code
  private firstLine = true; // Controls behavior of leading newline character in assembly code
  private name = ''; // Holds the name of the active file input
  private functionName: string | null = null; // Holds the name of the active function
  private labelIndexes: { [label: string]: number } = {}; // Holds the available index value for labels
  
  private output: WriteStream | null = null; // Output streamer

  /** Initialize the translator */
  constructor(private options: TranslateOptions) {
    /** Initialize CLI argument options */
    this.annotate = !!options.argOpts['annotate'];
  }

  public async translate() {
    /** Initialize output stream */
    this.output = createWriteStream(this.options.output, { encoding: 'utf-8' });

    /** Inject bootstrap code */
    if (this.options.bootstrap) {
      if (this.annotate) {
        this.write('// Bootstrap code');
      }
      this.write([
        // RAM[SP] = 256
        '@256',
        'D=A',
        '@SP',
        'M=D',
        // goto Sys.init
        ...this.goto('Sys.init'),
      ].join('\n'));
    }

    /** Translate all the files */
    for (const input of this.options.inputs) {
      this.name = input.name;
      this.translateAndWriteCommands(input.commands);
    }

    /** Stop writing and wait for the output file to close */
    this.output.end();
    await once(this.output, 'close');
  }

  /** Write text to the output file */
  private write(text: string) {
    if (!this.output) {
      throw new Error('The Output file has not been opened');
    }
    /** Handle first line leading newline */
    let newlinePrefix = this.firstLine ? '' : '\n';
    if (this.firstLine) {
      this.firstLine = false;
    }
    this.output.write(`${newlinePrefix}${text}`);
  }

  /** Translate a list of VM commands to assembly and write to the output file */
  private translateAndWriteCommands(commands: Command[]) {
    for (const command of commands) {
      const translation = this.translateCommand(command);
      /** Annotate the translation */
      if (this.annotate) {
        this.write(`// ${this.functionName || this.name}: ${translation.original}`);
      }
      /** Append the assembly code to the output */
      this.write(translation.assembly.join('\n'));
    }
  }

  /** Translate a single command and return the original VM code and the list of assembly lines */
  private translateCommand(command: Command): Translation {
    switch(command.type) {
      case 'Label':
        return this.translateLabel(command);
      case 'Goto':
        return this.translateGoto(command);
      case 'If':
        return this.translateIf(command);
      case 'Call':
        return this.translateCall(command);
      case 'Function':
        return this.translateFunction(command);
      case 'Return':
        return this.translateReturn();
      case 'Arithmetic':
        return this.translateArithmetic(command);
      case 'PushPop':
        if (command.operator === 'push') {
          return this.translatePush(command);
        } else {
          return this.translatePop(command);
        }
      default:
        throw new Error('Silly boy: you need to add a new command type handler');
    }
  }

  /******************************* COMMAND TRANSLATION FUNCTIONS **********************************/

  /** Translate label command into assembly */
  private translateLabel(command: LabelCommand): Translation {
    const prefixedLabel = this.prefixLabel(command.label);
    return {
      original: `label ${command.label}`,
      assembly: [
        // (name.functionName$label)
        `(${prefixedLabel})`,
      ],
    };
  }

  /** Translate goto command into assembly */
  private translateGoto(command: GotoCommand): Translation {
    const prefixedLabel = this.prefixLabel(command.label);
    return {
      original: `goto ${command.label}`,
      // @name.functioName$label, 0;JMP
      assembly: this.goto(prefixedLabel),
    };
  }

  /** Translate if command into assembly */
  private translateIf(command: IfCommand): Translation {
    const prefixedLabel = this.prefixLabel(command.label);
    return {
      original: `if-goto ${command.label}`,
      assembly: [
        // SP--, D = RAM[SP]
        ...this.popToDRegister(),
        // if D !== 0 goto label
        `@${prefixedLabel}`,
        'D;JNE',
      ],
    }
  }

  /** Translate call command into assembly */
  private translateCall(command: CallCommand): Translation {
    /** Build the return label (format: `callee_name$ret.i`) */
    const returnLabel = this.appendLabelIndex(`${command.name}$ret`);
    return {
      original: `call ${command.name} ${command.args}`,
      assembly: [
        /**************** SAVE CALLER FRAME ******************/
        // push return_address
        `@${returnLabel}`,
        'D=A',
        ...this.pushFromDRegister(),
        // push RAM[LCL]
        ...this.pushPointerValue('LCL'),
        // push RAM[ARG]
        ...this.pushPointerValue('ARG'),
        // push RAM[THIS]
        ...this.pushPointerValue('THIS'),
        // push RAM[THAT]
        ...this.pushPointerValue('THAT'),
        /**************** REPOSITION ARG/LCL ********************/
        // ARG = RAM[SP] - 5 - command_args
        `@${5 + command.args}`,
        'D=A',
        '@SP',
        'D=M-D',
        '@ARG',
        'M=D',
        // RAM[LCL] = RAM[SP]
        '@SP',
        'D=M',
        '@LCL',
        'M=D',
        /***************** GOTO FUNCTION AND RETURN ***************/
        // goto function
        ...this.goto(command.name),
        // set return label
        `(${returnLabel})`,
      ],
    };
  }

  /** Translate function command into assembly */
  private translateFunction(command: FunctionCommand): Translation {
    /** Update the current function name to set the context */
    this.functionName = command.name;
    return {
      original: `function ${command.name} ${command.local}`,
      assembly: [
        // set function label
        `(${command.name})`,
        // repeat push 0 for the number of local variables
        ...(command.local > 0 ? ['D=0'] : []),
        ...Array().concat(...Array(command.local).fill('').map(() => this.pushFromDRegister())),
      ],
    };
  }

  /** Translate return command into assembly */
  private translateReturn(): Translation {
    return {
      original: 'return',
      assembly: [
        // store endframe address
        '@LCL',
        'D=M',
        '@R13',
        'M=D',
        // store return address
        ...this.setDRegToPtrValueMinusOffset('R13', 5),
        '@R14',
        'M=D',
        // put return value for caller's stack (currently at ARG 0)
        ...this.popToDRegister(),
        '@ARG',
        'A=M',
        'M=D',
        // Reposition SP
        '@ARG',
        'D=M+1',
        '@SP',
        'M=D',
        // Restore THAT
        ...this.setDRegToPtrValueMinusOffset('R13', 1),
        '@THAT',
        'M=D',
        // Restore THIS
        ...this.setDRegToPtrValueMinusOffset('R13', 2),
        '@THIS',
        'M=D',
        // Restore ARG
        ...this.setDRegToPtrValueMinusOffset('R13', 3),
        '@ARG',
        'M=D',
        // Restore LCL
        ...this.setDRegToPtrValueMinusOffset('R13', 4),
        '@LCL',
        'M=D',
        // goto returnAddr
        '@R14',
        'A=M',
        '0;JMP',
      ],
    };
  }

  /** Translate arithmetic command into assembly */
  private translateArithmetic(command: ArithmeticCommand): Translation {
    const { operator } = command;

    /** Setup assembly variable */
    let assembly: string[];

    switch(operator) {
      /** Add top 2 stack values */
      case 'add':
        assembly = [
          // SP--, D = RAM[SP]
          ...this.popToDRegister(),
          // SP--
          ...this.decrementStackPointer(),
          // D = D + RAM[SP]
          'D=D+M',
          // RAM[SP] = D, SP++
          ...this.pushFromDRegister(),
        ];
        break;
      /** Subtract top 2 stack values */
      case 'sub':
        assembly = [
          // SP--, D = RAM[SP]
          ...this.popToDRegister(),
          // SP--
          ...this.decrementStackPointer(),
          // D = RAM[SP] - D
          'D=M-D',
          // RAM[SP] = D, SP++
          ...this.pushFromDRegister(),
        ];
        break;
      /** Get negative of top stack value */
      case 'neg':
        assembly = [
          // SP--
          ...this.decrementStackPointer(),
          // D = -RAM[SP]
          'D=-M',
          // RAM[SP] = D, SP++
          ...this.pushFromDRegister(),
        ];
        break;
      /** Equality operator */
      case 'eq':
        assembly = [
          // SP--, D = RAM[SP]
          ...this.popToDRegister(),
          // SP--
          ...this.decrementStackPointer(),
          // D = D - RAM[SP]
          'D=D-M',
          // if (d == 0) push true else push false
          ...this.pushBooleanOnDCondition(operator),
        ];
        break;
      /** Greater than operator */
      case 'gt':
        assembly = [
          // SP--, D = RAM[SP]
          ...this.popToDRegister(),
          // SP--
          ...this.decrementStackPointer(),
          // D = RAM[SP] - D
          'D=M-D',
          // if (d > 0) push true else push false
          ...this.pushBooleanOnDCondition(operator),
        ];
        break;
      /** Less than operator */
      case 'lt':
        assembly = [
          // SP--, D = RAM[SP]
          ...this.popToDRegister(),
          // SP--
          ...this.decrementStackPointer(),
          // D = D - RAM[SP]
          'D=M-D',
          // if (d < 0) push true else push false
          ...this.pushBooleanOnDCondition(operator),
        ];
        break;
      /** And operation */
      case 'and':
        assembly = [
          // SP--, D = RAM[SP]
          ...this.popToDRegister(),
          // SP--
          ...this.decrementStackPointer(),
          // D = D & RAM[SP]
          'D=D&M',
          // RAM[SP] = D, SP++
          ...this.pushFromDRegister(),
        ];
        break;
      /** Or operation */
      case 'or':
        assembly = [
          // SP--, D = RAM[SP]
          ...this.popToDRegister(),
          // SP--
          ...this.decrementStackPointer(),
          // D = D | RAM[SP]
          'D=D|M',
          // RAM[SP] = D, SP++
          ...this.pushFromDRegister(),
        ];
        break;
      /** Not operation */
      case 'not':
        assembly = [
          // SP--
          ...this.decrementStackPointer(),
          // D = !RAM[SP]
          'D=!M',
          // RAM[SP] = D, SP++
          ...this.pushFromDRegister(),
        ];
        break;
      default:
        throw new Error(`Translation Error: Unrecognized arithmetic operator '${operator}'`);
    }

    return {
      original: `${operator}`,
      assembly,
    }
  }

  /** Translate push command into assembly */
  private translatePush(command: PushPopCommand): Translation {
    const { operator, segment, operand } = command;

    return {
      original: `${operator} ${segment} ${operand}`,
      assembly: [
        // D = segment value (depends on segment)
        ...this.setDRegToSegmentValue(segment, operand),
        // RAM[SP] = D, SP++
        ...this.pushFromDRegister(),
      ]
    }
  }

  /** Translate pop command into assembly */
  private translatePop(command: PushPopCommand): Translation {
    const { operator, segment, operand } = command;

    if (segment === 'constant') {
      throw new Error('Translate Error: Cannot pop from the \'constant\' segment');
    }

    /** Check operand (i) value */
    const iNum = parseInt(operand, 10);
    if (isNaN(iNum) || iNum < 0) {
      return throwInvalidIndexError(operand, segment, '>= 0');
    }

    return {
      original: `${operator} ${segment} ${operand}`,
      assembly: [
        // RAM[13] = RAM[SEGMENT_ADDR + i] --or-- N/A
        ...this.storeSegmentAddrOrBypass(segment, iNum),
        // SP--, D = RAM[SP]
        ...this.popToDRegister(),
        // A = SEGMENT_ADDR_WITH_OFFSET
        ...this.recoverSegmentAddrToA(segment, iNum),
        // M = D
        'M=D'
      ],
    };
  }

  /*************************** GENERAL UTILITIES *******************************/
  
  /** Prefixes a label with the current function name or input name */
  private prefixLabel(label: string) {
    return `${this.functionName || this.name}$${label}`;
  }

  /** Appends an index value to the end of a label auto increments the index */
  private appendLabelIndex(label: string) {
    const index = this.labelIndexes[label] || 0;
    this.labelIndexes[label] = index + 1;
    return `${label}.${index}`;
  }

  /************************** ASSEMBLY BUILDERS *******************************/
  
  /** Increment the Stack Pointer */
  private incrementStackPointer(): string[] {
    return [
      // SP++
      '@SP',
      'M=M+1',
    ];
  }

  /** Decrement the Stack Pointer and set A to the new SP value */
  private decrementStackPointer(): string[] {
    return [
      // SP--
      '@SP',
      'AM=M-1',
    ];
  }

  /** Push the value of the D register to the stack and increment SP */
  private pushFromDRegister(): string[] {
    return [
      // RAM[SP] = D
      '@SP',
      'A=M',
      'M=D',
      // SP++
      ...this.incrementStackPointer(),
    ];
  }
  
  /** Decrements the SP and puts the value at the new SP into the D-Register */
  private popToDRegister(): string[] {
    return [
      // SP--, A = SP
      ...this.decrementStackPointer(),
      // D = RAM[SP]
      'D=M'
    ];
  }

  /** Push the value at the pointer label to the stack */
  private pushPointerValue(label: string): string[] {
    return [
      `@${label}`,
      'D=M',
      ...this.pushFromDRegister(),
    ];
  }

  /** Sets the D Register to the value of a pointer with an offset subtracted */
  private setDRegToPtrValueMinusOffset(label: string, offset: number): string[] {
    /** Shorter logic */
    if (offset === 1) {
      return [
        `@${label}`,
        'A=M-1',
        'D=M',
      ];
    } else {
      return [
        `@${offset}`,
        'D=A',
        `@${label}`,
        'A=M-D',
        'D=M',
      ];
    }
  }

  /** Push a boolean value to the stack (true = -1, false = 0) */
  private pushBoolean(value: boolean): string[] {
    return [
      // RAM[SP] = (-1 | 0)
      '@SP',
      'A=M',
      `M=${value ? -1 : 0}`,
      // SP++
      ...this.incrementStackPointer(),
    ];
  }

  /** Pushes a boolean value onto the stack based on the condition of the D register */
  private pushBooleanOnDCondition = (op: string): string[] => {
    const trueLabel = this.appendLabelIndex(this.prefixLabel(op));
    const endLabel = this.appendLabelIndex(this.prefixLabel(`end_${op}`));
    return [
      // if (D (eq|lt|gt) 0) goto opLabel
      `@${trueLabel}`,
      `D;J${op.toUpperCase()}`,
      // else push false and goto end label
      ...this.pushBoolean(false),
      ...this.goto(endLabel),
      // push true
      `(${trueLabel})`,
      ...this.pushBoolean(true),
      // end
      `(${endLabel})`,
    ];
  }

  /** Goto a label */
  private goto(label: string): string[] {
    return [
      `@${label}`,
      '0;JMP',
    ];
  }

  /**
   * Returns the assembly code that sets the D register value to the
   * value in a memory segment at the given offset
   * @param segment segment name
   * @param i segment offset
   */
  private setDRegToSegmentValue = (segment: string, i: string): string[] => {
    const iNum = parseInt(i, 10);
    
    switch(segment) {
      /** Static segment (create named label and assign value) */
      case 'static':
        return [
          // D = RAM[Foo.i]
          `@${this.name}.${i}`,
          'D=M',
        ];
      /** Constant segment (assign operand to the D-Register) */
      case 'constant':
        return [
          // D = i
          `@${i}`,
          'D=A',
        ];
      /** Temp segment (Fixed memory segment at RAM[5 + i] up to RAM[12]) */
      case 'temp':
        if (isNaN(iNum) || iNum < 0 || iNum > 7) {
          return throwInvalidIndexError(i, segment, '0-7');
        }
        return [
          // D = RAM[5 + i]
          `@R${5 + iNum}`,
          'D=M',
        ];
      /** Pointer segment (Index 0 = THIS, Index 1 = THAT) */
      case 'pointer':
        if (i !== '0' && i !== '1') {
          return throwInvalidIndexError(i, segment, '0 or 1');
        }
        const label = i === '0' ? 'THIS' : 'THAT';
        return [
          // D = RAM[THIS|THAT]
          `@${label}`,
          'D=M',
        ];
      /** All other segments (Associated with labeled address as base) */
      default:
        if (isNaN(iNum) || iNum < 0) {
          return throwInvalidIndexError(i, segment, '>= 0');
        } else if (iNum <= 2) {
          /** For small offsets, just increment A directly (3-4 steps) */
          return [
            // A = SEGMENT_POINTER
            `@${MEMORY_SEGMENT[segment]}`,
            // A = RAM[SEGMENT_POINTER + (0 or 1)]
            `A=M${iNum > 0 ? '+1' : ''}`,
            // Optional: A = RAM[SEGMENT_POINTER + 2]
            ...(iNum === 2 ? ['A=A+1'] : []),
            // D = RAM[SEGMENT_POINTER + i]
            'D=M',
          ];
        } else {
          /** For larger offsets, calculate the offset (5 steps) */
          return [
            // D = i
            `@${i}`,
            `D=A`,
            // D = RAM[D + segmentPointer]
            `@${MEMORY_SEGMENT[segment]}`,
            `A=D+M`,
            `D=M`
          ];
        }
    }
  }

  /**
   * Stores the calculated segment address in a register or returns
   * no commands if the address does not need to be stored
   */
  private storeSegmentAddrOrBypass = (segment: string, i: number): string[] => {
    switch(segment) {
      /** These virtual segments do not need to be stored */
      case 'static':
      case 'temp':
      case 'pointer':
        return [];
      /** Handle segments with a pointer label */
      default:
        /** An index value under this threshold can be manually recovered with less steps */
        if (i <= POP_DIRECT_ADDR_MAX) {
          return [];
        } else {
          return [
            // D = i
            `@${i}`,
            'D=A',
            // D = D + segmentPointer
            `@${MEMORY_SEGMENT[segment]}`,
            `D=D+M`,
            // RAM[POP_TEMP_REGISTER] = D
            `@R${POP_TEMP_REGISTER}`,
            'M=D',
          ];
        }
    }
  }

  private recoverSegmentAddrToA(segment: string, i: number) {
    switch(segment) {
      /** Access static address directly */
      case 'static':
        return [
          // A = Foo.i
          `@${this.name}.${i}`,
        ];
      /** Access temp address directly */
      case 'temp':
        if (i < 0 || i > 7) {
          return throwInvalidIndexError(i, segment, '0-7');
        }
        return [
          // A = 5 + i
          `@R${5 + i}`,
        ];
      /** Access pointer address directly */
      case 'pointer':
        if (i < 0 || i > 1) {
          return throwInvalidIndexError(i, segment, '0 or 1');
        }
        return [
          // A = THIS|THAT
          `@${!i ? 'THIS' : 'THAT'}`,
        ];
      /** Handle other segments based on the max index setting */
      default:
        if (i <= POP_DIRECT_ADDR_MAX) {
          /** Increment A as many times as needed based on the max */
          return [
            // A = RAM[SEG_ADDR + (0 or 1)]
            `@${MEMORY_SEGMENT[segment]}`,
            `A=M${i > 0 ? '+1' : ''}`,
            // A = A + 1 (for i > 1)
            ...(i > 1 ? Array(i - 1).fill('A=A+1') : []),
          ];
        } else {
          /** Recover the stored address */
          return [
            // A = RAM[POP_TEMP_REGISTER]
            `@R${POP_TEMP_REGISTER}`,
            'A=M',
          ];
        }
    }
  }
}

/********************* EXTRA UTILITIES *******************/

/** Throws an invalid index error for a segment */
const throwInvalidIndexError = (
  i: string | number,
  segment: string,
  format: string,
): never => {
  throw new Error(
    `Translation Error: Invalid index '${i}' for segment '${segment}' (Must be ${format})`
  ); 
}