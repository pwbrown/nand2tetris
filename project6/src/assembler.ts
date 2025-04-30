import { createWriteStream } from "node:fs";
import { Instruction } from "./parser";
import { SymbolMap } from "./symbols";
import { resolve } from "node:path";
import { once } from "node:events";
import { toBinaryAddress } from "./utils";

/**
 * Assembles a list of hack assembly instructions into the binary hack version
 * @param instructions complete list of program instructions
 * @param symbolMap map of symbols to the associated binary address
 */
export const assemble = async (instructions: Instruction[], symbolMap: SymbolMap, outFile: string) => {
  /** Open the output file */
  const output = createWriteStream(resolve(outFile), { encoding: 'utf-8' });

  /** Iterate through all instructions and construct the output */
  let first = true;
  for (const instruction of instructions) {
    if (instruction.type !== 'L') {
      if (first) {
        first = false;
      } else {
        output.write('\n');
      }
      /** Handle 'A' Instruction */
      if (instruction.type === 'A') {
        const addrBin = typeof instruction.addr === 'string' ?
          symbolMap[instruction.addr] :
          toBinaryAddress(instruction.addr);
        output.write(`0${addrBin}`);
      }
      /** Handle 'C' Instruction */
      if (instruction.type === 'C') {
        output.write(`111${instruction.compBin}${instruction.destBin}${instruction.jumpBin}`);
      }
    }
  }

  /** Close the output file */
  output.end();
  await once(output, 'close');
}