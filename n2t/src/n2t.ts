/**
 * N2T Command Line Entrypoint
 * Author      : Philip Brown
 * Source Code : https://github.com/pwbrown/nand2tetris/n2t/src/n2t.ts
 */

import { assemble } from './assemble/assemble';
import { translate } from './translate/translate';
import { compile } from './compile/compile';
import { getFileReferences, parseOptions, FileReferences, Options } from './utils';

/** Map of commands to the appropriate file extension */
const COMMANDS: { [command: string]: string } = {
    'compile': '.jack',
    'translate': '.vm',
    'assemble': '.asm',
};

const EXTENSIONS: { [ext: string]: (refs: FileReferences, options?: Options) => Promise<void> } = {
    '.jack': compile,
    '.vm': translate,
    '.asm': assemble,
}

const main = async (processArgs: string[]) => {
    /** Parse options into logical components */
    const [args, options] = parseOptions(processArgs);

    let references: FileReferences;

    /** Check if the first argument is an action ('compile', 'translate', 'assemble') */
    if (COMMANDS[args[0]]) {
        /** Get references that match the file extension associated with the action */
        references = await getFileReferences(args[1], COMMANDS[args[0]]);
    }
    /** Derive the action automatically based on the highest priority extension */
    else {
        references = await getFileReferences(args[0]);
    }

    /** Validate references */
    if (!references.inputFiles.length) {
        console.error('No input files to process!');
        process.exit(1);
    }
    
    /** Perform the action based on the extension */
    await EXTENSIONS[references.ext as string](references, options);
};

main(process.argv);