/**
 * N2T Command Line Entrypoint
 * Author      : Philip Brown
 * Source Code : https://github.com/pwbrown/nand2tetris/n2t/src/n2t.ts
 */

import { assemble } from "./assemble/assemble";
import { getFileReferences, parseOptions } from "./utils";

const main = async (processArgs: string[]) => {
    /** Parse options into logical components */
    const [args, options] = parseOptions(processArgs);

    /** Get all file references */
    const references = await getFileReferences(args[0]);
    if (!references.inputFiles.length) {
        console.error('No input files to process!');
        process.exit(1);
    }

    /** Switch between extensions */
    switch(references.ext as string) {
        case '.jack':
        case '.vm':
            console.error('Not Implemented Yet');
            process.exit(1);
        case '.asm':
            await assemble(references);
            break;
    }
};

main(process.argv);