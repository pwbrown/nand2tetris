import { Lexer } from './lexer';
import { TokenType } from './token';

describe('Shared - Lexer', () => {
    it('should track line numbers and column numbers', () => {
        const input = [
            '',
            '// My inline comment',
            'push constant 4',
            '',
            '/*',
            '   My multiline',
            '   comment goes here',
            '*/',
            'push constant 2',
            'add',
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
            [3, 1, 'push'],
            [3, 6, 'constant'],
            [3, 15, '4'],
            [3, 16, '\n'],
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
            [10, 1, 'add'],
            [10, 4, '\n'],
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

        // main loop
        (LOOP)
            @R10
            D=M
            @END
            D;JEQ
            @R10
            M=M-1
            @LOOP
            0;JMP

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
            [TokenType.Assign, '='],
            [TokenType.Ident, 'A'],
            [TokenType.Newline, '\n'],
            // @R10
            [TokenType.At, '@'],
            [TokenType.Ident, 'R10'],
            [TokenType.Newline, '\n'],
            // M=D
            [TokenType.Ident, 'M'],
            [TokenType.Assign, '='],
            [TokenType.Ident, 'D'],
            [TokenType.Newline, '\n'],
            // Empty Line
            [TokenType.Newline, '\n'],
            // // main loop
            [TokenType.InlineComment, 'main loop'],
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
            [TokenType.Assign, '='],
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
            [TokenType.Assign, '='],
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
})