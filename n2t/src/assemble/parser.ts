/**
 * Assembly Parser
 * Author      : Philip Brown
 * Source Code : https://github.com/pwbrown/nand2tetris/n2t/src/assemble/parser.ts
 */

import { BaseParser } from '../shared/base-parser';
import { TokenType } from '../shared/token';
import { COMPUTATION, DEST_ORDER, JUMP } from './constants';
import { Instruction } from './instruction';

/** Assembly Parser */
export class Parser extends BaseParser {
    /** Final list of instructions */
    private instructions: Instruction[] = [];

    /** Parse the hack assembly and return a list of instructions */
    public parseInstructions() {
        while(!this.curTokenIs(TokenType.Eof)) {
            /** Ignore empty lines and comments */
            if (this.curTokenIsEol()) {
                this.nextToken();
                continue;
            }
            /** Parse A Instruction */
            else if (this.curTokenIs(TokenType.At)) {
                this.parseAInstruction();
            }
            /** Parse L Instruction */
            else if (this.curTokenIs(TokenType.LParen)) {
                this.parseLInstruction();
            }
            /** Parse all others as C Instructions */
            else {
                this.parseCInstruction();
            }
            this.nextToken();
        }
        return this.instructions;
    }

    /** Parse an A (Address) Instruction */
    private parseAInstruction() {
        const token = this.curToken;
        /** Catch missing address error */
        if (this.peekTokenIsEol()) {
            return this.tokenError(token, 'missing an address for the address instruction');
        }
        /** Parse direct address number */
        else if (this.peekTokenIs(TokenType.IntConst)) {
            this.nextToken();
            const addr = parseInt(this.curToken.literal, 10);
            if (!this.expectPeekEol()) {
                return null;
            }
            this.instructions.push({
                type: 'A',
                line: token.line,
                addr,
            });
        }
        /** Parse label address: Consume all tokens until the end of the line */
        else {
            let label: string = '';
            while (!this.peekTokenIsEol()) {
                this.nextToken();
                label += this.curToken.literal;
            }
            this.instructions.push({
                type: 'A',
                line: token.line,
                addr: label,
            });
        }
    }

    /** Parse a C (Computation) Instruction */
    private parseCInstruction() {
        const token = this.curToken;
        let dest: string | null = null;
        let comp = '';
        let jump: string | null = null;
        /** Gather any token until assignment, semi, or EOL as the destination */
        dest = '';
        while (!this.curTokenIs(TokenType.Equal) && !this.curTokenIs(TokenType.Semi) && !this.curTokenIsEol()) {
            dest += this.curToken.literal;
            this.nextToken();
        }
        /** Handle computation */
        if (this.curTokenIs(TokenType.Equal)) {
            this.nextToken();
            /** Gather until semi or Eol */
            while (!this.curTokenIs(TokenType.Semi) && !this.curTokenIsEol()) {
                comp += this.curToken.literal;
                this.nextToken();
            }
            if (!comp) {
                return this.tokenError(this.curToken, 'computation string cannot be empty');
            }
        }
        /** Handle computation/destination resolution */
        if (!comp) {
            comp = dest;
            dest = null;
            if (!comp) {
                return this.tokenError(this.curToken, 'computation string cannot be empty');
            }
        }
        /** Handle jump */
        if (this.curTokenIs(TokenType.Semi)) {
            if (!this.expectPeek(TokenType.Ident)) {
                this.nextToken();
                return null;
            }
            jump = this.curToken.literal;
            this.nextToken();
        }
        /** C Instruction should be done now */
        if (!this.expectCurEol()) {
            return null;
        }
        /** Validate components */
        if (!COMPUTATION[comp]) {
            return this.tokenError(token, `invalid computation '${comp}'`);
        }
        if (jump && !JUMP[jump]) {
            return this.tokenError(token, `invalid jump '${jump}'`);
        }
        this.instructions.push({
            type: 'C',
            line: token.line,
            dest,
            destBin: getDestBin(dest || 'null'),
            comp,
            compBin: COMPUTATION[comp],
            jump,
            jumpBin: JUMP[jump || 'null'],
        });
    }

    /** Parse an L (Label) Instruction */
    private parseLInstruction() {
        const token = this.curToken;
        let label = '';
        /** Consume up until the closing paren */
        while (!this.peekTokenIs(TokenType.RParen) && !this.peekTokenIsEol()) {
            this.nextToken();
            label += this.curToken.literal;
        }
        if (!label) {
            this.tokenError(token, 'L instruction is missing a label');
            return null;
        }
        if (!this.expectPeek(TokenType.RParen)) {
            return null;
        }
        if (!this.expectPeekEol()) {
            return null;
        }
        this.instructions.push({
            type: 'L',
            line: token.line,
            label,
        });
    }
}

/** Receives a destination string in any order and returns the binary representation */
export const getDestBin = (destStr: string): string => {
    if (destStr === 'null') {
        return '000';
    }
    const bits: string[] = ['0', '0', '0'];
    for (let i = 0; i < destStr.length; i += 1) {
        const destInd = DEST_ORDER.indexOf(destStr[i]);
        if (destInd !== -1) {
            bits[destInd] = '1';
        }
    }
    return bits.join('');
}