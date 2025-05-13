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

/** Register to use when storing the end frame register */
const END_FRAME_REGISTER = 13;

/** Register to use when storing the return address */
const RETURN_ADDR_REGISTER = 14;

/** Label of the shared return function */
const RETURN_LABEL = 'SharedReturn';

/** Configuration options for the translator */
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
      this.writeBootstrap();
    }

    /** Translate all the files */
    for (const input of this.options.inputs) {
      this.name = input.name;
      this.translateAndWriteCommands(input.commands);
    }

    /** Write the shared return function */
    if (this.writeReturn) {
      this.writeReturnFunction();
    }

    /** Stop writing and wait for the output file to close */
    this.output.end();
    await once(this.output, 'close');
  }

  /** Writes the assembly for the bootstrap section */
  private writeBootstrap() {
    if (this.annotate) {
        this.write('// Bootstrap code');
      }
      /** Build the Sys.Init call assembly */
      const callSysInit = this.translateCall({
        type: 'Call',
        name: 'Sys.init',
        args: 0,
      });
      this.write([
        ...this.comment('initialize stack pointer to address 256'),
        '@256',
        'D=A',
        '@SP',
        'M=D',

        ...this.comment('initialize LCL as -1'),
        ...this.constToPtr(-1, 'LCL'),

        ...this.comment('initialize ARG as -2'),
        ...this.constToPtr(-2, 'ARG'),

        ...this.comment('initialize THIS as -3'),
        ...this.constToPtr(-3, 'THIS'),

        ...this.comment('initialize THAT as -4'),
        ...this.constToPtr(-4, 'THAT'),

        ...callSysInit.assembly,
      ].join('\n'));
  }

  /** Write text to the output file */
  private write(text: string) {
    if (!this.output) {
      throw new Error('The Output file has not been opened');
    }
    /** Handle first line leading newline */
    let newlinePrefix = this.firstLine ? '' : '\n';
    if (this.firstLine) {
      text = text.trim();
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
        this.write(`\n// ${this.functionName || this.name}: ${translation.original}`);
      }
      /** Append the assembly code to the output */
      this.write(translation.assembly.join('\n'));
    }
  }

  /** Writes the shared return function to the final output */
  private writeReturnFunction(): void {
    const endFrame = `R${END_FRAME_REGISTER}`;
    const returnAddr = `R${RETURN_ADDR_REGISTER}`;
    const assembly: string[] = [
      `(${RETURN_LABEL})`,
      
      ...this.comment('store endframe address to temp register'),
      ...this.ptrToD('LCL'),
      ...this.dToPtr(endFrame),

      ...this.comment('store return address in temp register'),
      ...this.derefPtrToD(endFrame, -5),
      ...this.dToPtr(returnAddr),
      
      ...this.comment(`replace caller's args with callee's return value`),
      ...this.popD(),
      ...this.ptrToA('ARG'),
      'M=D',
      
      ...this.comment('move SP back to the caller'),
      '@ARG',
      'D=M+1',
      ...this.dToPtr('SP'),

      ...this.comment('restore THAT pointer to caller'),
      ...this.derefPtrToD(endFrame, -1),
      ...this.dToPtr('THAT'),
      
      ...this.comment('restore THIS pointer to caller'),
      ...this.derefPtrToD(endFrame, -2),
      ...this.dToPtr('THIS'),
      
      ...this.comment('restore ARG pointer to caller'),
      ...this.derefPtrToD(endFrame, -3),
      ...this.dToPtr('ARG'),
      
      ...this.comment('restore LCL pointer to caller'),
      ...this.derefPtrToD(endFrame, -4),
      ...this.dToPtr('LCL'),
      
      ...this.comment('goto return address'),
      ...this.ptrToA(returnAddr),
      '0;JMP',
    ];
    if (this.annotate) {
      this.write('\n// Shared return function');
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
        `(${prefixedLabel})`,
      ],
    };
  }

  /** Translate goto command into assembly */
  private translateGoto(command: GotoCommand): Translation {
    const prefixedLabel = this.prefixLabel(command.label);
    return {
      original: `goto ${command.label}`,
      assembly: this.goto(prefixedLabel),
    };
  }

  /** Translate if command into assembly */
  private translateIf(command: IfCommand): Translation {
    const prefixedLabel = this.prefixLabel(command.label);
    return {
      original: `if-goto ${command.label}`,
      assembly: [
        ...this.comment('pop value off the stack into the D register'),
        ...this.popD(),

        ...this.comment(`goto ${prefixedLabel} if D is true (not 0)`),
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
        ...this.comment('push return address to the stack'),
        `@${returnLabel}`,
        'D=A',
        ...this.pushD(),

        ...this.comment('push LCL pointer to the stack'),
        ...this.pushPtr('LCL'),

        ...this.comment('push ARG pointer to the stack'),
        ...this.pushPtr('ARG'),

        ...this.comment('push THIS pointer to the stack'),
        ...this.pushPtr('THIS'),

        ...this.comment('push THAT pointer to the stack'),
        ...this.pushPtr('THAT'),
        
        /**************** REPOSITION ARG/LCL ********************/
        ...this.comment(`reposition ARG pointer to (SP - frame(5) - args(${command.args}))`),
        `@${5 + command.args}`,
        'D=A',
        '@SP',
        'D=M-D',
        ...this.dToPtr('ARG'),
        
        ...this.comment('reposition LCL pointer to the current SP'),
        ...this.ptrToD('SP'),
        ...this.dToPtr('LCL'),

        /********** GOTO FUNCTION AND SET RETURN LABEL *********/
        ...this.comment('goto callee function and set the caller return label'),
        ...this.goto(command.name),
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
        ...this.comment('set function label'),
        `(${command.name})`,
        ...(command.local < 1 ? [] : [
          ...this.comment(`push 0 for the number of local variables (${command.local})`),
          'D=0',
          ...Array().concat(...Array(command.local).fill('').map(() => this.pushD())),
        ]),
      ],
    };
  }

  /** Translate return command into assembly (goto shared return assembly) */
  private translateReturn(): Translation {
    this.writeReturn = true;
    return {
      original: 'return',
      assembly: [
        ...this.comment('goto the shared return section'),
        ...this.goto(RETURN_LABEL),
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
        ...this.comment('pop right hand (rh) operand'),
        ...this.popD(),

        ...this.comment('pop left hand (lh) operand'),
        ...this.decSP(),

        ...this.comment('calculate (rh + lh)'),
        'D=D+M',

        ...this.comment('push result to the stack'),
        ...this.pushD(),
      ];
    }
    /** Subtract top 2 stack values */
    else if (operator === 'sub') {
      assembly = [
        ...this.popDiffToD(),

        ...this.comment('push result to the stack'),
        ...this.pushD(),
      ];
    }
    /** Get negative of top stack value */
    else if (operator === 'neg') {
      assembly = [
        ...this.comment('pop the operand'),
        ...this.decSP(),

        ...this.comment('negate the operand'),
        'D=-M',

        ...this.comment('push result to the stack'),
        ...this.pushD(),
      ];
    }
    /** Comparison operators */
    else if (operator === 'eq' || operator === 'gt' || operator === 'lt') {
      assembly = [
        ...this.popDiffToD(),
        ...this.pushBoolWhenD(operator),
      ];
    }
    /** And operation */
    else if (operator === 'and') {
      assembly = [
        ...this.comment('pop right hand (rh) operand'),
        ...this.popD(),

        ...this.comment('pop left hand (lh) operand'),
        ...this.decSP(),

        ...this.comment('calculate (rh & lh)'),
        'D=D&M',

        ...this.comment('push result to the stack'),
        ...this.pushD(),
      ];
    }
    /** Or operation */
    else if (operator === 'or') {
      assembly = [
        ...this.comment('pop right hand (rh) operand'),
        ...this.popD(),

        ...this.comment('pop left hand (lh) operand'),
        ...this.decSP(),

        ...this.comment('calculate (rh | lh)'),
        'D=D|M',

        ...this.comment('push result to the stack'),
        ...this.pushD(),
      ];
    }
    /** Not operation */
    else if (operator === 'not') {
      assembly = [
        ...this.comment('pop the operand'),
        ...this.decSP(),

        ...this.comment('not (!) the operand'),
        'D=!M',

        ...this.comment('push result to the stack'),
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
      const label = `${this.name}.${i}`;
      assembly = [
        ...this.comment(`set D register to the value at ${label}`),
        ...this.ptrToD(`${this.name}.${i}`), // Not actually a pointer, but the logic is the same
        
        ...this.comment('push the D register to the stack'),
        ...this.pushD(),
      ];
    }
    /** Constant Segment */
    else if (segment === 'constant') {
      assembly = [
        ...this.comment(`push the constant value ${iNum} to the stack`),
        ...this.push(iNum),
      ];
    }
    /** Temp segment (Fixed memory segment at RAM[5 + i] up to RAM[12]) */
    else if (segment === 'temp') {
      if (isNaN(iNum) || iNum < 0 || iNum > 7) {
        return throwInvalidIndexError(i, segment, '0-7');
      }
      assembly = [
        ...this.comment(`set D register to the value at R(5 + ${iNum}) -> R${5 + iNum}`),
        ...this.ptrToD(`R${5 + iNum}`),

        ...this.comment('push the D register to the stack'),
        ...this.pushD(),
      ];
    }
    /** Pointer segment (Index 0 = THIS, Index 1 = THAT) */
    else if (segment === 'pointer') {
      if (i !== '0' && i !== '1') {
        return throwInvalidIndexError(i, segment, '0 or 1');
      }
      assembly = [
        ...this.comment('set the D register to the value at THIS'),
        ...this.ptrToD(i === '0' ? 'THIS' : 'THAT'),

        ...this.comment('push the D register to the stack'),
        ...this.pushD(),
      ];
    }
    /** All other segments (Associated with labeled address as base) */
    else {
      if (isNaN(iNum) || iNum < 0) {
        return throwInvalidIndexError(i, segment, '>= 0');
      }
      const label = MEMORY_SEGMENT[segment];
      assembly = [
        ...this.comment(`set the D register to the value at (${label} + ${iNum})`),
        ...this.ptrToA(MEMORY_SEGMENT[segment], iNum),
        'D=M',

        ...this.comment('push the D register to the stack'),
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
      const label = `${this.name}.${i}`;
      assembly = [
        ...this.comment('pop value from the stack to the D register'),
        ...this.popD(),

        ...this.comment(`set value of ${label} to the value in the D register`),
        `@${label}`,
        'M=D',
      ];
    }
    /** Temp segment (Fixed memory segment at RAM[5 + i] up to RAM[12]) */
    else if (segment === 'temp') {
      if (isNaN(iNum) || iNum < 0 || iNum > 7) {
        return throwInvalidIndexError(i, segment, '0-7');
      }
      assembly = [
        ...this.comment('pop value from the stack to the D register'),
        ...this.popD(),

        ...this.comment(`set value of R(5 + ${iNum}) -> R${5 + iNum} to the value in the D register`),
        `@R${5 + iNum}`,
        'M=D',
      ];
    }
    /** Pointer segment (Index 0 = THIS, Index 1 = THAT) */
    else if (segment === 'pointer') {
      if (i !== '0' && i !== '1') {
        return throwInvalidIndexError(i, segment, '0 or 1');
      }
      const label = i === '0' ? 'THIS' : 'THAT';
      assembly = [
        ...this.comment('pop value from the stack to the D register'),
        ...this.popD(),

        ...this.comment(`set value of ${label} to the value in the D register`),
        `@${label}`,
        'M=D',
      ];
    }
    /** All other segments (Associated with labeled address as base) */
    else {
      if (isNaN(iNum) || iNum < 0) {
        return throwInvalidIndexError(i, segment, '>= 0');
      }
      const label = MEMORY_SEGMENT[segment];
      if (iNum <= POP_DIRECT_ADDR_MAX) {
        assembly = [
          ...this.comment('pop value from the stack to the D register'),
          ...this.popD(),

          ...this.comment(`set value of (${label} + ${iNum}) to the value in the D register`),
          ...this.ptrToA(label, iNum, POP_DIRECT_ADDR_MAX),
          'M=D',
        ];
      } else {
        const temp = `R${POP_TEMP_REGISTER}`;
        assembly = [
          ...this.comment(`set the D register to the address at (${label} + ${iNum})`),
          ...this.ptrToA(MEMORY_SEGMENT[segment], iNum, POP_DIRECT_ADDR_MAX),
          'D=A',

          ...this.comment(`set the value at temp register ${temp} to the value in the D register`),
          `@R${POP_TEMP_REGISTER}`,
          'M=D',
          
          ...this.comment('pop value from the stack to the D register'),
          ...this.popD(),
          
          ...this.comment(`recover the address stored in the temp register ${temp}`),
          `@R${POP_TEMP_REGISTER}`,
          'A=M',
          
          ...this.comment(`store the popped value to the address at (${label} + ${iNum})`),
          'M=D',
        ];
      }
    }

    return {
      original: `${operator} ${segment} ${i}`,
      assembly,
    };
  }

  /*************************** LABEL UTILITIES *******************************/
  
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

  /** Put the value in the D register into the pointer (RAM[label] = D) */
  private dToPtr(label: string): string[] {
    return [
      `@${label}`,
      'M=D',
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
      ...this.comment(`if (D ${cond} 0) goto ${trueLabel}`),
      `@${trueLabel}`,
      `D;J${cond.toUpperCase()}`,

      ...this.comment(`else push false and goto ${endLabel}`),
      ...this.push(false),
      ...this.goto(endLabel),

      ...this.comment('push true'),
      `(${trueLabel})`,
      ...this.push(true),

      ...this.comment('end of condition'),
      `(${endLabel})`,
    ];
  }

  /** Pops 2 values off the stack and stores their difference in the D register */
  private popDiffToD(): string[] {
    return [
      ...this.comment('pop right hand (rh) operand into D Register'),
      ...this.popD(),

      ...this.comment('pop left hand (lh) operand'),
      ...this.decSP(),

      ...this.comment('store result of (lh - rh) in D register'),
      'D=M-D',
    ];
  }

  /** Goto a label */
  private goto(label: string): string[] {
    return [
      `@${label}`,
      '0;JMP',
    ];
  }

  /** Inject a comment into the assembly (will only inject if annotate is enabled) */
  private comment(message: string): string[] {
    if (!this.annotate) {
      return [];
    } else {
      return [`// ---- ${message}`];
    }
  }

  /** Sets a constant value to a pointer by label */
  private constToPtr(constant: number, label: string): string[] {
    if (constant === 0 || constant === 1 || constant === -1) {
      return [
        `@${label}`,
        `M=${constant}`,
      ];
    } else {
      const posConst = Math.abs(constant);
      const isNeg = constant < 0;
      return [
        `@${posConst}`,
        `D=${isNeg ? '-' : ''}A`,
        `@${label}`,
        'M=D',
      ];
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