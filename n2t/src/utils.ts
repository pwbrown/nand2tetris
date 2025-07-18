/**
 * N2T Utils
 * Author      : Philip Brown
 * Source Code : https://github.com/pwbrown/nand2tetris/n2t/src/utils.ts
 */

import { dirname, basename, extname, resolve, join } from 'node:path';
import { stat, readdir, mkdir } from 'node:fs/promises';

/** Shared options definition */
export interface Options {
    /** Print additional information to the console */
    verbose: boolean;
    /** Commments should be added to compiled/translated output */
    annotate: boolean;
    /** Jack OS compiled code should be copied to the compile destination */
    copyOs: boolean;
    /** XML files should be generated for compiler tokenizer and parse tree representations  */
    xml: boolean;
    /** XML files should include original source line/column numbers as XML properties */
    sourceMap: boolean;
    /** Passthrough parameter for file references */
    name?: string;
}

export interface FileReferences {
  /** Path to the output directory (if it was a directory) */
  dir: string | null;
  /** Output directory */
  outDir: string | null;
  /** Preferred name for a singular the output file */
  name: string | null;
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

export interface GetFileReferencesOptions {
  input: string;
  output?: string;
  extension?: string;
  name?: string;
}

/** Parses the input argument and returns one or more file references */
export const getFileReferences = async (options: GetFileReferencesOptions): Promise<FileReferences> => {
  const inputPath = resolve(options.input);
  const outputPath = options.output ? resolve(options.output) : options.output;
  /** Ensure output path is created before it is written to in the future */
  if (outputPath) {
    await mkdir(outputPath, { recursive: true });
  }
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
        const references = await getFileReferences({
          ...options,
          input: join(inputPath, innerDir.name),
        });
        const dirExtInd = references.ext ? EXT_PRIORITY.indexOf(references.ext) : -1;
        if (dirExtInd !== -1 && dirExtInd < lowestExtInd) {
            lowestExtInd = dirExtInd;
        }
        allFiles.push(...references.inputFiles);
    }

    const ext = options.extension || EXT_PRIORITY[lowestExtInd] || null;

    /** Get files filtered by extension */
    return {
      dir: inputPath,
      outDir: outputPath || null,
      name: options.name || null,
      ext,
      inputFiles: allFiles.filter((val) => ext && val.ext === ext),
    };
  }
  /** Handle single input file */
  else if (inputStat.isFile()) {
    const dir = dirname(inputPath);
    const ext: string | null = extname(inputPath);
    const name = options.name || basename(inputPath, ext);
    const extInd = EXT_PRIORITY.indexOf(ext);
    if (extInd === -1 || (options.extension && ext !== options.extension)) {
        return {
            dir: null,
            outDir: null,
            name: null,
            ext: null,
            inputFiles: [],
        };
    } else {
        return {
          dir: null,
          outDir: outputPath || null,
          name: options.name || null,
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