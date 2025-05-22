/**
 * Assemble
 * Author      : Philip Brown
 * Source Code : https://github.com/pwbrown/nand2tetris/n2t/src/assemble/assemble.ts
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Parser } from './parser';
import { Writer } from './writer';
import { FileReferences } from '../utils';
import { Lexer } from '../shared/lexer';

/** Individually parses and assembles all hack .asm files into .hack binary files */
export const assemble = async (references: FileReferences) => {
    for (const ref of references.inputFiles) {
        /** Read file */
        const contents = await readFile(ref.path, { encoding: 'utf-8' });
        /** Parse the contents */
        const lexer = new Lexer(contents);
        const parser = new Parser(lexer);
        const instructions = parser.parseInstructions();
        /** Handle parser errors */
        const parserErrors = parser.getErrors();
        if (parserErrors.length) {
            console.error(`Failed to parse '${ref.path}':`);
            parserErrors.forEach((error) => {
                console.error(`  -- ${error}`);
            });
        }
        /** Build the symbol map and write to the output file */
        const outputFile = join(ref.dir, `${ref.name}.hack`);
        const writer = new Writer(instructions, outputFile);
        writer.buildSymbolMap();
        await writer.writeBinary();

        console.error('Finished assembling hack assembly file:');
        console.error(`  -- Input  : ${ref.path}`);
        console.error(`  -- Output : ${outputFile}`);
    }
}