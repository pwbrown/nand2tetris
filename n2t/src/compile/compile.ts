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

/** Individually read and parse all Jack files and generate a VM file and token and object XML files for each Jack file */
export const compile = async (references: FileReferences, options: Options) => {
    /** Handle options */
    const includeProps = !!options['source-map'];

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
            /** Build and write XML for all tokens */
            const tokenXMLOut = join(ref.dir, `${ref.name}T.xml`);
            const tokenXMLString = toXMLString(parser.tokensToXMLNode(), { includeProps });
            await writeFile(tokenXMLOut, tokenXMLString, { encoding: 'utf-8' });
            /** Build and write XML for the parse tree */
            const programXMLOut = join(ref.dir, `${ref.name}.xml`);
            const programXMLString = toXMLString(programClass.toXMLNode(), { includeProps });
            await writeFile(programXMLOut, programXMLString, { encoding: 'utf-8' });
            console.error('Finished parsing jack file:');
            console.error(`  -- Input   : ${ref.path}`);
            console.error(`  -- Outputs :`);
            console.error(`               - ${tokenXMLOut}`);
            console.error(`               - ${programXMLOut}`);;
        }
    }
}