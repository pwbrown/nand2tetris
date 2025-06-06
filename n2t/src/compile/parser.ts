/**
 * Compile Parser
 * Author      : Philip Brown
 * Source Code : https://github.com/pwbrown/nand2tetris/n2t/src/compile/parser.ts
 */

import { BaseParser } from "../shared/base-parser";
import { Lexer } from "../shared/lexer";
import { TokenType } from "../shared/token";
import { ClassObj, ClassVarDecObj, IdentifierObj, KeywordObj, SubroutineDecObj, SymbolObj } from "./object";

export class Parser extends BaseParser {
    constructor(lexer: Lexer) {
        lexer
            .skipComments()
            .skipNewlines();
        super(lexer);
    }

    /** Parse the program class */
    public parseClass(): ClassObj | null {
        if (!this.curTokenIs(TokenType.Class)) {
            this.tokenError(this.curToken, `expected class but got ${this.curToken.type}`);
            return null;
        }
        const classKeyword = new KeywordObj(this.curToken);
        if (!this.expectPeek(TokenType.Ident)) {
            return null;
        }
        const className = new IdentifierObj(this.curToken);
        if (!this.expectPeek(TokenType.LBrace)) {
            return null;
        }
        const lBrace = new SymbolObj(this.curToken);
        const varDecs = this.parseClassVarDecs();
    }

    /** Parse zero or more class variable declarations */
    private parseClassVarDecs(): ClassVarDecObj[] | null {
        const varDecs: ClassVarDecObj[] = [];
        while(this.peekTokenIs(TokenType.Field, TokenType.Static)) {
            const varDec = this.parseClassVarDec();
            if (!varDec) {
                return null;
            }
            varDecs.push(varDec);
        }
        return varDecs;
    }

    /** Parse a single class variable declaration */
    private parseClassVarDec(): ClassVarDecObj | null {
        /** Get keyword (field or static) */
        this.nextToken();
        const varKeyword = new KeywordObj(this.curToken);
        /** Get data type (int, char, boolean, or ClassName) */
        if (!this.expectPeek(
            TokenType.Int,
            TokenType.Char,
            TokenType.Boolean,
            TokenType.Ident
        )) {
            return null;
        }
        const varType = this.curTokenIs(TokenType.Ident)
            ? new IdentifierObj(this.curToken)
            : new KeywordObj(this.curToken);
        /** Get variable names */
        const varNames: IdentifierObj[] = [];
        const commaSymbols: SymbolObj[] = [];
        if (!this.expectPeek(TokenType.Ident)) {
            return null;
        }
        varNames.push(new IdentifierObj(this.curToken));
        while (this.peekTokenIs(TokenType.Comma)) {
            this.nextToken();
            commaSymbols.push(new SymbolObj(this.curToken));
            if (!this.expectPeek(TokenType.Ident)) {
                return null;
            }
            varNames.push(new IdentifierObj(this.curToken));
        }
        /** Get semicolon */
        if (!this.expectPeek(TokenType.Semi)) {
            return null;
        }
        const semiSymbol = new SymbolObj(this.curToken);
        /** Assemble final variable declaration and push */
        return new ClassVarDecObj(
            varKeyword,
            varType,
            varNames,
            commaSymbols,
            semiSymbol,
        );
    }

    /** Parse zero or more subroutine declarations */
    private parseSubroutineDecs(): SubroutineDecObj[] | null {
        const subroutineDecs: SubroutineDecObj[] = [];
        while (this.peekTokenIs(TokenType.Constructor, TokenType.Method, TokenType.Function)) {
            const subroutineDec = this.parseSubroutineDec();
            if (!subroutineDec) {
                return null;
            }
            subroutineDecs.push(subroutineDec);
        }
        return subroutineDecs;
    }

    /** Parse a single class subroutine declaration */
    private parseSubroutineDec(): SubroutineDecObj | null {
        /**  */
    }
}