/**
 * Author: Philip Brown
 * Language: TypeScript
 * Source Code: https://github.com/pwbrown/n2t/tree/main/project7/src/main.ts
 */

import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';
import { getFileReferences } from './utils';
import { Command, parseLine } from './parser';
import { translateAndWrite, TranslateOptions } from './translate';

/** Regular expression to match command line option (format: '--OPT_NAME' or '-OPT_NAME') */
const OPT_REGEX = /^--?[a-z]+$/i;

/** Main Entrypoint */
const main = async (processArgs: string[]) => {
  /** Parse arguments supplied to the program (not including options) */
  const args = processArgs.slice(2).filter((arg) => !OPT_REGEX.test(arg));
  
  /** Parse command line options (format = '--OPT_NAME') */
  const options = processArgs
    .filter((arg) => OPT_REGEX.test(arg))
    .reduce<{ [opt: string]: boolean }>((all, opt) => ({
      ...all,
      [opt.replace(/^--?/, '').toLowerCase()]: true,
    }), {});
  
  /** Retrieve file references */
  const fileReferences = await getFileReferences(args[0]);

  /** Parse each input file into a list of VM commands */
  const translateOptions: TranslateOptions = {
    argOpts: options,
    output: fileReferences.outputFilePath,
    inputs: [],
    bootstrap: fileReferences.isDir,
  };

  for (const { path, name } of fileReferences.inputFiles) {
    /** Read input file line-by-line and parse each line into vm commands */
    const input = createReadStream(path, { encoding: 'utf-8' });
    const rl = createInterface({ input, crlfDelay: Infinity });
    const commands: Command[] = [];
    const errors: Error[] = [];
    for await (const line of rl) {
      try {
        const command = parseLine(line);
        /** Empty lines and comment-only lines will be parsed as null */
        if (command) {
          commands.push(command);
        }
      } catch(e) {
        /** Only track the first 10 errors */
        if (errors.length < 10 && e instanceof Error) {
          errors.push(e);
        }
      }
    }
    
    /** Report parsing errors if necessary */
    if (errors.length) {
      console.error('Translator Failed with Errors (Only showing first 10):');
      errors.forEach((err) => {
        console.log(`  - ${err.message}`);
      });
      process.exit(1);
    }

    /** Add parsed commands and file name as a translation input */
    translateOptions.inputs.push({ name, commands })
  }

  /** Translate the commands into assembly and write to the output file */
  await translateAndWrite(translateOptions);

  console.log('VM Code Translated Successfully!');
}

main(process.argv);