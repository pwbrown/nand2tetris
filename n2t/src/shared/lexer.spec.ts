/**
 * Lexer Test
 * Author      : Philip Brown
 * Source Code : https://github.com/pwbrown/nand2tetris/n2t/src/shared/lexer.spec.ts
 */

import { Lexer } from './lexer';
import { TokenType } from './token';

describe('Shared - Lexer', () => {
    it('should track line numbers and column numbers', () => {
        const input = [
            '\n// My inline comment',
            '\rpush constant 4',
            '\r\n/*',
            '   My multiline',
            '   comment goes here',
            '*/',
            'push constant 2',
            '\tadd',
            '',
            '/**',
            ' * My cool documentation',
            ' * goes here',
            ' */',
            'label LOOP',
            '    goto LOOP',
        ].join('\n');

        const expected: [line: number, col: number, literal: string][] = [
            // empty line (line 1)
            [1, 1, '\n'],
            // // My inline comment (line 2)
            [2, 1, 'My inline comment'],
            [2, 21, '\n'],
            // push constant 4 (line 3)
            [3, 1, '\r'],
            [3, 2, 'push'],
            [3, 7, 'constant'],
            [3, 16, '4'],
            [3, 17, '\n'],
            // empty line (line 4)
            [4, 1, '\n'],
            /* (line 5-8)
                My multiline
                comment goes here
            */
            [5, 1, 'My multiline comment goes here'],
            [8, 3, '\n'],
            // push constant 2 (line 9)
            [9, 1, 'push'],
            [9, 6, 'constant'],
            [9, 15, '2'],
            [9, 16, '\n'],
            // add (line 10)
            [10, 5, 'add'],
            [10, 8, '\n'],
            // empty line (line 11)
            [11, 1, '\n'],
            // comment (line 12-15)
            [12, 1, 'My cool documentation goes here'],
            [15, 4, '\n'],
            // label LOOP (line 16)
            [16, 1, 'label'],
            [16, 7, 'LOOP'],
            [16, 11, '\n'],
            // goto LOOP (line 17, indented 4)
            [17, 5, 'goto'],
            [17, 10, 'LOOP'],
            [17, 14, ''],
        ];

        const lexer = new Lexer(input);
        for (const [line, col, literal] of expected) {
            const token = lexer.nextToken();
            expect(token.line).toBe(line);
            expect(token.col).toBe(col);
            expect(token.literal).toBe(literal);
        }
    });
    
    it('should generate tokens for hack assembly', () => {
        const input = `
        // set R10 to 4
        @4
        D=A
        @R10
        M=D

        /* main loop */
        (LOOP)
            @R10
            D=M
            @END
            D;JEQ
            @R10
            M=M-1
            @LOOP
            0;JMP

        /** 
         * Another
         * comment
         */
        (END)
            @END
            0;JMP
        `;

        const expectedTokens: [type: TokenType, literal: string][] = [
            // Empty Line
            [TokenType.Newline, '\n'],
            // // set R10 to 4
            [TokenType.InlineComment, 'set R10 to 4'],
            [TokenType.Newline, '\n'],
            // @4
            [TokenType.At, '@'],
            [TokenType.IntConst, '4'],
            [TokenType.Newline, '\n'],
            // D=A
            [TokenType.Ident, 'D'],
            [TokenType.Equal, '='],
            [TokenType.Ident, 'A'],
            [TokenType.Newline, '\n'],
            // @R10
            [TokenType.At, '@'],
            [TokenType.Ident, 'R10'],
            [TokenType.Newline, '\n'],
            // M=D
            [TokenType.Ident, 'M'],
            [TokenType.Equal, '='],
            [TokenType.Ident, 'D'],
            [TokenType.Newline, '\n'],
            // Empty Line
            [TokenType.Newline, '\n'],
            // // main loop
            [TokenType.MultiComment, 'main loop'],
            [TokenType.Newline, '\n'],
            // (LOOP)
            [TokenType.LParen, '('],
            [TokenType.Ident, 'LOOP'],
            [TokenType.RParen, ')'],
            [TokenType.Newline, '\n'],
            // @R10
            [TokenType.At, '@'],
            [TokenType.Ident, 'R10'],
            [TokenType.Newline, '\n'],
            // D=M
            [TokenType.Ident, 'D'],
            [TokenType.Equal, '='],
            [TokenType.Ident, 'M'],
            [TokenType.Newline, '\n'],
            // @END
            [TokenType.At, '@'],
            [TokenType.Ident, 'END'],
            [TokenType.Newline, '\n'],
            // D;JEQ
            [TokenType.Ident, 'D'],
            [TokenType.Semi, ';'],
            [TokenType.Ident, 'JEQ'],
            [TokenType.Newline, '\n'],
            // @R10
            [TokenType.At, '@'],
            [TokenType.Ident, 'R10'],
            [TokenType.Newline, '\n'],
            // M=M-1
            [TokenType.Ident, 'M'],
            [TokenType.Equal, '='],
            [TokenType.Ident, 'M'],
            [TokenType.Minus, '-'],
            [TokenType.IntConst, '1'],
            [TokenType.Newline, '\n'],
            // @LOOP
            [TokenType.At, '@'],
            [TokenType.Ident, 'LOOP'],
            [TokenType.Newline, '\n'],
            // 0;JMP
            [TokenType.IntConst, '0'],
            [TokenType.Semi, ';'],
            [TokenType.Ident, 'JMP'],
            [TokenType.Newline, '\n'],
            // Empty Line
            [TokenType.Newline, '\n'],
            // Comment
            [TokenType.DocComment, 'Another comment'],
            [TokenType.Newline, '\n'],
            // (END)
            [TokenType.LParen, '('],
            [TokenType.Ident, 'END'],
            [TokenType.RParen, ')'],
            [TokenType.Newline, '\n'],
            // @END
            [TokenType.At, '@'],
            [TokenType.Ident, 'END'],
            [TokenType.Newline, '\n'],
            // 0;JMP
            [TokenType.IntConst, '0'],
            [TokenType.Semi, ';'],
            [TokenType.Ident, 'JMP'],
            [TokenType.Newline, '\n'],
            [TokenType.Eof, ''],
        ];

        const lexer = new Lexer(input);
        for (const [type, literal] of expectedTokens) {
            const token = lexer.nextToken();
            expect(token.type).toBe(type);
            expect(token.literal).toBe(literal);
        }
    });

    it('should generate tokens for jack vm language', () => {
        const input = `
        push constant 2    // push 2
        neg                // negate 2
        call Math.abs 1    // positive 2
        call Math.double 1 // double 2
        pop static 0
        label STOP         // end loop
        goto STOP
        
        function Math.double 1
            push argument 0
            push argument 0
            add
            return
        
        function Math.abs 1
            push argument 0
            lt
            if-goto NEG_TRUE
            push argument 0
            return
            label NEG_TRUE
            push argument 0
            neg
            return
        `;

        const expectedTokens: [type: TokenType, literal: string][] = [
            // empty line
            [TokenType.Newline, '\n'],
            // push constant 2 // push 2
            [TokenType.Ident, 'push'],
            [TokenType.Ident, 'constant'],
            [TokenType.IntConst, '2'],
            [TokenType.InlineComment, 'push 2'],
            [TokenType.Newline, '\n'],
            // neg             // negate 2
            [TokenType.Ident, 'neg'],
            [TokenType.InlineComment, 'negate 2'],
            [TokenType.Newline, '\n'],
            // call Math.abs 1  // positive 2
            [TokenType.Ident, 'call'],
            [TokenType.Ident, 'Math'],
            [TokenType.Period, '.'],
            [TokenType.Ident, 'abs'],
            [TokenType.IntConst, '1'],
            [TokenType.InlineComment, 'positive 2'],
            [TokenType.Newline, '\n'],
            // call Math.double 1   // double 2
            [TokenType.Ident, 'call'],
            [TokenType.Ident, 'Math'],
            [TokenType.Period, '.'],
            [TokenType.Ident, 'double'],
            [TokenType.IntConst, '1'],
            [TokenType.InlineComment, 'double 2'],
            [TokenType.Newline, '\n'],
            // pop static 0
            [TokenType.Ident, 'pop'],
            [TokenType.Static, 'static'],
            [TokenType.IntConst, '0'],
            [TokenType.Newline, '\n'],
            // label STOP      // end loop
            [TokenType.Ident, 'label'],
            [TokenType.Ident, 'STOP'],
            [TokenType.InlineComment, 'end loop'],
            [TokenType.Newline, '\n'],
            // goto STOP
            [TokenType.Ident, 'goto'],
            [TokenType.Ident, 'STOP'],
            [TokenType.Newline, '\n'],
            // empty line
            [TokenType.Newline, '\n'],
            // function Math.double 1
            [TokenType.Function, 'function'],
            [TokenType.Ident, 'Math'],
            [TokenType.Period, '.'],
            [TokenType.Ident, 'double'],
            [TokenType.IntConst, '1'],
            [TokenType.Newline, '\n'],
            // push argument 0
            [TokenType.Ident, 'push'],
            [TokenType.Ident, 'argument'],
            [TokenType.IntConst, '0'],
            [TokenType.Newline, '\n'],
            // push argument 0
            [TokenType.Ident, 'push'],
            [TokenType.Ident, 'argument'],
            [TokenType.IntConst, '0'],
            [TokenType.Newline, '\n'],
            // add
            [TokenType.Ident, 'add'],
            [TokenType.Newline, '\n'],
            // return
            [TokenType.Return, 'return'],
            [TokenType.Newline, '\n'],
            // empty line
            [TokenType.Newline, '\n'],
            // function Math.abs 1
            [TokenType.Function, 'function'],
            [TokenType.Ident, 'Math'],
            [TokenType.Period, '.'],
            [TokenType.Ident, 'abs'],
            [TokenType.IntConst, '1'],
            [TokenType.Newline, '\n'],
            // push argument 0
            [TokenType.Ident, 'push'],
            [TokenType.Ident, 'argument'],
            [TokenType.IntConst, '0'],
            [TokenType.Newline, '\n'],
            // lt
            [TokenType.Ident, 'lt'],
            [TokenType.Newline, '\n'],
            // if-goto NEG_TRUE
            [TokenType.If, 'if'],
            [TokenType.Minus, '-'],
            [TokenType.Ident, 'goto'],
            [TokenType.Ident, 'NEG_TRUE'],
            [TokenType.Newline, '\n'],
            // push argument 0
            [TokenType.Ident, 'push'],
            [TokenType.Ident, 'argument'],
            [TokenType.IntConst, '0'],
            [TokenType.Newline, '\n'],
            // return
            [TokenType.Return, 'return'],
            [TokenType.Newline, '\n'],
            // label NEG_TRUE
            [TokenType.Ident, 'label'],
            [TokenType.Ident, 'NEG_TRUE'],
            [TokenType.Newline, '\n'],
            // push argument 0
            [TokenType.Ident, 'push'],
            [TokenType.Ident, 'argument'],
            [TokenType.IntConst, '0'],
            [TokenType.Newline, '\n'],
            // neg
            [TokenType.Ident, 'neg'],
            [TokenType.Newline, '\n'],
            // return
            [TokenType.Return, 'return'],
            [TokenType.Newline, '\n'],
            [TokenType.Eof, ''],
        ];

        const lexer = new Lexer(input);
        for (const [type, literal] of expectedTokens) {
            const token = lexer.nextToken();
            expect(token.type).toBe(type);
            expect(token.literal).toBe(literal);
        }
    });

    it('should generate tokens for the jack language', () => {
        const input = `
            class MyClass {
                field String foo, bar;
                field Array fuz;

                /*
                 * Create my class
                 */
                constructor MyClass new(String initFoo) {
                    let foo = initFoo;
                    let bar = "My String";
                    let fuz = Array.new(initFoo.length());
                    return this;
                }

                // Dispose method
                method void dispose() {
                    do foo.dispose();
                    do bar.dispose();
                    do fuz.dispose();
                    return;
                }

                function int getFirstChar() {
                    var int curLength;
                    let curLength = 0 + 1 / 1 * 2;
                    let fuz[0] = curLength;
                    let fuz[1] = ~(0 | 1);
                    let fuz[2] = (curLength > 0) & (curLength < 10);
                    return 0;
                }
            }
        `;

        const expectedTokens: [type: TokenType, literal: string][] = [
            // empty line
            [TokenType.Newline, '\n'],
            // class MyClass {
            [TokenType.Class, 'class'],
            [TokenType.Ident, 'MyClass'],
            [TokenType.LBrace, '{'],
            [TokenType.Newline, '\n'],
            // field String foo, bar;
            [TokenType.Field, 'field'],
            [TokenType.Ident, 'String'],
            [TokenType.Ident, 'foo'],
            [TokenType.Comma, ','],
            [TokenType.Ident, 'bar'],
            [TokenType.Semi, ';'],
            [TokenType.Newline, '\n'],
            // field Array fuz;
            [TokenType.Field, 'field'],
            [TokenType.Ident, 'Array'],
            [TokenType.Ident, 'fuz'],
            [TokenType.Semi, ';'],
            [TokenType.Newline, '\n'],
            // empty line
            [TokenType.Newline, '\n'],
            // Comment
            [TokenType.MultiComment, 'Create my class'],
            [TokenType.Newline, '\n'],
            // constructor MyClass new(String initFoo) {
            [TokenType.Constructor, 'constructor'],
            [TokenType.Ident, 'MyClass'],
            [TokenType.Ident, 'new'],
            [TokenType.LParen, '('],
            [TokenType.Ident, 'String'],
            [TokenType.Ident, 'initFoo'],
            [TokenType.RParen, ')'],
            [TokenType.LBrace, '{'],
            [TokenType.Newline, '\n'],
            // let foo = initFoo;
            [TokenType.Let, 'let'],
            [TokenType.Ident, 'foo'],
            [TokenType.Equal, '='],
            [TokenType.Ident, 'initFoo'],
            [TokenType.Semi, ';'],
            [TokenType.Newline, '\n'],
            // let bar = initBar;
            [TokenType.Let, 'let'],
            [TokenType.Ident, 'bar'],
            [TokenType.Equal, '='],
            [TokenType.StringConst, 'My String'],
            [TokenType.Semi, ';'],
            [TokenType.Newline, '\n'],
            // let fuz = Array.new(initFoo.length());
            [TokenType.Let, 'let'],
            [TokenType.Ident, 'fuz'],
            [TokenType.Equal, '='],
            [TokenType.Ident, 'Array'],
            [TokenType.Period, '.'],
            [TokenType.Ident, 'new'],
            [TokenType.LParen, '('],
            [TokenType.Ident, 'initFoo'],
            [TokenType.Period, '.'],
            [TokenType.Ident, 'length'],
            [TokenType.LParen, '('],
            [TokenType.RParen, ')'],
            [TokenType.RParen, ')'],
            [TokenType.Semi, ';'],
            [TokenType.Newline, '\n'],
            // return this;
            [TokenType.Return, 'return'],
            [TokenType.This, 'this'],
            [TokenType.Semi, ';'],
            [TokenType.Newline, '\n'],
            // }
            [TokenType.RBrace, '}'],
            [TokenType.Newline, '\n'],
            // Empty Line
            [TokenType.Newline, '\n'],
            // Comment
            [TokenType.InlineComment, 'Dispose method'],
            [TokenType.Newline, '\n'],
            // method void dispose() {
            [TokenType.Method, 'method'],
            [TokenType.Void, 'void'],
            [TokenType.Ident, 'dispose'],
            [TokenType.LParen, '('],
            [TokenType.RParen, ')'],
            [TokenType.LBrace, '{'],
            [TokenType.Newline, '\n'],
            // do foo.dispose();
            [TokenType.Do, 'do'],
            [TokenType.Ident, 'foo'],
            [TokenType.Period, '.'],
            [TokenType.Ident, 'dispose'],
            [TokenType.LParen, '('],
            [TokenType.RParen, ')'],
            [TokenType.Semi, ';'],
            [TokenType.Newline, '\n'],
            // do bar.dispose();
            [TokenType.Do, 'do'],
            [TokenType.Ident, 'bar'],
            [TokenType.Period, '.'],
            [TokenType.Ident, 'dispose'],
            [TokenType.LParen, '('],
            [TokenType.RParen, ')'],
            [TokenType.Semi, ';'],
            [TokenType.Newline, '\n'],
            // do fuz.dispose();
            [TokenType.Do, 'do'],
            [TokenType.Ident, 'fuz'],
            [TokenType.Period, '.'],
            [TokenType.Ident, 'dispose'],
            [TokenType.LParen, '('],
            [TokenType.RParen, ')'],
            [TokenType.Semi, ';'],
            [TokenType.Newline, '\n'],
            // return;
            [TokenType.Return, 'return'],
            [TokenType.Semi, ';'],
            [TokenType.Newline, '\n'],
            // }
            [TokenType.RBrace, '}'],
            [TokenType.Newline, '\n'],
            // Empty line
            [TokenType.Newline, '\n'],
            // function int getFirstChar() {
            [TokenType.Function, 'function'],
            [TokenType.Int, 'int'],
            [TokenType.Ident, 'getFirstChar'],
            [TokenType.LParen, '('],
            [TokenType.RParen, ')'],
            [TokenType.LBrace, '{'],
            [TokenType.Newline, '\n'],
            // var int curLength;
            [TokenType.Var, 'var'],
            [TokenType.Int, 'int'],
            [TokenType.Ident, 'curLength'],
            [TokenType.Semi, ';'],
            [TokenType.Newline, '\n'],
            // let curLength = 0 + 1 / 1 * 2;
            [TokenType.Let, 'let'],
            [TokenType.Ident, 'curLength'],
            [TokenType.Equal, '='],
            [TokenType.IntConst, '0'],
            [TokenType.Plus, '+'],
            [TokenType.IntConst, '1'],
            [TokenType.Div, '/'],
            [TokenType.IntConst, '1'],
            [TokenType.Mult, '*'],
            [TokenType.IntConst, '2'],
            [TokenType.Semi, ';'],
            [TokenType.Newline, '\n'],
            // let fuz[0] = curLength;
            [TokenType.Let, 'let'],
            [TokenType.Ident, 'fuz'],
            [TokenType.LBrack, '['],
            [TokenType.IntConst, '0'],
            [TokenType.RBrack, ']'],
            [TokenType.Equal, '='],
            [TokenType.Ident, 'curLength'],
            [TokenType.Semi, ';'],
            [TokenType.Newline, '\n'],
            // let fuz[1] = ~(0 | 1);
            [TokenType.Let, 'let'],
            [TokenType.Ident, 'fuz'],
            [TokenType.LBrack, '['],
            [TokenType.IntConst, '1'],
            [TokenType.RBrack, ']'],
            [TokenType.Equal, '='],
            [TokenType.Neg, '~'],
            [TokenType.LParen, '('],
            [TokenType.IntConst, '0'],
            [TokenType.Or, '|'],
            [TokenType.IntConst, '1'],
            [TokenType.RParen, ')'],
            [TokenType.Semi, ';'],
            [TokenType.Newline, '\n'],
            // let fuz[2] = (curLength > 0) & (curLength < 10);
            [TokenType.Let, 'let'],
            [TokenType.Ident, 'fuz'],
            [TokenType.LBrack, '['],
            [TokenType.IntConst, '2'],
            [TokenType.RBrack, ']'],
            [TokenType.Equal, '='],
            [TokenType.LParen, '('],
            [TokenType.Ident, 'curLength'],
            [TokenType.Gt, '>'],
            [TokenType.IntConst, '0'],
            [TokenType.RParen, ')'],
            [TokenType.And, '&'],
            [TokenType.LParen, '('],
            [TokenType.Ident, 'curLength'],
            [TokenType.Lt, '<'],
            [TokenType.IntConst, '10'],
            [TokenType.RParen, ')'],
            [TokenType.Semi, ';'],
            [TokenType.Newline, '\n'],
            // return 0;
            [TokenType.Return, 'return'],
            [TokenType.IntConst, '0'],
            [TokenType.Semi, ';'],
            [TokenType.Newline, '\n'],
            // }
            [TokenType.RBrace, '}'],
            [TokenType.Newline, '\n'],
            // }
            [TokenType.RBrace, '}'],
            [TokenType.Newline, '\n'],
            // EOF
            [TokenType.Eof, ''],
        ];

        const lexer = new Lexer(input);
        for (const [type, literal] of expectedTokens) {
            const token = lexer.nextToken();
            expect(token.type).toBe(type);
            expect(token.literal).toBe(literal);
        }
    });
});