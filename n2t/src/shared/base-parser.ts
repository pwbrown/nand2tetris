/**
 * Base Parser
 * Author      : Philip Brown
 * Source Code : https://github.com/pwbrown/nand2tetris/n2t/src/shared/base-parser.ts
 */

import { Lexer } from "./lexer";
import { Token, TokenType } from "./token";

/** Base parser class with helper methods built in */
export class BaseParser {
    protected curToken: Token;
    protected peekToken: Token;
    protected errors: string[] = [];
    protected allTokens: Token[] = [];

    constructor(protected lexer: Lexer) {
        this.curToken = lexer.nextToken();
        this.peekToken = lexer.nextToken();
        this.allTokens.push(this.curToken);
        this.allTokens.push(this.peekToken);
    }

    /** Returns all parser errors */
    public getErrors() {
        return [...this.errors];
    }

    /** Update the current token with the next token from the lexer */
    protected nextToken() {
        this.curToken = this.peekToken;
        this.peekToken = this.lexer.nextToken();
        this.allTokens.push(this.peekToken);
    }

    /** Check if the current token is a specific type */
    protected curTokenIs(...types: TokenType[]) {
        return types.some((type) => this.curToken.type === type);
    }

    /** Checks if the next token is a specific type */
    protected peekTokenIs(...types: TokenType[]) {
        return types.some((type) => this.peekToken.type === type);
    }

    /** Checks if the current token is the end of the line */
    protected curTokenIsEol() {
        return this.isEol(this.curToken.type);
    }

    /** Checks if the peek token is the end of the line */
    protected peekTokenIsEol() {
        return this.isEol(this.peekToken.type);
    }

    /** Indicates if the next token represents the end of the line */
    protected isEol(type: TokenType) {
        return (
            type === TokenType.Comment ||
            type === TokenType.Newline ||
            type === TokenType.Eof
        );
    }

    /** Goes to the next token if the peek token is a specific type */
    protected expectPeek(...types: TokenType[]) {
        if (this.peekTokenIs(...types)) {
            this.nextToken();
            return true;
        } else {
            this.peekError(...types);
            return false;
        }
    }

    /** Expects all remaining tokens to be either comments, newline, or EOF and will consume */
    protected expectPeekEol() {
        if (this.peekTokenIsEol()) {
            this.nextToken();
            return true;
        } else {
            this.tokenError(this.peekToken, `expected end of line, but got ${this.peekToken.type}`);
            return false;
        }
    }

    /** Expects all remaining tokens to be either comments, newline, or EOF and will consume */
    protected expectCurEol() {
        if (!this.curTokenIsEol()) {
            this.tokenError(this.curToken, `expected end of line, but got ${this.curToken.type}`);
            return false;
        }
        return true;
    }

    /** Appends an error for a mismatched peek token type */
    protected peekError(...types: TokenType[]) {
        const message = types.length === 1
            ? types[0]
            : `one of (${types.join(' | ')})`
        return this.tokenError(this.peekToken, `expected next token to be ${message}, got ${this.peekToken.type} instead`);
    }

    /** Append an error to the errors list (with the token line and column number) */
    protected tokenError(token: Token, message: string) {
        this.errors.push(`parsing error (line ${token.line}, col ${token.col}): ${message}`);
        return null;
    }
}