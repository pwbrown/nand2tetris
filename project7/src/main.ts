#!/usr/bin/env node

import { createReadStream } from 'node:fs';
import { resolve } from 'node:path';
import { stat } from 'node:fs/promises';
import { createInterface } from 'node:readline';
import { Command, parseLine } from './parser';

/** Main Entrypoint */
const main = async (cmdArgs: string[]) => {
  /** Check for input file */
  const inputFile = cmdArgs[2] ? resolve(cmdArgs[2]) : undefined;
  if (!inputFile || !stat(inputFile)) {
    throw new Error('Input file was not provided or does not exist');
  }
  const input = createReadStream(resolve(inputFile), { encoding: 'utf-8' });
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
  debugger;
}

main(process.argv);

//     /** Read input file, parse lines into instructions, and track parser errors */
//     const input = createReadStream(resolve(inputFile), { encoding: 'utf-8' });
//     const rl = createInterface({ input, crlfDelay: Infinity });
//     const instructions: Instruction[] = [];
//     const errors: Error[] = [];
//     for await (const line of rl) {
//       try {
//         const instruction = parseLine(line);
//         /** Empty lines and comment-only lines will be parsed as null */
//         if (instruction) {
//           instructions.push(instruction);
//         }
//       } catch(e) {
//         /** Only track the first 10 errors */
//         if (errors.length < 10 && e instanceof Error) {
//           errors.push(e);
//         }
//       }
//     }

//     /** Report errors and exit if necessary */
//     if (errors.length) {
//       console.error('Assembly Failed with Errors (Only showing first 10):');
//       errors.forEach((err) => {
//         console.log(`  - ${err.message}`);
//       });
//       process.exit(1);
//     }

//     /** Build the symbol map and assemble the final hack output */
//     const symbolMap = buildSymbolMap(instructions);
//     await assemble(instructions, symbolMap, outputFile);

//     console.log('Finished Assembling!');
//   });

// program.parseAsync();