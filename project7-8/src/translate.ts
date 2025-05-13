/**
 * Author: Philip Brown
 * Language: TypeScript
 * Source Code: https://github.com/pwbrown/n2t/tree/main/project7/src/translate.ts
 */

import { createWriteStream, WriteStream } from "node:fs";
import { ArithmeticCommand, CallCommand, Command, FunctionCommand, GotoCommand, IfCommand, LabelCommand, PushPopCommand, ReturnCommand } from "./parser";
import { MEMORY_SEGMENT } from "./constants";
import { once } from "node:events";

/** Maximum pop operand value to use for direct addressing (this is just an optimization) */
const POP_DIRECT_ADDR_MAX = 2;

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
  private writeReturn = false; // Indicates if the shared return function should be written to the final assembly code
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

  /** Writes the shared return function to the final output */
  private writeReturnFunction(): void {
    if (!this.writeReturn) {
      return;
    }
    const assembly: string[] = [
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
    ];
    if (this.annotate) {
      this.write('// Shared return function');
    }
    this.write(assembly.join('\n'));
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

    /** Add top 2 stack values */
    if (operator === 'add') {
      assembly = [
        ...this.popD(),
        ...this.decSP(),
        'D=D+M',
        ...this.pushD(),
      ];
    }
    /** Subtract top 2 stack values */
    else if (operator === 'sub') {
      assembly = [
        ...this.popD(),
        ...this.decSP(),
        'D=M-D',
        ...this.pushD(),
      ];
    }
    /** Get negative of top stack value */
    else if (operator === 'neg') {
      assembly = [
        ...this.decSP(),
        'D=-M',
        ...this.pushD(),
      ];
    }
    /** Equality operator */
    else if (operator === 'eq') {
      assembly = [
        ...this.popD(),
        ...this.decSP(),
        'D=D-M',
        ...this.pushBoolWhenD(operator),
      ];
    }
    /** Greater than operator */
    else if (operator === 'gt') {
      assembly = [
        ...this.popD(),
        ...this.decSP(),
        'D=M-D',
        ...this.pushBoolWhenD(operator),
      ];
    }
    /** Less than operator */
    else if (operator === 'lt') {
      assembly = [
        ...this.popD(),
        ...this.decSP(),
        'D=M-D',
        ...this.pushBoolWhenD(operator),
      ];
    }
    /** And operation */
    else if (operator === 'and') {
      assembly = [
        ...this.popD(),
        ...this.decSP(),
        'D=D&M',
        ...this.pushD(),
      ];
    }
    /** Or operation */
    else if (operator === 'or') {
      assembly = [
        ...this.popD(),
        ...this.decSP(),
        'D=D|M',
        ...this.pushD(),
      ];
    }
    /** Not operation */
    else if (operator === 'not') {
      assembly = [
        ...this.decSP(),
        'D=!M',
        ...this.pushD(),
      ];
    } else {
      throw new Error(`Translation Error: Unrecognized arithmetic operator '${operator}'`);
    }

    return {
      original: `${operator}`,
      assembly,
    }
  }

  /** Translate push command into assembly */
  private translatePush(command: PushPopCommand): Translation {
    const { operator, segment, operand: i } = command;

    const iNum = parseInt(i, 10);
    let assembly: string[];
    
    /** Static Segment (Use named label and assign value) */
    if (segment === 'static') {
      assembly = [
        ...this.ptrToD(`${this.name}.${i}`), // Not actually a pointer, but the logic is the same
        ...this.pushD(),
      ];
    }
    /** Constant Segment */
    else if (segment === 'constant') {
      assembly = this.push(iNum);
    }
    /** Temp segment (Fixed memory segment at RAM[5 + i] up to RAM[12]) */
    else if (segment === 'temp') {
      if (isNaN(iNum) || iNum < 0 || iNum > 7) {
        return throwInvalidIndexError(i, segment, '0-7');
      }
      assembly = [
        ...this.ptrToD(`R${5 + iNum}`),
        ...this.pushD(),
      ];
    }
    /** Pointer segment (Index 0 = THIS, Index 1 = THAT) */
    else if (segment === 'pointer') {
      if (i !== '0' && i !== '1') {
        return throwInvalidIndexError(i, segment, '0 or 1');
      }
      assembly = [
        ...this.ptrToD(i === '0' ? 'THIS' : 'THAT'),
        ...this.pushD(),
      ];
    }
    /** All other segments (Associated with labeled address as base) */
    else {
      if (isNaN(iNum) || iNum < 0) {
        return throwInvalidIndexError(i, segment, '>= 0');
      }
      assembly = [
        ...this.ptrToA(MEMORY_SEGMENT[segment], iNum),
        'D=M',
        ...this.pushD(),
      ];
    }

    return {
      original: `${operator} ${segment} ${i}`,
      assembly,
    };
  }

  /** Translate pop command into assembly */
  private translatePop(command: PushPopCommand): Translation {
    const { operator, segment, operand: i } = command;

    if (segment === 'constant') {
      throw new Error('Translate Error: Cannot pop from the \'constant\' segment');
    }

    /** Check operand (i) value */
    const iNum = parseInt(i, 10);
    if (isNaN(iNum) || iNum < 0) {
      return throwInvalidIndexError(i, segment, '>= 0');
    }

    let assembly: string[];

    /** Static Segment (Use named label and assign value) */
    if (segment === 'static') {
      assembly = [
        ...this.popD(),
        `@${this.name}.${i}`,
        'M=D',
      ];
    }
    /** Temp segment (Fixed memory segment at RAM[5 + i] up to RAM[12]) */
    else if (segment === 'temp') {
      if (isNaN(iNum) || iNum < 0 || iNum > 7) {
        return throwInvalidIndexError(i, segment, '0-7');
      }
      assembly = [
        ...this.popD(),
        `@R${5 + iNum}`,
        'M=D',
      ];
    }
    /** Pointer segment (Index 0 = THIS, Index 1 = THAT) */
    else if (segment === 'pointer') {
      if (i !== '0' && i !== '1') {
        return throwInvalidIndexError(i, segment, '0 or 1');
      }
      assembly = [
        ...this.popD(),
        `@${i === '0' ? 'THIS' : 'THAT'}`,
        'M=D',
      ];
    }
    /** All other segments (Associated with labeled address as base) */
    else {
      if (isNaN(iNum) || iNum < 0) {
        return throwInvalidIndexError(i, segment, '>= 0');
      }
      if (iNum <= POP_DIRECT_ADDR_MAX) {
        assembly = [
          ...this.popD(),
          ...this.ptrToA(MEMORY_SEGMENT[segment], iNum, POP_DIRECT_ADDR_MAX),
          'M=D',
        ];
      } else {
        assembly = [
          /** Store address in temporary register */
          ...this.ptrToA(MEMORY_SEGMENT[segment], iNum, POP_DIRECT_ADDR_MAX),
          'D=A',
          `@R${POP_TEMP_REGISTER}`,
          'M=D',
          /** Pop to D */
          ...this.popD(),
          /** Recover address from temp register and store D */
          `@R${POP_TEMP_REGISTER}`,
          'A=M',
          'M=D',
        ];
      }
    }

    return {
      original: `${operator} ${segment} ${i}`,
      assembly,
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

  /** Increment the stack pointer (SP++) */
  private incSP(): string[] {
    return [
      '@SP',
      'M=M+1',
    ];
  }

  /** Decrement the Stack Pointer and set A (SP--, A=SP) */
  private decSP(): string[] {
    return [
      '@SP',
      'AM=M-1',
    ];
  }

  /**
   * Put a pointer in the A register with optional subtraction offset (A = RAM[label] - subtract)
   * @param label pointer label
   * @param offset offset to apply to the pointer's address
   * @param threshold max offset value for direct addressing using A register arithmetic
   */
  private ptrToA(label: string, offset = 0, threshold = 2): string[] {
    const neg = offset < 0;
    const op = neg ? '-' : '+';
    const posOffset = Math.abs(offset);
    if (posOffset <= threshold) {
      return [
        `@${label}`,
        `A=M${posOffset > 0 ? `${op}1` : ''}`,
        ...(posOffset > 1 ? Array(posOffset - 1).fill(`A=A${op}1`) : []),
      ];
    } else {
      return [
        `@${posOffset}`,
        'D=A',
        `@${label}`,
        `A=${neg ? 'M-D' : 'D+M'}`,
      ];
    }
  }

  /** Put a pointer in the D register (D = RAM[label]) */
  private ptrToD(label: string): string[] {
    return [
      `@${label}`,
      'D=M',
    ];
  }
  
  /**
   * Puts the dereferenced pointer value into the D register (D = RAM[RAM[label] (+|-) offset])
   * @param label pointer label
   * @param offset optional pointer address offset
   */
  private derefPtrToD(label: string, offset = 0): string[] {
    return [
      ...this.ptrToA(label, offset),
      'D=M',
    ];
  }

  /** Push the value of the D register to the stack and increment SP */
  private pushD(): string[] {
    return [
      ...this.ptrToA('SP'),
      'M=D',
      ...this.incSP(),
    ];
  }
  
  /** Decrement the stack pointer and pop the value into the D register */
  private popD(): string[] {
    return [
      ...this.decSP(),
      'D=M',
    ];
  }

  /** Push a pointer to the stack (SP = RAM[label], SP++) */
  private pushPtr(label: string): string[] {
    return [
      ...this.ptrToD(label),
      ...this.pushD(),
    ];
  }

  /** Push a constant value (numeric or boolean) to the stack */
  private push(value: number | boolean): string[] {
    /** Push constant numbers */
    if (typeof value === 'number') {
      /** Binary numeric digits can be set directly */
      if (value === 0 || value === 1 || value === -1) {
        return [
          ...this.ptrToA('SP'),
          `M=${value}`,
          ...this.incSP(),
        ];
      } else {
        return [
          `@${value}`,
          'D=A',
          ...this.pushD(),
        ];
      }
    }
    /** Push boolean values */
    else {
      return [
        ...this.ptrToA('SP'),
        `M=${value ? -1 : 0}`,
        ...this.incSP(),
      ];
    }
  }

  /** Pushes a boolean value onto the stack based on the condition of the D register */
  private pushBoolWhenD = (cond: 'eq' | 'gt' | 'lt'): string[] => {
    const trueLabel = this.appendLabelIndex(this.prefixLabel(cond));
    const endLabel = this.appendLabelIndex(this.prefixLabel(`end_${cond}`));
    return [
      // if (D *cond* 0) goto trueLabel
      `@${trueLabel}`,
      `D;J${cond.toUpperCase()}`,
      // else push false and goto endLabel
      ...this.push(false),
      ...this.goto(endLabel),
      // push true
      `(${trueLabel})`,
      ...this.push(true),
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