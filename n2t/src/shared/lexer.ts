/**
 * Lexer
 * Author      : Philip Brown
 * Source Code : https://github.com/pwbrown/nand2tetris/n2t/src/shared/lexer.ts
 * Notes       : Modified from https://github.com/pwbrown/ts-monkey/blob/main/src/lexer/lexer.ts
 */

import { Token, TokenType } from './token';

/** Default number of spaces associated with a single tab character */
const DEFAULT_TAB_SIZE = 4;

/** List of builtin keywords (for Jack specifically) */
export const KEYWORDS: { [keyword: string]: TokenType } = {
    class: TokenType.Class,
    constructor: TokenType.Constructor,
    method: TokenType.Method,
    function: TokenType.Function,
    int: TokenType.Int,
    boolean: TokenType.Boolean,
    char: TokenType.Char,
    void: TokenType.Void,
    var: TokenType.Var,
    static: TokenType.Static,
    field: TokenType.Field,
    let: TokenType.Let,
    do: TokenType.Do,
    if: TokenType.If,
    else: TokenType.Else,
    while: TokenType.While,
    return: TokenType.Return,
    true: TokenType.True,
    false: TokenType.False,
    null: TokenType.Null,
    this: TokenType.This,
}

export class Lexer {
    private _skipComments = false;
    private _skipNewlines = false;

    /** Source input tracking */
    private curLine = 1;  // Current line number within the input
    private curCol = 0;   // Current column number within the current line

    /** Character tracking */
    private pos = -1;      // Current character index within the input
    private char = '';    // Current character

    constructor(private input: string) {
        /**
         * Reads the first character into this.char and
         * sets this.pos to 0, and this.curCol to 1 */
        this.readChar();
    }

    /** Set the functionality to skip comment tokens */
    public skipComments() {
        this._skipComments = true;
        return this;
    }
    
    /** Set the functionality to skip newline tokens */
    public skipNewlines() {
        this._skipNewlines = true;
        return this;
    }

    /** Returns the next token of the input string */
    public nextToken(): Token {
        this.skipSpacesAndTabs();

        /** Record the starting position of the token */
        const line = this.curLine;
        const col = this.curCol;

        /** Shortcut method to generate a token and read a single character (optional) */
        const newToken = (type: TokenType, literal: string, read = true): Token => {
            if (read) {
                this.readChar();
            }
            /** Handle token skipping */
            if (type === TokenType.Comment && this._skipComments) {
                return this.nextToken();
            } else if (type === TokenType.Newline && this._skipNewlines) {
                return this.nextToken();
            } else {
                return { line, col, type, literal };
            }
        };

        switch(this.char) {
            case '':
                return newToken(TokenType.Eof, '');
            case '\n':
                this.nextLine();
                return newToken(TokenType.Newline, '\n');
            case '\r':
                /** Handle CRLF (carriage return line feed) */
                if (this.peekChar() === '\n') {
                    this.readChar();
                    this.nextLine();
                    return newToken(TokenType.Newline, '\n');
                } else {
                    return newToken(TokenType.Illegal, '\r');
                }
            case '/':
                const peekChar = this.peekChar();
                if (peekChar === '/' || peekChar === '*') {
                    const [comment, commentType] = this.readComment();
                    return newToken(commentType, comment, false);
                } else {
                    return newToken(TokenType.Div, '/');
                }
            case '(':
                return newToken(TokenType.LParen, '(');
            case ')':
                return newToken(TokenType.RParen, ')');
            case '[':
                return newToken(TokenType.LBrack, '[');
            case ']':
                return newToken(TokenType.RBrack, ']');
            case '{':
                return newToken(TokenType.LBrace, '{');
            case '}':
                return newToken(TokenType.RBrace, '}');
            case ',':
                return newToken(TokenType.Comma, ',');
            case ';':
                return newToken(TokenType.Semi, ';');
            case '=':
                return newToken(TokenType.Equal, '=');
            case '.':
                return newToken(TokenType.Period, '.');
            case '+':
                return newToken(TokenType.Plus, '+');
            case '-':
                return newToken(TokenType.Minus, '-');
            case '*':
                return newToken(TokenType.Mult, '*');
            case '&':
                return newToken(TokenType.And, '&');
            case '|':
                return newToken(TokenType.Or, '|');
            case '~':
                return newToken(TokenType.Neg, '~');
            case '<':
                return newToken(TokenType.Lt, '<');
            case '>':
                return newToken(TokenType.Gt, '>');
            case '@':
                return newToken(TokenType.At, '@');
            case '"':
                return newToken(TokenType.StringConst, this.readString());
            default:
                /** Parse Number */
                if (isDigit(this.char)) {
                    return newToken(TokenType.IntConst, this.readDigits(), false);
                }
                /** Parse Identifier/Keyword */
                else if (isLetter(this.char)) {
                    const ident = this.readIdentifier();
                    if (KEYWORDS[ident]) {
                        return newToken(KEYWORDS[ident], ident, false);
                    } else {
                        return newToken(TokenType.Ident, ident, false);
                    }
                } else {
                    return newToken(TokenType.Unknown, this.char);
                }
        }
    }

    /** Read the next input character and increment the position and col number */
    private readChar() {
        this.char = this.peekChar();
        this.pos += 1;
        this.curCol += 1;
        return this.char;
    }

    /** Peek at the next input character */
    private peekChar() {
        const peekPos = this.pos + 1;
        if (peekPos >= this.input.length) {
            return '';
        } else {
            return this.input[peekPos];
        }
    }

    /**
     * Reads an identifier which starts with a letter, and can contain
     * letters, digits, and underscores. The caller of this function will
     * have confirmed the first character as a letter
     */
    private readIdentifier() {
        const start = this.pos;
        while(isLetter(this.char) || isDigit(this.char) || this.char === '_') {
            this.readChar();
        }
        const end = this.pos;
        return this.input.substring(start, end);
    }

    /** Read any characters surrounded by double quotes */
    private readString() {
        const start = this.pos + 1;
        /** Read the initial quotes and read up until the ending quotes or newline (not allowed) */
        do {
            this.readChar();
        } while (this.char && this.char !== '"' && this.char !== '\n');
        const end = this.pos;
        return this.input.substring(start, end);
    }

    /** Read consecutive digits and return a number */
    private readDigits() {
        const start = this.pos;
        while (isDigit(this.char)) {
            this.readChar();
        }
        const end = this.pos;
        return this.input.substring(start, end);
    }

    /** Reads different types of comments */
    private readComment(): [comment: string, type: TokenType] {
        this.readChar();
        const cur = this.char;
        const peek = this.peekChar();
        /** Handle Inline Comment (Read to the end of the line) */
        if (cur === '/') {
            const start = this.pos + 1;
            while(this.char && this.char !== '\n' && this.char !== '\r') {
                this.readChar();
            }
            const end = this.pos;
            const comment = this.input.substring(start, end).trim();
            return [comment, TokenType.Comment];
        }
        /** Handle multiline comments */
        else {
            const type = TokenType.Comment;
            if (peek === '*') {
                this.readChar();
            }
            const start = this.pos + 1;
            while (this.char && (this.char !== '*' || this.peekChar() !== '/')) {
                if (this.char === '\n') {
                    this.nextLine();
                }
                this.readChar();
            }
            const end = this.pos;
            /** Get comment string and remove newlines, extra whitespace, and leading asterisks */
            const comment = this.input
                .substring(start, end)
                .trim()
                .split('\n')
                .map((line) => line.trim().replace(/^[*]+/, '').trim())
                .join(' ');
            /** Read in the final asterisk and slash characters before returning */
            this.readChar();
            this.readChar();
            return [comment, type];
        }
    }

    /** Reads and skips over all spaces and tab characters */
    private skipSpacesAndTabs() {
        while(this.char === ' ' || this.char === '\t') {
            /** readChar increments the col number by 1, so if it's a tab increment remaining spaces */
            if (this.char === '\t') {
                this.curCol += DEFAULT_TAB_SIZE - 1;
            }
            this.readChar();
        }
    }

    /** Sets position values to the start of the next line */
    private nextLine() {
        this.curLine += 1;
        this.curCol = 0;
    }
}

/** Checks if a single character is a letter */
const isLetter = (char: string): boolean => {
    return (
        ('a' <= char && char <= 'z') ||
        ('A' <= char && char <= 'Z')
    );
}

/** Checks if a single characters is a numeric digit */
const isDigit = (char: string): boolean => {
    return '0' <= char && char <= '9';
}