/**
 * N2T Utils
 * Author      : Philip Brown
 * Source Code : https://github.com/pwbrown/nand2tetris/n2t/src/utils.ts
 */

import { dirname, basename, extname, resolve, join } from 'node:path';
import { stat, readdir } from 'node:fs/promises';

/** Command line arguments in the order they appear */
type Args = string[];

/** Command line options map */
export interface Options {
    [opt: string]: boolean;
}

/** Regular expression to match command line option (format: '--OPT_NAME' or '-abc') */
const OPT_REGEX = /^--?[a-z][a-z-]+$/i;

/** Parse the process arguments and return arguments and options map */
export const parseOptions = (processArgs: string[]): [args: Args, options: Options] => {
    /** Parse arguments supplied to the program */
    const args: Args = processArgs.slice(2).filter((arg) => !OPT_REGEX.test(arg));

    /** Parse command line options (format = '--OPT_NAME') */
    const options = processArgs
        .filter((arg) => OPT_REGEX.test(arg))
        .reduce<Options>((all, opt) => {
            if (opt.startsWith('--')) {
                all[opt.replace(/^--/, '').toLowerCase()] = true;
            } else {
                opt.replace(/^-/, '')
                    .toLowerCase()
                    .split('')
                    .forEach((char) => {
                        all[char] = true;
                    });
                
            }
            return all;
        }, {});

    return [args, options];
}

export interface FileReferences {
  /** Path to the input directory or null if a single file was provided */
  dir: string | null;
  /** Designated file extension (determines the starting n2t action) */
  ext: string | null;
  /** One or more input files */
  inputFiles: {
    /** Complete input file path */
    path: string;
    /** Directory of the input file path */
    dir: string;
    /** Extension of the input file path */
    ext: string;
    /** Input file name without extension */
    name: string;
  }[];
}

/** Priority of each extension */
const EXT_PRIORITY = ['.jack', '.vm', '.asm'];

/** Parses the input argument and returns one or more file references */
export const getFileReferences = async (inputArg: string): Promise<FileReferences> => {
  const inputPath = resolve(inputArg);
  const inputStat = await stat(inputPath);
  let lowestExtInd = Infinity;
  /** Handle directory of files */
  if (inputStat.isDirectory()) {
    const contents = await readdir(inputPath, { withFileTypes: true });
    /** Get just the files matching the extension */
    const files = contents.filter((entry) => entry.isFile());

    /** Build initial input files */
    let allFiles = files.map((entry) => {
        const dir = inputPath;
        const path = join(dir, entry.name);
        const ext = extname(path);
        const name = basename(path, ext);
        const extInd = EXT_PRIORITY.indexOf(ext);
        if (extInd !== -1 && extInd < lowestExtInd) {
            lowestExtInd = extInd;
        }
        return { path, dir, ext, name };
    });

    /** Attempt to recursively retrieve nested files */
    const innerDirs = contents.filter((entry) => entry.isDirectory());
    for (const innerDir of innerDirs) {
        const references = await getFileReferences(join(inputPath, innerDir.name));
        const dirExtInd = references.ext ? EXT_PRIORITY.indexOf(references.ext) : -1;
        if (dirExtInd !== -1 && dirExtInd < lowestExtInd) {
            lowestExtInd = dirExtInd;
        }
        allFiles.push(...references.inputFiles);
    }

    const ext = EXT_PRIORITY[lowestExtInd] || null;

    /** Get files filtered by extension */
    return {
      dir: inputPath,
      ext,
      inputFiles: allFiles.filter((val) => ext && val.ext === ext),
    };
  }
  /** Handle single input file */
  else if (inputStat.isFile()) {
    const dir = dirname(inputPath);
    const ext: string | null = extname(inputPath);
    const name = basename(inputPath, ext);
    const extInd = EXT_PRIORITY.indexOf(ext);
    if (extInd === -1) {
        return {
            dir: null,
            ext: null,
            inputFiles: [],
        };
    } else {
        return {
          dir: null,
          ext,
          inputFiles: [{
            path: inputPath,
            dir,
            ext,
            name,
          }],
        };
    }
  }
  throw new Error('Error getting file references: Something went wrong');
}