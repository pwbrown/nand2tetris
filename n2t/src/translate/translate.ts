/**
 * Translate
 * Author      : Philip Brown
 * Source Code : https://github.com/pwbrown/nand2tetris/n2t/src/translate/translate.ts
 */

import { readFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { Parser } from './parser';
import { Writer, WriterInput } from './writer';
import { FileReferences, Options } from '../utils';
import { Lexer } from '../shared/lexer';

/** Individually read and parse all VM files and generate a single combined assembly file */
export const translate = async (references: FileReferences, options: Options) => {
    /** Keep track of all parsed inputs */
    const inputs: WriterInput[] = [];
    
    /** Read and parse all input VM files */
    for (const ref of references.inputFiles) {
        /** Read file */
        const contents = await readFile(ref.path, { encoding: 'utf-8' });
        /** Parse the contents */
        const lexer = new Lexer(contents);
        const parser = new Parser(lexer);
        const commands = parser.parseCommands();
        /** Handle parser errors */
        const parserErrors = parser.getErrors();
        if (parserErrors.length) {
            console.error(`Failed to parse '${ref.path}':`);
            parserErrors.forEach((error) => {
                console.error(`  -- ${error}`);
            });
        }
        /** Append to input list */
        inputs.push({
            name: ref.name,
            commands,
        });
    }

    /** Create the writer and write all of the assembly code */
    const inputPath = references.dir
        ? references.dir
        : references.inputFiles[0].path;
    const outputFile = references.dir
        ? join(references.dir, `${basename(references.dir)}.asm`)
        : join(references.inputFiles[0].dir, `${references.inputFiles[0].name}.asm`);
    const writer = new Writer({
        outputFile,
        inputs,
        bootstrap: !!references.dir,
        cliOpts: options,
    });
    await writer.writeAssembly();

    console.error('Finished building hack assembly from VM code:');
    console.error(`  -- Input  : ${inputPath}`);
    console.error(`  -- Output : ${outputFile}`);
}