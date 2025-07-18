/**
 * N2T Command Line Entrypoint
 * Author      : Philip Brown
 * Source Code : https://github.com/pwbrown/nand2tetris/n2t/src/n2t.ts
 */

import { join, basename } from 'node:path';
import { program } from 'commander';
import { FileReferences, Options, getFileReferences } from './utils';
import { compile } from './compile/compile';
import { translate } from './translate/translate';
import { assemble } from './assemble/assemble';

/** Path to the Jack operating system files */
const OS_PATH = join(__dirname, '../os');

/** Action handler definition */
type ActionHandler = (source: string, destination: string | undefined, options: Options) => Promise<FileReferences>;

/** Action to compile Jack code into VM code */
const compileAction: ActionHandler = async (source, destination, options) => {
    /** Get file references */
    const references = await getFileReferences({
        input: source,
        output: destination,
        extension: '.jack',
    });
    if (!references.inputFiles.length) {
        console.error('No ".jack" files to process');
        process.exit(1);
    }
    /** Compile input files first */
    await compile(references, options);
    /** Compile operating system files if requested */
    if (options.copyOs) {
        const osReferences = await getFileReferences({
            input: OS_PATH,
            output: destination,
            extension: '.jack',
            name: options.name,
        });
        await compile(osReferences, options);
    }
    return references;
}

/** Action to translate Jack VM code to Hack assembly code */
const translateAction: ActionHandler = async (source, destination, options) => {
    const references = await getFileReferences({
        input: source,
        output: destination,
        extension: '.vm',
        name: options.name,
    });
    if (!references.inputFiles.length) {
        console.error('No ".vm" files to process');
        process.exit(1);
    }
    /** Translate input */
    await translate(references, options);
    return references;
}

/** Action to assemble Hack assembly code into Hack binary */
const assembleAction: ActionHandler = async (source, destination, options) => {
    const references = await getFileReferences({
        input: source,
        output: destination,
        extension: '.asm',
        name: options.name,
    });
    if (!references.inputFiles.length) {
        console.error('No ".asm" files to process');
        process.exit(1);
    }
    /** Assemble input */
    await assemble(references, options);
    return references;
}

/** Action to fully compile, translate, and assemble Jack code into Hack binary instructions */
const hackAction: ActionHandler = async (source, destination, options) => {
    /** Step 1: Compile source files and optionally the OS */
    const references = await compileAction(source, destination, options);
    /** Step 2: Translate source files (prioritize original destination path if provided) */
    await translateAction(destination || source, destination, {
        ...options,
        name: references.dir ? basename(references.dir) : references.inputFiles[0].name,
    });
    /** Step 3: Assemble final binary (prioritize destination path again) */
    await assembleAction(destination || source, destination, options);
    return references;
}

/** Default action for legacy support where the action is inferred from the source file extensions */
const defaultAction: ActionHandler = async (source, destination, options) => {
    /** Let the getFileReferences function choose an extension based on a priority order (.jack, .vm, .asm) */
    const references = await getFileReferences({
        input: source,
        output: destination,
    });
    if (!references.inputFiles.length) {
        console.error('No input files to process');
        process.exit(1);
    }
    /** Choose the action based on the input */
    if (references.ext === '.jack') {
        await compile(references, options);
    } else if (references.ext === '.vm') {
        await translate(references, options);
    } else {
        await assemble(references, options);
    }
    return references;
}

/** Wrapper around an action handler to pass options */
const actionWrapper = (handler: ActionHandler) => async (source: string, destination: string | undefined) => {
    await handler(source, destination, program.opts());
}

/** ALL Options */
program
    .option('-v, --verbose', 'output additional information to stdout', false)
    .option('-a, --annotate', 'annotate compiled/translated code with comments', false)
    .option('-c, --copy-os', 'copy the compiled os code to the destination', false)
    .option('-x, --xml', 'generate xml output for tokenizer and parse tree representations', false)
    .option('-s, --source-map', 'annotate xml output with line/column numbers', false);

/** Compile Command */
program
    .command('compile <source> [destination]')
    .description('compile Jack code into Jack VM code')
    .action(actionWrapper(compileAction));

/** Translate Command */
program
    .command('translate <source> [destination]')
    .description('translate Jack VM Code into Hack assembly code')
    .action(actionWrapper(translateAction));

/** Assemble Command */
program
    .command('assemble <source> [destination]')
    .description('assemble Hack assembly code into Hack binary instructions')
    .action(actionWrapper(assembleAction));

/** Build Command */
program
    .command('hack <source> [destination]')
    .description('compiles, translates, and assembles Jack code into Hack binary instructions')
    .action(actionWrapper(hackAction));

/** Default Command */
program
    .argument('<source>', 'source file or directory')
    .argument('[destination]', 'destination directory (output is generated in-place if not provided)')
    .action(actionWrapper(defaultAction));

/** Entrypoint */
const main = async () => {
    await program.parseAsync(process.argv);
}

main();