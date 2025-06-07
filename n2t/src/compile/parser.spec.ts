import { Parser } from './parser';
import { Lexer } from '../shared/lexer';
import {
    ClassObj,
    ClassVarDecObj,
    IdentifierObj,
    KeywordObj,
    Obj,
    SubroutineBodyObj,
    SubroutineDecObj,
    SymbolObj,
    VarDecObj,
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
            const sub = expectSubroutineDec(
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

    // describe('Statements', () => {
    //     it('should parse a let statement', () => {
    //         const cls = parseClass('MyClass', `
    //             class MyClass {
    //                 function void myFunc() {
    //                     let myVar = 1;
    //                 }
    //             }
    //         `);
    //         const sub = expectSubroutineDec(
    //             cls.subroutineDecs[0],
    //             'function',
    //             'void',
    //             'mFunc',
    //         );
    //     });
    // });
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
): SubroutineDecObj => {
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
    expectSubroutineBody(dec.subroutineBody);
    return dec;
}

/** Expect a subroutine body object with left and right braces */
const expectSubroutineBody = (value: unknown): SubroutineBodyObj => {
    const body = expectObj(value, SubroutineBodyObj);
    expectObjLiteral(body.lBraceSymbol, SymbolObj, '{');
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

// const expectLetStatement = (
//     value: unknown,
//     name: string,
//     isIndex = false,
// ): LetStatementObj => {
//     expect(value).toBeInstanceOf(LetStatementObj);
//     const stmt = value as LetStatementObj;
//     expectObjLiteral(stmt.letKeyword, 'let');
//     if (isIndex) {
//         expect(stmt.variable).toBeInstanceOf(IndexExpressionObj);
//         const indExp = stmt.variable as IndexExpressionObj;
//         expectObjLiteral(indExp.lBrackSymbol, '[');

//     }

// }

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
}

/** Expects an object to be a specific type and will return that value as the type */
const expectObj = <T extends Obj>(value: unknown, expected: ObjRef<T>): T => {
    expect(value).toBeInstanceOf(expected);
    return value as T;
}