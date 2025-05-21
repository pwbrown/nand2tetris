/**
 * Base Writer
 * Author      : Philip Brown
 * Source Code : https://github.com/pwbrown/nand2tetris/n2t/src/shared/base-writer.ts
 */

import { createWriteStream, WriteStream } from 'node:fs';
import { once } from 'node:events';

export class BaseWriter {
    private outputStream: WriteStream | null = null;
    private firstLine = true;
    private _linesWritten = 0;

    constructor(protected outputFile: string) {}

    /** Get the output file writer */
    protected get writer() {
        if (!this.outputStream) {
            this.outputStream = createWriteStream(this.outputFile, { encoding: 'utf-8' });
        }
        return this.outputStream;
    }

    /** Number of lines written to the output file */
    protected get linesWritten() {
        return this._linesWritten
    }

    /** Close the output file and return the number of lines written */
    protected async closeOutput() {
        this.writer.end();
        await once(this.writer, 'close');
        return this.linesWritten;
    }

    /** Write a line to the output file */
    protected writeLine(binary: string) {
        if (!this.firstLine) {
            this.writer.write('\n');
        } else {
            this.firstLine = false;
        }
        this.writer.write(binary);
        this._linesWritten += 1;
    }
}