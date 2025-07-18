/**
 * Compiler Writer
 * Author      : Philip Brown
 * Source Code : https://github.com/pwbrown/nand2tetris/n2t/src/compile/writer.ts
 */

import { BaseWriter } from '../shared/base-writer';
import {
    ClassObj,
    ClassVarDecObj,
    DoStatementObj,
    ExpressionGroupObj,
    ExpressionListObj,
    ExpressionObj,
    IdentifierObj,
    IfStatementObj,
    IndexExpressionObj,
    IntegerConstObj,
    KeywordObj,
    LetStatementObj,
    Obj,
    ParameterListObj,
    ReturnStatementObj,
    StatementsObj,
    StringConstObj,
    SubroutineBodyObj,
    SubroutineCallObj,
    SubroutineDecObj,
    SymbolObj,
    TermObj,
    UnaryOpTermObj,
    VarDecObj,
    WhileStatementObj,
} from './object';

/** Symbol kind */
enum SymKind {
    this = 'this',
    static = 'static',
    local = 'local',
    argument = 'argument',
}

/** Symbol representation */
interface Sym {
    type: string;
    kind: SymKind;
    index: number;
}

export class Writer extends BaseWriter {
    private className: string;
    private subroutineName: string | null = null;
    private classSymbols: { [sym: string]: Sym } = {};
    private routineSymbols: { [sym: string]: Sym } = {};
    private labelIndexes: { [label: string]: number} = {};

    constructor(
        private root: ClassObj,
        outputFile: string,
        private annotate: boolean,
    ) {
        super(outputFile);
        this.className = this.root.classNameIdentifier.token.literal;
    }

    /** Write VM code to the output file */
    public async writeVM() {
        /** Compile the program and write to the output file */
        const allLines = this.compileClass(this.root);
        for (const line of allLines) {
            const indent = line && !/^(function|label|\/[*]|\s[*])/.test(line);
            this.writeLine(`${indent ? '    ' : ''}${line}`);
        }

        /** Close the output file */
        const linesWritten = await this.closeOutput();
        return linesWritten;
    }

    /** Compile a class object */
    private compileClass(obj: ClassObj): string[] {
        const lines: string[] = [];
        /** Compile class level variable declarations to populate symbols */
        for (const varDec of obj.classVarDecs) {
            this.compileClassVarDec(varDec);
        }

        /** Annotate class and symbol map */
        if (this.annotate) {
            lines.push(
                '/**',
                ` * ${obj.toString()}`,
            );
            if (Object.keys(this.classSymbols).length) {
                lines.push(
                    ' *',
                    ' * Class Symbol Map:',
                    ...symbolMapToLines(this.classSymbols).map((line) => ` *   ${line}`),
                );
            }
            lines.push(' */', '');
        }

        /** Compile each subroutine declaration */
        for (const subDec of obj.subroutineDecs) {
            lines.push(...this.compileSubroutine(subDec));
        }

        return lines;
    }

    /** Compile a single class variable declaration object */
    private compileClassVarDec(obj: ClassVarDecObj) {
        const varType = obj.varType.token.literal;
        const varKindLit = obj.classVarKeyword.token.literal;
        const varKind = varKindLit === 'static' ? SymKind.static : SymKind.this;
        for (const nameIdent of obj.varNames) {
            const name = nameIdent.token.literal;
            this.setSymbol(name, varType, varKind, 'class');
        }
    }

    /** Compiles a subroutine */
    private compileSubroutine(obj: SubroutineDecObj): string[] {
        const lines: string[] = [];
        this.subroutineName = obj.nameIdentifier.token.literal;
        /** Reset the symbol table */
        this.routineSymbols = {};
        const subType = obj.routineType.token.literal;
        /** Inject the "this" argument for method subroutines */
        if (subType === 'method') {
            this.setSymbol('this', this.className, SymKind.argument, 'subroutine');
        }
        /** Compile the parameter list to populate the subroutine symbol table */
        this.compileParameterList(obj.parameterList);
        /** Compile the subroutine body and get the total number of local variables */
        const [bodyLines, locals] = this.compileSubroutineBody(obj.subroutineBody);
        /** Annotation */
        if (this.annotate) {
            lines.push(
                '',
                '/**',
                ` * ${obj.toString()}`,
            );
            if (Object.keys(this.routineSymbols).length) {
                lines.push(
                    ' *',
                    ' * Subroutine Symbol Map:',
                    ...symbolMapToLines(this.routineSymbols).map((line) => ` *   ${line}`)
                );
            }
            lines.push(' */');
        }
        /** Generate function line with local variable count */
        lines.push(`function ${this.className}.${this.subroutineName} ${locals}`);
        /** Handle memory allocation for constructor function */
        if (subType === 'constructor') {
            const fieldCount = Object
                .values(this.classSymbols)
                .filter((sym) => sym.kind === SymKind.this)
                .length;
            if (this.annotate) {
                lines.push('', '// Allocate object memory');
            }
            lines.push(
                `push constant ${fieldCount}`,
                'call Memory.alloc 1',
                'pop pointer 0',
            );
        }
        /** Handle 'this' initialization for method */
        else if (subType === 'method') {
            if (this.annotate) {
                lines.push('', '// Initialize "this" pointer');
            }
            lines.push(
                'push argument 0',
                'pop pointer 0',
            );
        }
        /** Append subroutine body lines */
        lines.push(...bodyLines);
        return lines;
    }

    /** Compile a list of parameters for a subroutine */
    private compileParameterList(obj: ParameterListObj) {
        for (const [typeObj, nameObj] of obj.parameters) {
            const name = nameObj.token.literal;
            const type = typeObj.token.literal;
            this.setSymbol(name, type, SymKind.argument, 'subroutine');
        }
    }

    /** Compile a subroutine body and return the number of variable declarations */
    private compileSubroutineBody(obj: SubroutineBodyObj): [string[], number] {
        /** Compile variable declarations and sum up total number of local variables */
        const locals = obj.varDecs.reduce((total, dec) => total + this.compileVarDec(dec), 0);
        /** Compile Statements and return number of local variables */
        return [
            this.compileStatements(obj.statements),
            locals,
        ];
    }

    /** Compile a subroutine variable declaration */
    private compileVarDec(obj: VarDecObj): number {
        const varType = obj.varType.token.literal;
        for (const nameIdent of obj.varNames) {
            const name = nameIdent.token.literal;
            this.setSymbol(name, varType, SymKind.local, 'subroutine');
        }
        return obj.varNames.length;
    }

    /** Compile a list of statements */
    private compileStatements(obj: StatementsObj): string[] {
        const lines: string[] = [];
        for (const statement of obj.statements) {
            if (statement instanceof LetStatementObj) {
                lines.push(...this.compileLet(statement));
            } else if (statement instanceof IfStatementObj) {
                lines.push(...this.compileIf(statement));
            } else if (statement instanceof WhileStatementObj) {
                lines.push(...this.compileWhile(statement));
            } else if (statement instanceof DoStatementObj) {
                lines.push(...this.compileDo(statement));
            } else if (statement instanceof ReturnStatementObj) {
                lines.push(...this.compileReturn(statement));
            } else {
                throw new Error('Unexpected statement object');
            }
        }
        return lines;
    }

    /** Compile a let statement */
    private compileLet(obj: LetStatementObj): string[] {
        const lines: string[] = [];
        if (this.annotate) {
            lines.push('', `// ${obj.toString()}`);
        }
        /** Handle setting up array assignment */
        if (obj.variable instanceof IndexExpressionObj) {
            /** Passing false to indicate that we do not want to pop the pointer */
            lines.push(...this.compileIndexExpression(obj.variable, false));
        }
        /** Compile expression */
        lines.push(...this.compileExpression(obj.expression));
        /** Handle the assignment operation */
        if (obj.variable instanceof IndexExpressionObj) {
            /** Array assignment */
            lines.push(
                'pop temp 0', // Temporarily store expression result
                'pop pointer 1', // Set 'THAT' to previously stored address
                'push temp 0', // Push temp value back onto the stack
                'pop that 0', // Pop value into array
            );
        } else {
            /** Simple variable assignment */
            const sym = this.getSymbolOrThrow(obj.variable);
            lines.push(`pop ${sym.kind} ${sym.index}`);
        }
        return lines;
    }

    /** Compile an if statement */
    private compileIf(obj: IfStatementObj): string[] {
        const lines: string[] = [];
        if (this.annotate) {
            lines.push('', `// ${obj.toString()}`);
        }
        /** Compile and negate condition expression */
        lines.push(
            ...this.compileExpression(obj.conditionExpression),
            'not',
        );
        const ifLabel = this.indexLabel(`IF`);
        const endLabel = `END_${ifLabel}`;
        const consequence = this.compileStatements(obj.consequenceStatements);
        if (!obj.altStatements) {
            /** Handle if only */
            lines.push(
                `if-goto ${endLabel}`,
                ...consequence,
            );
        } else {
            /** Handle if-else */
            const elseLabel = `ELSE_${ifLabel}`;
            lines.push(
                `if-goto ${elseLabel}`,
                ...consequence,
                `goto ${endLabel}`,
                `label ${elseLabel}`,
                ...this.compileStatements(obj.altStatements),
            );
        }
        /** Append end label */
        lines.push(`label ${endLabel}`);
        return lines;
    }

    /** Compile a while loop */
    private compileWhile(obj: WhileStatementObj): string[] {
        const whileLabel = this.indexLabel('WHILE');
        const endLabel = `END_${whileLabel}`;
        return [
            ...(this.annotate ? ['', `// ${obj.toString()}`] : []),
            `label ${whileLabel}`,
            ...this.compileExpression(obj.expression),
            'not',
            `if-goto ${endLabel}`,
            ...this.compileStatements(obj.statements),
            `goto ${whileLabel}`,
            `label ${endLabel}`,
        ];
    }

    /** Compile a do statement */
    private compileDo(obj: DoStatementObj): string[] {
        return [
            ...(this.annotate ? ['', `// ${obj.toString()}`] : []),
            ...this.compileSubroutineCall(obj.subroutineCall),
            'pop temp 0',
        ];
    }

    /** Compile a return statement */
    private compileReturn(obj: ReturnStatementObj): string[] {
        const lines: string[] = [];
        if (this.annotate) {
            lines.push('', `// ${obj.toString()}`);
        }
        if (obj.expression) {
            lines.push(...this.compileExpression(obj.expression));
        } else {
            lines.push('push constant 0');
        }
        lines.push('return');
        return lines;
    }

    /** Compile an expression */
    private compileExpression(obj: ExpressionObj): string[] {
        const lines: string[] = [];
        /** Compile the first term */
        lines.push(...this.compileTerm(obj.terms[0]));
        /** Compile additional terms and operators */
        for (let i = 0; i < obj.operators.length; i += 1) {
            lines.push(
                ...this.compileTerm(obj.terms[i + 1]),
                this.translateOp(obj.operators[i]),
            );
        }
        return lines;
    }

    /** Compile a list of expressions */
    private compileExpressionList(obj: ExpressionListObj): string[] {
        return obj.expressions.reduce<string[]>((lines, expObj) => [
            ...lines,
            ...this.compileExpression(expObj),
        ], []);
    }

    /** Compile a term */
    private compileTerm(obj: TermObj): string[] {
        const term = obj.term;
        if (term instanceof IntegerConstObj) {
            return this.compileIntegerConst(term);
        } else if (term instanceof StringConstObj) {
            return this.compileStringConst(term);
        } else if (term instanceof KeywordObj) {
            return this.compileKeyword(term);
        } else if (term instanceof IdentifierObj) {
            return this.compileIdentifier(term);
        } else if (term instanceof IndexExpressionObj) {
            return this.compileIndexExpression(term);
        } else if (term instanceof SubroutineCallObj) {
            return this.compileSubroutineCall(term);
        } else if (term instanceof ExpressionGroupObj) {
            return this.compileExpression(term.expression);
        } else if (term instanceof UnaryOpTermObj) {
            return this.compileUnaryOp(term);
        } else {
            throw new Error(`Unsupported term found: ${obj.token.literal}`);
        }
    }

    /** Compile an integer constant */
    private compileIntegerConst(obj: IntegerConstObj): string[] {
        return [
            `push constant ${obj.value}`,
        ];
    }

    /** Compile a string constant using the OS methods */
    private compileStringConst(obj: StringConstObj): string[] {
        const lines: string[] = [];
        const literal = obj.token.literal;
        /** Generate a new string */
        lines.push(
            `push constant ${literal.length}`,
            'call String.new 1',
        );
        /** Append characterts */
        for (let i = 0; i < literal.length; i += 1) {
            lines.push(
                `push constant ${literal.charCodeAt(i)}`,
                'call String.appendChar 2', // this method returns pointer to string
            );
        }
        return lines;
    }

    /** Compile a keyword */
    private compileKeyword(obj: KeywordObj): string[] {
        switch(obj.token.literal) {
            case 'true':
                return [
                    'push constant 1',
                    'neg',
                ];
            case 'false':
            case 'null':
                return [
                    'push constant 0',
                ];
            case 'this':
                return [
                    'push pointer 0',
                ];
            default:
                throw new Error(`Unsupported keyword: ${obj.token.literal}`);
        }
    }

    /** Compile an identifier */
    private compileIdentifier(obj: IdentifierObj): string[] {
        const sym = this.getSymbolOrThrow(obj);
        return [
            `push ${sym.kind} ${sym.index}`,
        ];
    }

    /** Compile an index expression */
    private compileIndexExpression(obj: IndexExpressionObj, pop = true): string[] {
        const sym = this.getSymbolOrThrow(obj.varIdentifier);
        const lines: string[] = [];
        /** Calculate Address */
        lines.push(
            `push ${sym.kind} ${sym.index}`, // Push array address first
            ...this.compileExpression(obj.indexExpression), // Push compile index expression
            'add', // Add index to original address
        );
        /** Pop address into 'that' pointer and push the value at that */
        if (pop) {
            lines.push(
                'pop pointer 1', // Sets 'THAT' to array index address
                'push that 0', // Pushes value at index address to the stack
            );
        }
        return lines;
    }

    /** Compile a subroutine call */
    private compileSubroutineCall(obj: SubroutineCallObj): string[] {
        const lines: string[] = [];
        const objName = obj.objNameIdentifier?.token.literal;
        const objSym = obj.objNameIdentifier ? this.getSymbol(obj.objNameIdentifier) : null;
        /** Call is considered a method if an object is not specified, or an object symbol was found */
        const isMethod = !obj.objNameIdentifier || objSym;
        /** Handle first param for method */
        if (isMethod) {
            if (objSym) {
                lines.push(`push ${objSym.kind} ${objSym.index}`);
            } else {
                /** Just use the current class address */    
                lines.push('push pointer 0');
            }
        }
        /** Compile remaining params */
        lines.push(...this.compileExpressionList(obj.expressionList));
        /** Call the subroutine */
        const functionName = `${objSym?.type || objName || this.className}.${obj.subroutineNameIdentifier.token.literal}`;
        const args = obj.expressionList.expressions.length + (isMethod ? 1 : 0);
        lines.push(`call ${functionName} ${args}`);
        return lines;
    }

    /** Compile a unary operator term */
    private compileUnaryOp(obj: UnaryOpTermObj): string[] {
        return [
            ...this.compileTerm(obj.term),
            this.translateUnaryOp(obj.operator),
        ];
    }

    /** Translate operator literal into VM */
    private translateOp(obj: SymbolObj): string {
        switch (obj.token.literal) {
            case '+': return 'add';
            case '-': return 'sub';
            case '*': return 'call Math.multiply 2';
            case '/': return 'call Math.divide 2';
            case '&': return 'and';
            case '|': return 'or';
            case '<': return 'lt';
            case '>': return 'gt';
            case '=': return 'eq';
            default:
                throw new Error(`Unsupported op symbol: ${obj.token.literal}`);
        }
    }

    /** Translate a unary operator literal into VM */
    private translateUnaryOp(obj: SymbolObj): string {
        switch(obj.token.literal) {
            case '-': return 'neg';
            case '~': return 'not';
            default:
                throw new Error(`Unsupported unary op symbol: ${obj.token.literal}`);
        }
    }

    /******************* SYMBOLS ******************/
    
    /** Get a symbol by name */
    private getSymbol(name: string | Obj): Sym | null {
        if (typeof name !== 'string') {
            name = name.token.literal;
        }
        return this.routineSymbols[name] || this.classSymbols[name] || null;
    }
    
    private getSymbolOrThrow(name: string | Obj): Sym | never {
        if (typeof name !== 'string') {
            name = name.token.literal;
        }
        const sym = this.getSymbol(name);
        if (!sym) {
            throw new Error(`Undefined Symbol: '${name}'`);
        }
        return sym;
    }

    /** Set a symbol and auto-increment the kind index */
    private setSymbol(name: string, type: string, kind: SymKind, scope: 'class' | 'subroutine') {
        /** Find the current max index between all symbols of the same kind */
        const maxIndex = Object.values(scope === 'class' ? this.classSymbols : this.routineSymbols)
            .reduce<number>((p, c) => Math.max(p, c.kind === kind ? c.index : -1), -1);
        /** Create the symbol */
        const sym: Sym = { type, kind, index: maxIndex + 1 };
        if (scope === 'class') {
            this.classSymbols[name] = sym;
        } else {
            this.routineSymbols[name] = sym;
        }
    }

    /******************** LABELING *****************/

    /** Indexes a label and auto-increments */
    private indexLabel(label: string) {
        this.labelIndexes[label] = typeof this.labelIndexes[label] === 'number'
            ? this.labelIndexes[label] + 1
            : 0;
        return `${label}_${this.labelIndexes[label]}`;
    }
}

/************************** UTILITIES ****************************/

const KIND_LABEL = 'Kind';
const INDEX_LABEL = 'Index';
const NAME_LABEL = 'Name';
const TYPE_LABEL = 'Type';

/** Formats a symbol table into a list of strings formatted like a markdown style table */
const symbolMapToLines = (symbols: { [sym: string]: Sym }): string[] => {
    const lines: string[] = [];

    let maxKind = KIND_LABEL.length;
    let maxName = NAME_LABEL.length;
    let maxType = TYPE_LABEL.length;
    
    /** Get sorted list of symbols */
    const symbolList = Object.entries(symbols)
        .sort(([aName, aSym], [bName, bSym]) => {
            /** Sort by kind first and then index */
            if (aSym.kind < bSym.kind) {
                return -1;
            } else if (aSym.kind > bSym.kind) {
                return 1;
            } else if (aSym.index < bSym.index) {
                return -1;
            } else if (aSym.index > bSym.index) {
                return 1;
            } else {
                return 0;
            }
        })
        .map<[string, Sym]>(([name, sym]) => {
            /** Update maximum character lengths */
            if (name.length > maxName) {
                maxName = name.length;
            }
            if (sym.kind.length > maxKind) {
                maxKind = sym.kind.length;
            }
            if (sym.type.length > maxType) {
                maxType = sym.type.length;
            }
            
            return [name, sym];
        });

    /** Header Row */
    lines.push(`| ${
        KIND_LABEL.padEnd(maxKind, ' ')
    } | ${INDEX_LABEL} | ${
        NAME_LABEL.padEnd(maxName, ' ')
    } | ${
        TYPE_LABEL.padEnd(maxType, ' ')
    } |`);
    
    /** Filler Row */
    lines.push(`| ${
        ''.padEnd(maxKind, '-')
    } | ${
        ''.padEnd(INDEX_LABEL.length, '-')
    } | ${
        ''.padEnd(maxName, '-')
    } | ${
        ''.padEnd(maxType, '-')
    } |`)
    
    /** Symbol Rows */
    symbolList.forEach(([name, sym]) => {
        lines.push(`| ${
            sym.kind.padEnd(maxKind, ' ')
        } | ${
            sym.index.toString().padEnd(INDEX_LABEL.length, ' ')
        } | ${
            name.padEnd(maxName, ' ')
        } | ${
            sym.type.padEnd(maxType, ' ')
        } |`)
    });

    return lines;
}