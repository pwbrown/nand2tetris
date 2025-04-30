import { RESERVED_SYMBOL } from "./constants";
import { Instruction } from "./parser";
import { toBinaryAddress } from "./utils";

/** Map between a symbol and the binary equivalent */
export interface SymbolMap {
  [sym: string]: string;
}

/**
 * Iterates through all of the program instructions to build the complete
 * symbol map
 * @param instructions list of all program instructions (including labels)
 */
export const buildSymbolMap = (instructions: Instruction[]) => {
  /** Initialize the symbol map with all reserved symbols first */
  const symbolMap = Object.entries(RESERVED_SYMBOL)
    .reduce<SymbolMap>((all, [sym, addrNum]) => ({
      ...all,
      [sym]: toBinaryAddress(addrNum),
    }), {});
  
  /**
   * Initialize a pending symbol set which will keep track of symbols
   * until all labels can be resolved. The Set preserves the order in
   * which symbols are declared, so they will be assigned memory addresses
   * in the original order declared
   */
  const pendingSymbols = new Set<string>();
  
  /** Need to track the current instruction line number for labels */
  let line = 0;

  /** Extract all pending symbols and labels */
  for (const instruction of instructions) {
    /** Labels should be inserted directly into the symbol map */
    if (instruction.type === 'L') {
      /** Set the label to the address of the "next" line */
      symbolMap[instruction.label] = toBinaryAddress(line);
    } else {
      /** Track pending symbols for A instructions */
      if (instruction.type === 'A' && typeof instruction.addr === 'string' && !symbolMap[instruction.addr]) {
        pendingSymbols.add(instruction.addr);
      }
      /** Increment line count for A and C instructions */
      line += 1;
    }
  }

  /** Process the pending symbols */
  let addr = 16;
  for (const symbol of pendingSymbols) {
    /** Insert symbols that have not already been inserted as labels */
    if (!symbolMap[symbol]) {
      symbolMap[symbol] = toBinaryAddress(addr);
      addr += 1;
    }
  }

  return symbolMap;
};