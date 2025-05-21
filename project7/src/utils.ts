import { dirname, basename, extname, resolve, join } from 'node:path';
import { stat, readdir } from 'node:fs/promises';

export interface FileReferences {
  /** Indicates if the input is a directory */
  isDir: boolean;
  /** One or more input files */
  inputFiles: {
    /** Complete input file path */
    path: string;
    /** Input file name without extension */
    name: string;
  }[];
  /** Calculated output file path (w/ extension) */
  outputFilePath: string;
}

/** Parses the input argument and returns one or more file references */
export const getFileReferences = async (inputArg: string): Promise<FileReferences> => {
  const inputPath = resolve(inputArg);
  const inputStat = await stat(inputPath);
  /** Handle directory of files */
  if (inputStat.isDirectory()) {
    const contents = await readdir(inputPath, { withFileTypes: true });
    /** Get just the .vm files */
    const vmFiles = contents.filter((entry) => entry.isFile() && entry.name.endsWith('.vm'));
    if (!vmFiles.length) {
      throw new Error('Directory does not contain any .vm files');
    }
    return {
      isDir: true,
      outputFilePath: join(inputPath, `${basename(inputPath)}.asm`),
      inputFiles: vmFiles.map((entry) => {
        const path = join(inputPath, entry.name);
        const name = basename(path, extname(path));
        return { path, name };
      }),
    }
  }
  /** Handle single input file */
  else if (inputStat.isFile()) {
    const inputDir = dirname(inputPath);
    const name = basename(inputPath, extname(inputPath));
    return {
      isDir: false,
      outputFilePath: join(inputDir, `${name}.asm`),
      inputFiles: [{
        path: inputPath,
        name,
      }],
    };
  }
  throw new Error('Error getting file references: Something went wrong');
}