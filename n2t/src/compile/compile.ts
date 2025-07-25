/**
 * Compile
 * Author      : Philip Brown
 * Source Code : https://github.com/pwbrown/nand2tetris/n2t/src/compile/compile.ts
 */

import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Lexer } from '../shared/lexer';
import { Parser } from './parser';
import { FileReferences, Options } from '../utils';
import { toXMLString } from './xml';
import { Writer } from './writer';

/** Individually read and parse all Jack files and generate a VM file and token and object XML files for each Jack file */
export const compile = async (references: FileReferences, options: Options) => {
    /** Read and compile each Jack file */
    for (const ref of references.inputFiles) {
        /** Read file */
        const contents = await readFile(ref.path, { encoding: 'utf-8' });
        /** Parse the contents */
        const lexer = new Lexer(contents);
        const parser = new Parser(lexer);
        const programClass = parser.parseClass();
        /** Handle parser errors */
        const parserErrors = parser.getErrors();
        if (parserErrors.length) {
            console.error(`Failed to parse '${ref.path}':`);
            parserErrors.forEach((error) => {
                console.error(`  -- ${error}`);
            });
            process.exit(1);
        }

        if (programClass) {
            /** Create the writer and write all of the VM code */
            const outputFile = join(references.outDir || ref.dir, `${ref.name}.vm`);
            const writer = new Writer(programClass, outputFile, options.annotate);
            await writer.writeVM();
            if (options.verbose) {
                console.error('Finished compiling jack file:');
                console.error(`  -- Input   : ${ref.path}`);
                console.error(`  -- Outputs : ${outputFile}`);
            }
            /** Optionally build original XML syntax analyzer output */
            if (options.xml) {
                /** Build and write XML for all tokens */
                const tokenXMLOut = join(references.outDir || ref.dir, `${ref.name}T.xml`);
                const tokenXMLString = toXMLString(parser.tokensToXMLNode(), { includeProps: options.sourceMap });
                await writeFile(tokenXMLOut, tokenXMLString, { encoding: 'utf-8' });
                /** Build and write XML for the parse tree */
                const programXMLOut = join(references.outDir || ref.dir, `${ref.name}.xml`);
                const programXMLString = toXMLString(programClass.toXMLNode(), { includeProps: options.sourceMap });
                await writeFile(programXMLOut, programXMLString, { encoding: 'utf-8' });
                if (options.verbose) {
                    console.error(`               - ${tokenXMLOut}`);
                    console.error(`               - ${programXMLOut}`);;
                }
            }
        }
    }
}