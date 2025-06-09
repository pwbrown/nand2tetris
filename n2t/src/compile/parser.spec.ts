/**
 * Compile Parser Tests
 * Author      : Philip Brown
 * Source Code : https://github.com/pwbrown/nand2tetris/n2t/src/compile/parser.spec.ts
 */

import { Parser } from './parser';
import { Lexer } from '../shared/lexer';
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
    ReturnStatementObj,
    StatementObj,
    StatementsObj,
    StringConstObj,
    SubroutineBodyObj,
    SubroutineCallObj,
    SubroutineDecObj,
    SymbolObj,
    Term,
    TermObj,
    UnaryOpTermObj,
    VarDecObj,
    WhileStatementObj,
} from './object';

describe('Compile - Parser', () => {

    describe('Class', () => {
        it('should parse an empty class', () => {
            parseClass('MyClass', `
                class MyClass {}
            `);
        });
    
        it('should fail if the first token is not class', () => {
            expectErrors('var int blah');
        });
    
        it('should fail if class is missing identifier', () => {
            expectErrors('class {}');
        });
    
        it('should fail if the class is missing braces', () => {
            expectErrors('class MyClass');
            expectErrors('class MyClass {');
        });
    
        it('should parse class field variables', () => {
            const cls = parseClass('MyClass', `
                class MyClass {
                    field int foo;
                    field String bar, buz;
                }
            `);
            expectClassVars(cls, [
                ['field', 'int', 'foo'],
                ['field', 'String', 'bar', 'buz'],
            ]);
        });
    
        it('should parse class static variables', () => {
            const cls = parseClass('MyClass', `
                class MyClass {
                    static boolean foo;
                    static char bar, buz;
                }
            `);
            expectClassVars(cls, [
                ['static', 'boolean', 'foo'],
                ['static', 'char', 'bar', 'buz'],
            ]);
        });
    
        it('should not parse improperly formatted class variables', () => {
            expectErrors(`class MyClass { field; }`);
            expectErrors(`class MyClass { field int; }`);
            expectErrors(`class MyClass { field int myVar,; }`);
            expectErrors(`class MyClass { field int myVar }`);
        });
    });

    describe('Subroutine Declarations', () => {
        it('should parse a constructor declaration', () => {
            const cls = parseClass('MyClass', `
                class MyClass {
                    constructor MyClass new(
                        int one,
                        boolean two
                    ) {}
                }
            `);
            expectSubroutineDec(
                cls.subroutineDecs[0],
                'constructor',
                'MyClass',
                'new',
                [
                    ['int', 'one'],
                    ['boolean', 'two'],
                ],
            );
        });

        it('should parse a method declaration', () => {
            const cls = parseClass('MyClass', `
                class MyClass {
                    method void update() {}
                    method boolean getSomething() {}
                }
            `);
            const [update, getSomething] = cls.subroutineDecs;
            expectSubroutineDec(update, 'method', 'void', 'update');
            expectSubroutineDec(getSomething, 'method', 'boolean', 'getSomething');
        });

        it('should parse a function declaration', () => {
            const cls = parseClass('MyClass', `
                class MyClass {
                    function int add2(int num) {}
                }
            `);
            const [add2] = cls.subroutineDecs;
            expectSubroutineDec(add2, 'function', 'int', 'add2', [
                ['int', 'num'],
            ]);
        });

        it('should not parse an invalid subroutine', () => {
            expectErrors(`class MyClass { method }`);
            expectErrors(`class MyClass { function int }`);
            expectErrors(`class MyClass { constructor int new }`);
            expectErrors(`class MyClass { method void new( }`);
            expectErrors(`class MyClass { method void new(int) }`);
            expectErrors(`class MyClass { method void new(int one,) }`);
            expectErrors(`class MyClass { method void new() }`);
            expectErrors(`class MyClass { method void new() { }`);
            expectErrors(`class MyClass { method void new() } }`);
            expectErrors(`class MyClass { method void new() {`);
        });

        it('should parse subroutine variable declarations', () => {
            const cls = parseClass('MyClass', `
                class MyClass {
                    method void func() {
                        var int foo;
                        var boolean bar;
                        var String buz, blah;
                        var char cur;
                    }
                }
            `);
            const [sub] = expectSubroutineDec(
                cls.subroutineDecs[0],
                'method',
                'void',
                'func',
            );
            expectSubroutineVars(sub.subroutineBody, [
                ['int', 'foo'],
                ['boolean', 'bar'],
                ['String', 'buz', 'blah'],
                ['char', 'cur'],
            ]);
        });

        it('should not parse an invalid subroutine variable dec', () => {
            expectErrors(`
                class MyClass {
                    method void myMethod() {
                        var;
                    }
                }
            `);
            expectErrors(`
                class MyClass {
                    method void myMethod() {
                        var int;
                    }
                }
            `);
            expectErrors(`
                class MyClass {
                    method void myMethod() {
                        var int blah,;
                    }
                }
            `);
            expectErrors(`
                class MyClass {
                    method void myMethod() {
                        var int blah
                    }
                }
            `);
        });
    });

    describe('Statements', () => {
        it('should parse a let statement', () => {
            const cls = parseClass('MyClass', `
                class MyClass {
                    function void myFunc() {
                        let myVar = 1;
                    }
                }
            `);
            const [_sub, statements] = expectSubroutineDec(
                cls.subroutineDecs[0],
                'function',
                'void',
                'myFunc',
            );
            expect(statements.length).toBe(1);
            expectLetStatement(statements[0], 'myVar', 1);
        });

        it('should not parse an invalid let statement', () => {
            /** Missing variable name */
            expectErrors(`
                class MyClass {
                    function void myFunc() {
                        let;
                    }
                }
            `);
            /** Missing equal sign */
            expectErrors(`
                class MyClass {
                    function void myFunc() {
                        let myVar;
                    }
                }
            `);
            /** Missing expression */
            expectErrors(`
                class MyClass {
                    function void myFunc() {
                        let myVar =;
                    }
                }
            `);
            /** Missing semicolon */
            expectErrors(`
                class MyClass {
                    function void myFunc() {
                        let myVar = 1
                    }
                }
            `)
        });

        it('should parse an if statement', () => {
            const cls = parseClass('MyClass', `
                class MyClass {
                    function void myFunc() {
                        if (1 = 1) {}
                    }
                }
            `);
            const [_sub, statements] = expectSubroutineDec(
                cls.subroutineDecs[0],
                'function',
                'void',
                'myFunc',
            );
            expect(statements.length).toBe(1);
            const [,cons] = expectIfStatement(statements[0], false, 1, '=', 1);
            expect(cons.length).toBe(0);
        });

        it('should parse an if + else statement', () => {
            const cls = parseClass('MyClass', `
                class MyClass {
                    function void myFunc() {
                        if (1 = 1) {}
                        else {}
                    }
                }
            `);
            const [_sub, statements] = expectSubroutineDec(
                cls.subroutineDecs[0],
                'function',
                'void',
                'myFunc',
            );
            expect(statements.length).toBe(1);
            const [,cons] = expectIfStatement(statements[0], true, 1, '=', 1);
            expect(cons.length).toBe(0);
        });

        it('should not parse an invalid if statement', () => {
            /** Missing left paren */
            expectErrors(`
                class MyClass {
                    function void myFunc() {
                        if
                    }
                }
            `);
            /** Missing condition expression */
            expectErrors(`
                class MyClass {
                    function void myFunc() {
                        if (
                    }
                }
            `);
            /** Missing right paren */
            expectErrors(`
                class MyClass {
                    function void myFunc() {
                        if (true
                    }
                }
            `);
            /** Missing right paren */
            expectErrors(`
                class MyClass {
                    function void myFunc() {
                        if (true
                    }
                }
            `);
            /** Missing left brace */
            expectErrors(`
                class MyClass {
                    function void myFunc() {
                        if (true)
                    }
                }
            `);
            /** Missing right brace */
            expectErrors(`
                class MyClass {
                    function void myFunc() {
                        if (true) {
            `);
            /** Missing else block */
            expectErrors(`
                class MyClass {
                    function void myFunc() {
                        if (true) {}
                        else
            `);
            /** Invalid statements */
            expectErrors(`
                class MyClass {
                    function void myFunc() {
                        if (true) {
                            let;
                        }
                    }
                }   
            `);
        });
        
        it('should parse a while statement', () => {
            const cls = parseClass('MyClass', `
                class MyClass {
                    function void myFunc() {
                        while (1 = 1) {}
                    }
                }
            `);
            const [_sub, statements] = expectSubroutineDec(
                cls.subroutineDecs[0],
                'function',
                'void',
                'myFunc',
            );
            expect(statements.length).toBe(1);
            const [,block] = expectWhileStatement(statements[0], 1, '=', 1);
            expect(block.length).toBe(0);
        });

        it('should not parse an invalid while statement', () => {
            /** Missing condition */
            expectErrors(`
                class MyClass {
                    function void myFunc() {
                        while
                    }
                }
            `);
            /** Missing body */
            expectErrors(`
                class MyClass {
                    function void myFunc() {
                        while (1 = 1)
                    }
                }
            `);
        });

        it('should parse a do statement', () => {
            const cls = parseClass('MyClass', `
                class MyClass {
                    function void myFunc() {
                        do get(1, 2, 3);
                        do myObj.get("abc");
                    }
                }
            `);
            const [_sub, statements] = expectSubroutineDec(
                cls.subroutineDecs[0],
                'function',
                'void',
                'myFunc',
            );
            expect(statements.length).toBe(2);
            expectDoStatement(statements[0], 'get', 1, 2, 3);
            expectDoStatement(statements[1], 'myObj.get', '"abc"');
        });

        it('should not parse an invalid do statement', () => {
            /** Missing subroutine call */
            expectErrors(`
                class MyClass {
                    function void myFunc() {
                        do
                    }
                }
            `);
            /** Missing semicolon */
            expectErrors(`
                class MyClass {
                    function void myFunc() {
                        do myFunc()
                    }
                }
            `);
        });

        it('should parse a return statement', () => {
            const cls = parseClass('MyClass', `
                class MyClass {
                    function void myFunc() {
                        return;
                        return (1 + 1);
                    }
                }
            `);
            const [_sub, statements] = expectSubroutineDec(
                cls.subroutineDecs[0],
                'function',
                'void',
                'myFunc',
            );
            expect(statements.length).toBe(2);
            expectReturnStatement(statements[0]);
            expectReturnStatement(statements[1], [1, '+', 1]);
        });

        it('should not parse an invalid return statement', () => {
            /** Invalid expression */
            expectErrors(`
                class MyClass {
                    function void myFunc() {
                        return (1
                    }
                }
            `);
            /** Missing semi */
            expectErrors(`
                class MyClass {
                    function void myFunc() {
                        return true
                    }
                }
            `);
        });

        it('should not parse an invalid statement keyword', () => {
            expectErrors(`
                class MyClass {
                    function void myFunc() {
                        true;
                    }
                }
            `);
        });

        it('should not parse an invalid expression list', () => {
            /** Invalid expression */
            expectErrors(`
                class MyClass {
                    function void myFunc() {
                        do something((a,1);
                    }
                }
            `);

            /** Missing expression after comma */
            expectErrors(`
                class MyClass {
                    function void myFunc() {
                        do something(1,);
                    }
                }
            `);
        });
    });

    describe('Expressions', () => {
        it('should parse an integer literal', () => {
            const cls = parseClass('MyClass', `
                class MyClass {
                    function void myFunc() {
                        return 1;
                    }
                }
            `);
            const [_sub, statements] = expectSubroutineDec(
                cls.subroutineDecs[0],
                'function',
                'void',
                'myFunc',
            );
            expect(statements.length).toBe(1);
            expectReturnStatement(statements[0], 1);
        });

        it('should parse a string literal', () => {
            const cls = parseClass('MyClass', `
                class MyClass {
                    function void myFunc() {
                        return "Hello World";
                    }
                }
            `);
            const [_sub, statements] = expectSubroutineDec(
                cls.subroutineDecs[0],
                'function',
                'void',
                'myFunc',
            );
            expect(statements.length).toBe(1);
            expectReturnStatement(statements[0], '"Hello World"');
        });

        it('should parse a boolean literal', () => {
            const cls = parseClass('MyClass', `
                class MyClass {
                    function void myFunc() {
                        return true;
                        return false;
                    }
                }
            `);
            const [_sub, statements] = expectSubroutineDec(
                cls.subroutineDecs[0],
                'function',
                'void',
                'myFunc',
            );
            expect(statements.length).toBe(2);
            expectReturnStatement(statements[0], true);
            expectReturnStatement(statements[1], false);
        });

        it('should parse the null and this keywords', () => {
            const cls = parseClass('MyClass', `
                class MyClass {
                    function void myFunc() {
                        return null;
                        return this;
                    }
                }
            `);
            const [_sub, statements] = expectSubroutineDec(
                cls.subroutineDecs[0],
                'function',
                'void',
                'myFunc',
            );
            expect(statements.length).toBe(2);
            expectReturnStatement(statements[0], 'null');
            expectReturnStatement(statements[1], 'this');
        });

        it('should parse an identifier literal', () => {
            const cls = parseClass('MyClass', `
                class MyClass {
                    function void myFunc() {
                        return myVar;
                    }
                }
            `);
            const [_sub, statements] = expectSubroutineDec(
                cls.subroutineDecs[0],
                'function',
                'void',
                'myFunc',
            );
            expect(statements.length).toBe(1);
            expectReturnStatement(statements[0], 'myVar');
        });

        it('should parse a subroutine call', () => {
            const cls = parseClass('MyClass', `
                class MyClass {
                    function void myFunc() {
                        return something(1, 2);
                        return myObj.something((1 / 2));
                    }
                }
            `);
            const [_sub, statements] = expectSubroutineDec(
                cls.subroutineDecs[0],
                'function',
                'void',
                'myFunc',
            );
            expect(statements.length).toBe(2);
            expectReturnStatement(statements[0], new SubCall('something', 1, 2));
            expectReturnStatement(statements[1], new SubCall('myObj.something', [1, '/', 2]));
        });

        it('should parse a unary op term', () => {
            const cls = parseClass('MyClass', `
                class MyClass {
                    function void myFunc() {
                        return ~true;
                        return -1;
                    }
                }
            `);
            const [_sub, statements] = expectSubroutineDec(
                cls.subroutineDecs[0],
                'function',
                'void',
                'myFunc',
            );
            expect(statements.length).toBe(2);
            expectReturnStatement(statements[0], new UnaryOp('~', true));
            expectReturnStatement(statements[1], new UnaryOp('-', 1));
        });

        it('should parse a variable reference', () => {
            const cls = parseClass('MyClass', `
                class MyClass {
                    function void myFunc() {
                        return myVar;
                        return myVar[1];
                    }
                }
            `);
            const [_sub, statements] = expectSubroutineDec(
                cls.subroutineDecs[0],
                'function',
                'void',
                'myFunc',
            );
            expect(statements.length).toBe(2);
            expectReturnStatement(statements[0], 'myVar');
            expectReturnStatement(statements[1], new IndExp('myVar', 1));
        });

        it('should not parse invalid expressions', () => {
            expectErrors(`
                class MyClass {
                    function void myFunc() {
                        return myVar[;
                    }
                }
            `);
            expectErrors(`
                class MyClass {
                    function void myFunc() {
                        return myVar[1;
                    }
                }
            `);
            expectErrors(`
                class MyClass {
                    function void myFunc() {
                        return myVar.
                    }
                }
            `);
            expectErrors(`
                class MyClass {
                    function void myFunc() {
                        return myVar.something(1;
                    }
                }
            `);
            expectErrors(`
                class MyClass {
                    function void myFunc() {
                        return ~;
                    }
                }
            `);
            expectErrors(`
                class MyClass {
                    function void myFunc() {
                        return 1 + ;
                    }
                }
            `);
        });
    });
});

/** Parse an input string and return the result */
const parseInput = (input: string): [ClassObj | null, string[]] => {
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const parsed = parser.parseClass();
    const errors = parser.getErrors();
    return [parsed, errors];
}

/** Parse input and return valid class */
const parseClass = (name: string, input: string): ClassObj => {
    const [parsed, errors] = parseInput(input);
    expect(errors.length).toBe(0);
    const cls = expectClass(parsed, name);
    return cls;
}

/** Parse input and return errors */
const expectErrors = (input: string): string[] => {
    const [parsed, errors] = parseInput(input);
    expect(parsed).toBeNull();
    expect(errors.length).toBeGreaterThan(0);
    return errors;
}

/** Expect input to be a class object */
const expectClass = (value: unknown, name: string): ClassObj => {
    const cls = expectObj(value, ClassObj);
    expectObjLiteral(cls.classKeyword, KeywordObj, 'class');
    expectObjLiteral(cls.classNameIdentifier, IdentifierObj, name);
    expectObjLiteral(cls.lBraceSymbol, SymbolObj, '{');
    expectObjLiteral(cls.rBraceSymbol, SymbolObj, '}');
    return cls;
}

type ExpectedVar = [
    varType: 'field' | 'static',
    dataType: string,
    ...names: string[],
];

/** Expect class variables */
const expectClassVars = (cls: ClassObj, vars: ExpectedVar[]) => {
    expect(cls.classVarDecs.length).toBe(vars.length);
    cls.classVarDecs.forEach((value, i) => {
        const [varType, dataType, ...names] = vars[i];
        const dec = expectObj(value, ClassVarDecObj);
        expectObjLiteral(dec.classVarKeyword, KeywordObj, varType);
        expectDataType(dec.varType, dataType);
        dec.varNames.forEach((varName, i) => {
            expectObjLiteral(varName, IdentifierObj, names[i]);
        });
        expect(dec.commaSymbols.length).toBe(Math.max(names.length - 1, 0));
        dec.commaSymbols.forEach((value) => {
            expectObjLiteral(value, SymbolObj, ',')
        });
        expectObjLiteral(dec.semiSymbol, SymbolObj, ';');
    });
}

type ExpectedParam = [dataType: string, name: string];

/** Expect a subroutine declaration */
const expectSubroutineDec = (
    value: unknown,
    routineType: 'constructor' | 'method' | 'function',
    returnType: string,
    name: string,
    params: ExpectedParam[] = [],
): [SubroutineDecObj, StatementObj[]] => {
    const dec = expectObj(value, SubroutineDecObj);
    expectObjLiteral(dec.routineType, KeywordObj, routineType);
    expectDataType(dec.returnType, returnType);
    expectObjLiteral(dec.nameIdentifier, IdentifierObj, name);
    expectObjLiteral(dec.lParenSymbol, SymbolObj, '(');
    expect(dec.parameterList.parameters.length).toBe(params.length);
    expect(dec.parameterList.commaSymbols.length).toBe(Math.max(params.length - 1, 0));
    dec.parameterList.parameters.forEach(([dataType, paramName], i) => {
        const [expectedDataType, expectedParamName] = params[i];
        expect(dataType.token.literal).toBe(expectedDataType);
        expect(paramName.token.literal).toBe(expectedParamName);
    });
    expectObjLiteral(dec.rParenSymbol, SymbolObj, ')');
    const body = expectSubroutineBody(dec.subroutineBody);
    return [dec, body.statements.statements];
}

/** Expect a subroutine body object with left and right braces */
const expectSubroutineBody = (value: unknown): SubroutineBodyObj => {
    const body = expectObj(value, SubroutineBodyObj);
    expectObjLiteral(body.lBraceSymbol, SymbolObj, '{');
    expectObj(body.statements, StatementsObj);
    expectObjLiteral(body.rBraceSymbol, SymbolObj, '}');
    return body;
}

type ExpectedRoutineVar = [
    dataType: string,
    ...names: string[],
];

/** Expect subroutine variables */
const expectSubroutineVars = (body: SubroutineBodyObj, vars: ExpectedRoutineVar[]) => {
    expect(body.varDecs.length).toBe(vars.length);
    body.varDecs.forEach((value, i) => {
        const dec = expectObj(value, VarDecObj);
        const [dataType, ...names] = vars[i];
        expectObjLiteral(dec.varKeyword, KeywordObj, 'var');
        expectDataType(dec.varType, dataType);
        expect(dec.varNames.length).toBe(names.length);
        dec.varNames.forEach((name, i) => {
            expectObjLiteral(name, IdentifierObj, names[i])
        });
        expect(dec.commaSymbols.length).toBe(Math.max(names.length - 1, 0));
        dec.commaSymbols.forEach((com) => {
            expectObjLiteral(com, SymbolObj, ',')
        });
        expectObjLiteral(dec.semiSymbol, SymbolObj, ';');
    });
}

/** Expect a let statement */
const expectLetStatement = (
    value: unknown,
    varRef: VariableReference,
    ...expression: unknown[]
): LetStatementObj => {
    const stmt = expectObj(value, LetStatementObj);
    expectObjLiteral(stmt.letKeyword, KeywordObj, 'let');
    expectVariableReference(stmt.variable, varRef);
    expectObjLiteral(stmt.equalSymbol, SymbolObj, '=');
    expectExpression(stmt.expression, ...expression);
    expectObjLiteral(stmt.semiSymbol, SymbolObj, ';');
    return stmt;
}

/** Expect an if statement */
const expectIfStatement = (
    value: unknown,
    hasElse: boolean,
    ...condition: unknown[]
): [
    ifStatement: IfStatementObj,
    consequenceStatements: StatementObj[],
    alternativeStatements: StatementObj[] | null,
] => {
    const stmt = expectObj(value, IfStatementObj);
    expectObjLiteral(stmt.ifKeyword, KeywordObj, 'if');
    expectObjLiteral(stmt.lParenSymbol, SymbolObj, '(');
    expectExpression(stmt.conditionExpression, ...condition);
    expectObjLiteral(stmt.rParenSymbol, SymbolObj, ')');
    expectObjLiteral(stmt.consLBraceSymbol, SymbolObj, '{');
    const consequence = expectObj(stmt.consequenceStatements, StatementsObj);
    expectObjLiteral(stmt.consRBraceSymbol, SymbolObj, '}');
    if (hasElse) {
        expectObjLiteral(stmt.elseKeyword, KeywordObj, 'else');
        expectObjLiteral(stmt.altLBraceSymbol, SymbolObj, '{');
        const alt = expectObj(stmt.altStatements, StatementsObj);
        expectObjLiteral(stmt.altRBraceSymbol, SymbolObj, '}');
        return [stmt, consequence.statements, alt.statements];
    } else {
        expect(stmt.elseKeyword).toBeNull();
        expect(stmt.altLBraceSymbol).toBeNull();
        expect(stmt.altStatements).toBeNull();
        expect(stmt.altRBraceSymbol).toBeNull();
        return [stmt, consequence.statements, null];
    }
}

/** Expect a while statement */
const expectWhileStatement = (
    value: unknown,
    ...condition: unknown[]
): [
    whileStatement: WhileStatementObj,
    blockStatements: StatementObj[],
] => {
    const stmt = expectObj(value, WhileStatementObj);
    expectObjLiteral(stmt.whileKeyword, KeywordObj, 'while');
    expectObjLiteral(stmt.lParenSymbol, SymbolObj, '(');
    expectExpression(stmt.expression, ...condition);
    expectObjLiteral(stmt.rParenSymbol, SymbolObj, ')');
    expectObjLiteral(stmt.lBraceSymbol, SymbolObj, '{');
    const block = expectObj(stmt.statements, StatementsObj);
    expectObjLiteral(stmt.rBraceSymbol, SymbolObj, '}');
    return [stmt, block.statements];
}

/** Expect a while statement */
const expectDoStatement = (value: unknown, routine: string, ...args: unknown[]): DoStatementObj => {
    const stmt = expectObj(value, DoStatementObj);
    expectObjLiteral(stmt.doKeyword, KeywordObj, 'do');
    expectSubroutineCall(stmt.subroutineCall, routine, ...args);
    expectObjLiteral(stmt.semiSymbol, SymbolObj, ';');
    return stmt;
}

/** Expect a while statement */
const expectReturnStatement = (value: unknown, ...expression: unknown[]): ReturnStatementObj => {
    const stmt = expectObj(value, ReturnStatementObj);
    expectObjLiteral(stmt.returnKeyword, KeywordObj, 'return');
    if (!expression.length) {
        expect(stmt.expression).toBeNull(); // void
    } else {
        expectExpression(stmt.expression, ...expression);
    }
    expectObjLiteral(stmt.semiSymbol, SymbolObj, ';');
    return stmt;
}

/** Variable reference (name or index expression) */
type VariableReference = string | [
    identName: string,
    ...indexExpression: unknown[],
];

/** Expect a variable reference by name or index expression */
const expectVariableReference = (value: unknown, ref: VariableReference): IdentifierObj | IndexExpressionObj => {
    if (Array.isArray(ref)) {
        const [name, ...exp] = ref;
        const indExp = expectObj(value, IndexExpressionObj);
        expectObjLiteral(indExp.varIdentifier, IdentifierObj, name);
        expectObjLiteral(indExp.lBrackSymbol, SymbolObj, '[');
        expectExpression(indExp.indexExpression, ...exp);
        expectObjLiteral(indExp.rBrackSymbol, SymbolObj, ']');
        return indExp;
    } else {
        return expectObjLiteral(value, IdentifierObj, ref);
    }
}

/** Attempts to validate an expression based on a literal value */
const expectExpression = (value: unknown, ...termOps: unknown[]): ExpressionObj => {
    if (!termOps.length) {
        throw new Error('expectExpression function expected at least one term');
    }
    const exp = expectObj(value, ExpressionObj);
    let termIndex = 0;
    let opIndex = 0;
    termOps.forEach((termOp: unknown, i) => {
        /** Odd numbered termOps should be operators */
        if (i % 2 === 1) {
            if (typeof termOp !== 'string') {
                throw new Error('Odd numbered items should be strings');
            }
            expectObjLiteral(exp.operators[opIndex], SymbolObj, termOp);
            opIndex++;
        } else {
            expectTerm(exp.terms[termIndex], termOp);
            termIndex++;
        }
    });

    expect(exp.operators.length).toBe(opIndex);
    expect(exp.terms.length).toBe(termIndex);

    return exp;
}

class SubCall {
    public args: unknown[];
    constructor(public name: string, ...args: unknown[]) {
        this.args = args;
    }
}
class IndExp {
    public expressions: unknown[];
    constructor(public name: string, ...expressions: unknown[]) {
        this.expressions = expressions;
    }
}

class UnaryOp {
    constructor(public op: string, public term: unknown) {}
}


/** Expect a term */
const expectTerm = (value: unknown, literal: unknown): Term => {
    const term = expectObj(value, TermObj).term;
    /** Literal term */
    if (typeof literal === 'boolean' || typeof literal === 'number' || typeof literal === 'string') {
        if (typeof literal === 'boolean') {
            expectObjLiteral(term, KeywordObj, literal.toString());
        } else if (typeof literal === 'number') {
            const intConst = expectObjLiteral(term, IntegerConstObj, literal.toString());
            expect(intConst.value).toBe(literal);
        } else if (typeof literal === 'string') {
            if (/^".*"$/.test(literal)) {
                expectObjLiteral(term, StringConstObj, literal.replace(/"/g, ''));
            } else if (literal === 'this' || literal === 'null') {
                expectObjLiteral(term, KeywordObj, literal);
            } else {
                expectObjLiteral(term, IdentifierObj, literal);
            }
        }
    }
    /** Subroutine call */
    else if (literal instanceof SubCall) {
        expectSubroutineCall(term, literal.name, ...literal.args);
    }
    /** Unary operator term */
    else if (literal instanceof UnaryOp) {
        const unOp = expectObj(term, UnaryOpTermObj);
        expectObjLiteral(unOp.operator, SymbolObj, literal.op);
        expectTerm(unOp.term, literal.term);
    }
    /** Index expression */
    else if (literal instanceof IndExp) {
        expectVariableReference(term, [literal.name, ...literal.expressions]);
    }
    /** Grouped expression */
    else if (Array.isArray(literal)) {
        const group = expectObj(term, ExpressionGroupObj);
        expectObjLiteral(group.lParenSymbol, SymbolObj, '(');
        expectExpression(group.expression, ...literal);
        expectObjLiteral(group.rParenSymbol, SymbolObj, ')');
    }
    /** Unhandled */
    else {
        throw new Error('Unhandled term validation');
    }
    return term;
}

/** Expect an expression list object with comma symbols */
const expectExpressionList = (value: unknown, ...expressions: unknown[]) => {
    const expList = expectObj(value, ExpressionListObj);
    let commaIndex = 0;
    expressions.forEach((exp, i) => {
        if (i > 0) {
            expectObjLiteral(expList.commaSymbols[commaIndex], SymbolObj, ',');
            commaIndex++;
        }
        const termOps = [exp];
        expectExpression(expList.expressions[i], ...termOps);
    });
    expect(expList.commaSymbols.length).toBe(commaIndex);
    expect(expList.expressions.length).toBe(expressions.length);
}

/** Expect a subroutine call */
const expectSubroutineCall = (value: unknown, routine: string, ...args: unknown[]): SubroutineCallObj => {
    const sub = expectObj(value, SubroutineCallObj);
    /** Object and subroutine */
    if (/\./.test(routine)) {
        const [objLiteral, routineLiteral] = routine.split('.');
        expectObjLiteral(sub.objNameIdentifier, IdentifierObj, objLiteral);
        expectObjLiteral(sub.periodSymbol, SymbolObj, '.');
        expectObjLiteral(sub.subroutineNameIdentifier, IdentifierObj, routineLiteral);
    }
    /** Just the subroutine name */
    else {
        expect(sub.objNameIdentifier).toBeNull();
        expect(sub.periodSymbol).toBeNull();
        expectObjLiteral(sub.subroutineNameIdentifier, IdentifierObj, routine);
    }
    expectObjLiteral(sub.lParenSymbol, SymbolObj, '(');
    expectExpressionList(sub.expressionList, ...args);
    expectObjLiteral(sub.rParenSymbol, SymbolObj, ')');
    return sub;
}

/** Expect a data type string */
const expectDataType = (value: unknown, literal: string) => {
    if (
        literal === 'int' ||
        literal === 'char' ||
        literal === 'boolean' ||
        literal === 'void'
    ) {
        return expectObjLiteral(value, KeywordObj, literal);
    } else {
        return expectObjLiteral(value, IdentifierObj, literal);
    }
}

type ObjRef<T extends Obj> = new (...args: any[]) => T;

/** Ensures that a value is a specific object type and that it has a specific token literal value */
const expectObjLiteral = <T extends Obj>(value: unknown, expected: ObjRef<T>, literal: string) => {
    const obj = expectObj(value, expected);
    expect(obj.token.literal).toBe(literal);
    return obj;
}

/** Expects an object to be a specific type and will return that value as the type */
const expectObj = <T extends Obj>(value: unknown, expected: ObjRef<T>): T => {
    expect(value).toBeInstanceOf(expected);
    return value as T;
}