import { Parser } from './parser';
import { Lexer } from '../shared/lexer';
import { ClassObj, SubroutineDecObj } from './object';

describe('Compile - Parser', () => {

    describe('Class', () => {
        it('should parse an empty class', () => {
            parseClass('MyClass', `
                class MyClass {}
            `);
        });
    
        it('should fail if the first token is not class', () => {
            parseErrors('var int blah');
        });
    
        it('should fail if class is missing identifier', () => {
            parseErrors('class {}');
        });
    
        it('should fail if the class is missing braces', () => {
            parseErrors('class MyClass');
            parseErrors('class MyClass {');
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
            parseErrors(`class MyClass { field; }`);
            parseErrors(`class MyClass { field int; }`);
            parseErrors(`class MyClass { field int myVar,; }`);
            parseErrors(`class MyClass { field int myVar }`);
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
const parseErrors = (input: string): string[] => {
    const [parsed, errors] = parseInput(input);
    expect(parsed).toBeNull();
    expect(errors.length).toBeGreaterThan(0);
    return errors;
}

/** Expect input to be a class object */
const expectClass = (value: unknown, name: string): ClassObj => {
    expect(value).toBeInstanceOf(ClassObj);
    const cls = value as ClassObj;
    expect(cls.classNameIdentifier.token.literal).toBe(name);
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
    cls.classVarDecs.forEach((dec, i) => {
        const [varType, dataType, ...names] = vars[i];
        expect(dec.commaSymbols.length).toBe(names.length - 1);
        expect(dec.classVarKeyword.token.literal).toBe(varType);
        expect(dec.varType.token.literal).toBe(dataType);
        expect(dec.varNames.map((name) => name.token.literal)).toEqual(names);
    });
}

type ExpectedParam = [dataType: string, name: string];

/** Expect a subroutine declaration */
const expectSubroutineDec = (
    value: unknown,
    routineType: 'constructor' | 'method' | 'function',
    returnType: string,
    name: string,
    params: ExpectedParam[],
): SubroutineDecObj => {
    expect(value).toBeInstanceOf(SubroutineDecObj);
    const dec = value as SubroutineDecObj;
    expect(dec.routineType.token.literal).toBe(routineType);
    expect(dec.returnType.token.literal).toBe(returnType);
    expect(dec.nameIdentifier.token.literal).toBe(name);
    expect(dec.parameterList.parameters.length).toBe(params.length);
    expect(dec.parameterList.commaSymbols.length).toBe(params.length - 1);
    dec.parameterList.parameters.forEach(([dataType, paramName], i) => {
        const [expectedDataType, expectedParamName] = params[i];
        expect(dataType.token.literal).toBe(expectedDataType);
        expect(paramName.token.literal).toBe(expectedParamName);
    });
    return dec;
}