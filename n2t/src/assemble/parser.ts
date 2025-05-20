import { BaseParser } from "../shared/base-parser";
import { TokenType } from "../shared/token";
import { COMPUTATION, DEST, JUMP } from "./constants";

/** Address Instruction */
export interface AInstruction {
    type: 'A';
    line: number;
    addr: string | number;
}

/** Computational Instruction */
export interface CInstruction {
    type: 'C';
    line: number;
    dest: string | null;
    destBin: string;
    comp: string;
    compBin: string;
    jump: string | null;
    jumpBin: string;
}

/** Label Instruction */
export interface LInstruction {
    type: 'L';
    line: number;
    label: string;
}

/** Instruction */
export type Instruction = AInstruction | CInstruction | LInstruction;

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
        while (!this.curTokenIs(TokenType.Assign) && !this.curTokenIs(TokenType.Semi) && !this.curTokenIsEol()) {
            dest += this.curToken.literal;
            this.nextToken();
        }
        /** Handle computation */
        if (this.curTokenIs(TokenType.Assign)) {
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
        if (dest && !DEST[dest]) {
            return this.tokenError(token, `invalid destination '${dest}'`);
        }
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
            destBin: DEST[dest || 'null'],
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