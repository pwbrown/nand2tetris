/**
 * Translate Parser
 * Author      : Philip Brown
 * Source Code : https://github.com/pwbrown/nand2tetris/n2t/src/translate/parser.ts
 */

import { BaseParser } from "../shared/base-parser";
import { TokenType } from "../shared/token";
import { Command } from "./command";
import { ARITHMETIC_OPERATOR, MEMORY_SEGMENT, PUSH_POP_OPERATOR } from "./constants";

export class Parser extends BaseParser {
    /** Final list of commands */
    private commands: Command[] = [];
    
    /** Parse the VM code into a list of commands */
    public parseCommands() {
        while(!this.curTokenIs(TokenType.Eof)) {
            /** Ignore empty lines and comments */
            if (this.curTokenIsEol()) {
                this.nextToken();
                continue;
            }
            else if (this.curTokenIs(TokenType.Function)) {
                this.parseFunctionCommand();
            }
            else if (this.curTokenIs(TokenType.Return)) {
                this.parseReturnCommand();
            }
            else if(this.curTokenIs(TokenType.Ident)) {
                const literal = this.curToken.literal;
                switch(literal) {
                    case 'label':
                        this.parseLabelCommand();
                        break;
                    case 'goto':
                        this.parseGotoCommand();
                        break;
                    case 'if':
                        this.parseIfCommand();
                        break;
                    case 'call':
                        this.parseCallCommand();
                        break;
                    default:
                        if (ARITHMETIC_OPERATOR[literal]) {
                            this.parseArithmeticCommand();
                        } else if (PUSH_POP_OPERATOR[literal]) {
                            this.parsePushPopCommand();
                        } else {
                            this.tokenError(this.curToken, `unrecognized literal '${literal}'`);
                        }
                        break;
                }
            }
            this.nextToken();
        }
        return this.commands;
    }

    private parseFunctionCommand() {
        const token = this.curToken;
        /** Parse function name and arguments */
        let localStr = '';
        let name = '';
        while(!this.peekTokenIsEol()) {
            this.nextToken();
            const literal = this.curToken.literal;
            if (this.peekTokenIsEol() && this.curTokenIs(TokenType.IntConst)) {
                localStr = literal;
            } else {
                name += literal;
            }
        }
        if (!name) {
            this.tokenError(this.peekToken, `expected function name but got '${this.peekToken.type}`);
            return null;
        }
        if (!localStr) {
            this.tokenError(this.peekToken, `expected int local but got '${this.peekToken.type}'`);
            return null;
        }
        this.commands.push({
            type: 'Function',
            line: token.line,
            name,
            local: parseInt(localStr, 10),
        });
    }

    /** Parse a return command */
    private parseReturnCommand() {
        const token = this.curToken;
        if (!this.expectPeekEol()) {
            return null;
        }
        this.commands.push({
            type: 'Return',
            line: token.line,
        });
    }

    /** Parse a label comamnd */
    private parseLabelCommand() {
        const token = this.curToken;
        let label = '';
        while (!this.peekTokenIsEol()) {
            this.nextToken();
            label += this.curToken.literal;
        }
        if (!label) {
            this.tokenError(this.curToken, 'label command expected a label');
            return null;
        }
        this.commands.push({
            type: 'Label',
            line: token.line,
            label,
        });
    }

    /** Parse a goto command */
    private parseGotoCommand() {
        const token = this.curToken;
        let label = '';
        while (!this.peekTokenIsEol()) {
            this.nextToken();
            label += this.curToken.literal;
        }
        if (!label) {
            this.tokenError(this.curToken, 'goto command expected a label');
            return null;
        }
        this.commands.push({
            type: 'Goto',
            line: token.line,
            label,
        });
    }

    /** Parse an if-goto command */
    private parseIfCommand() {
        const token = this.curToken;
        if (!this.expectPeek(TokenType.Minus)) {
            return null;
        }
        if (!this.expectPeek(TokenType.Ident) || this.curToken.literal !== 'goto') {
            return null;
        }
        let label = '';
        while (!this.peekTokenIsEol()) {
            this.nextToken();
            label += this.curToken.literal;
        }
        if (!label) {
            this.tokenError(this.curToken, 'if-goto command expected a label');
            return null;
        }
        this.commands.push({
            type: 'If',
            line: token.line,
            label,
        });
    }

    /** Parse a call command */
    private parseCallCommand() {
        const token = this.curToken;
        /** Parse function name and arguments */
        let argsStr = '';
        let name = '';
        while(!this.peekTokenIsEol()) {
            this.nextToken();
            const literal = this.curToken.literal;
            if (this.peekTokenIsEol() && this.curTokenIs(TokenType.IntConst)) {
                argsStr = literal;
            } else {
                name += literal;
            }
        }
        if (!name) {
            this.tokenError(this.peekToken, `expected function name but got '${this.peekToken.type}`);
            return null;
        }
        if (!argsStr) {
            this.tokenError(this.peekToken, `expected int args but got '${this.peekToken.type}'`);
            return null;
        }
        this.commands.push({
            type: 'Call',
            line: token.line,
            name,
            args: parseInt(argsStr, 10),
        });
    }

    /** Parse an arithmetic command */
    private parseArithmeticCommand() {
        const token = this.curToken;
        if (!this.expectPeekEol()) {
            return null;
        }
        this.commands.push({
            type: 'Arithmetic',
            line: token.line,
            operator: token.literal,
        });
    }

    /** Parse a Push/Pop Command */
    private parsePushPopCommand() {
        const token = this.curToken;
        /** Parse memory segment */
        if (
            !this.peekTokenIs(TokenType.Ident) &&
            !this.peekTokenIs(TokenType.Static) &&
            !this.peekTokenIs(TokenType.This) &&
            !MEMORY_SEGMENT[this.peekToken.literal]
        ) {
            this.tokenError(this.peekToken, `expected valid segment name but got '${this.peekToken.literal}'`);
            return null;
        }
        this.nextToken();
        const segment = this.curToken.literal;
        /** Parse segment operand */
        if (!this.expectPeek(TokenType.IntConst)) {
            return null;
        }
        const operand = parseInt(this.curToken.literal, 10);
        /** Check EOL */
        if (!this.expectPeekEol()) {
            return null;
        }
        this.commands.push({
            type: 'PushPop',
            line: token.line,
            operator: token.literal,
            segment,
            operand,
        });
    }
}