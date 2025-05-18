/**
 * BaseLexer
 * Author      : Philip Brown
 * Source Code : https://github.com/pwbrown/nand2tetris/n2t/src/shared/base-lexer.ts
 * Notes       : Modified from https://github.com/pwbrown/ts-monkey/blob/main/src/lexer/lexer.ts
 */

import { BaseToken, BaseTokenType } from './base-token';

/** Default number of spaces associated with a single tab character */
const DEFAULT_TAB_SIZE = 4;

export class BaseLexer {
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

    /** Returns the next token of the input string */
    public nextToken(): BaseToken {
        this.skipSpacesAndTabs();

        /** Record the starting position of the token */
        const line = this.curLine;
        const col = this.curCol;

        /** Shortcut method to generate a token and read a single character (optional) */
        const newToken = (type: BaseTokenType, literal: string, read = true): BaseToken => {
            if (read) {
                this.readChar();
            }
            return { line, col, type, literal };
        };

        switch(this.char) {
            case '':
                return newToken(BaseTokenType.Eof, '');
            case '\n':
                this.nextLine();
                return newToken(BaseTokenType.Newline, '\n');
            case '\r':
                /** Handle CRLF (carriage return line feed) */
                if (this.peekChar() === '\n') {
                    this.readChar();
                    this.nextLine();
                    return newToken(BaseTokenType.Newline, '\n');
                } else {
                    return newToken(BaseTokenType.Illegal, '\r');
                }
            case '/':
                const peekChar = this.peekChar();
                if (peekChar === '/' || peekChar === '*') {
                    const [comment, commentType] = this.readComment();
                    return newToken(commentType, comment);
                } else {
                    return newToken(BaseTokenType.Div, '/');
                }
            case '(':
                return newToken(BaseTokenType.LParen, '(');
            case ')':
                return newToken(BaseTokenType.RParen, ')');
            case '[':
                return newToken(BaseTokenType.LBrack, '[');
            case ']':
                return newToken(BaseTokenType.RBrack, ']');
            case '{':
                return newToken(BaseTokenType.LBrace, '{');
            case '}':
                return newToken(BaseTokenType.RBrace, '}');
            case ',':
                return newToken(BaseTokenType.Comma, ',');
            case ';':
                return newToken(BaseTokenType.Semi, ';');
            case '=':
                if (this.peekChar() === '=') {
                    this.readChar();
                    return newToken(BaseTokenType.Equal, '==');
                } else {
                    return newToken(BaseTokenType.Assign, '=');
                }
            case '.':
                return newToken(BaseTokenType.Period, '.');
            case '+':
                return newToken(BaseTokenType.Plus, '+');
            case '-':
                return newToken(BaseTokenType.Minus, '-');
            case '*':
                return newToken(BaseTokenType.Mult, '*');
            case '&':
                return newToken(BaseTokenType.And, '&');
            case '|':
                return newToken(BaseTokenType.Or, '|');
            case '~':
                return newToken(BaseTokenType.Neg, '~');
            case '<':
                if (this.peekChar() === '=') {
                    this.readChar();
                    return newToken(BaseTokenType.Lte, '<=');
                } else {
                    return newToken(BaseTokenType.Lt, '<');
                }
            case '>':
                if (this.peekChar() === '=') {
                    this.readChar();
                    return newToken(BaseTokenType.Gte, '>=');
                } else {
                    return newToken(BaseTokenType.Gt, '>');
                }
            case '@':
                return newToken(BaseTokenType.At, '@');
            default:
                /** TODO Handle complex types */
                return newToken(BaseTokenType.Unknown, this.char);
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
        /** Read the initial quotes and read up until the ending quotes */
        do {
            this.readChar();
        } while (this.char && this.char !== '"');
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
    private readComment(): [comment: string, type: BaseTokenType] {
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
            return [comment, BaseTokenType.InlineComment];
        }
        /** Handle multiline comments */
        else {
            let type = BaseTokenType.MultiComment;
            if (peek === '*') {
                type = BaseTokenType.DocComment;
                this.readChar();
            }
            const start = this.pos + 1;
            while (
                this.char && (
                    this.char !== '*' ||
                    this.peekChar() === '/'
                )
            ) {
                if (this.char === '\n') {
                    this.nextLine();
                }
                this.readChar();
            }
            const end = this.pos;
            const comment = this.input.substring(start, end).trim();
            /** Read in the final asterisk character before returning */
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