[Back](../README.md)

# Course 2 Project 7

This project involves building a VM Translator that is capable of translating compiled Jack VM code into the Hack Assembly Language.

## Installation

1. Navigate to the project directory: `cd project7`
2. Install [nvm (Node Version Manager)](https://github.com/nvm-sh/nvm?tab=readme-ov-file#installing-and-updating)
3. Install the correct nodejs version: `nvm install`
4. Install dependencies: `npm install`
5. Build the assembler: `npm run build`

## Usage

```sh
# Run and auto-generate output file name
npm run translate -- input.vm

# Run and manually generate output file name
npm run translate -- input.vm output.asm

# Run and annotate assembly code with original VM commands as comments
npm run translate -- input.vm --annotate
```

## Bundle

This project required source code submission using a very specific format.

Running `npm run bundle` will do the following:
1. Build the source code
2. Create a `bundle` directory
3. Copy the contents of the `dist` (build output) directory into the bundle directory
4. Rename `bundle/main.js` to `bundle/VMTranslator.js` to match the requirement entrypoint file name
5. Add the file `bundle/lang.txt` with the contents "nodejs"

## Areas of Improvement if I get really bored

* I implemented a variable called `POP_DIRECT_ADDR_MAX` in the `translate.ts` file that I never actually tuned. It is used for reducing the number of steps required to perform pop operations on a memory segement with an offset calculation (ex. `pop local 5`). When the variable is increased it will replace the usage of a temporary register (`R13`) with a manual calculation of the final memory location using `A=A+1` commands. There is a threshold at which the number of `A=A+1` commands matches or exceeds the number of commands required to use the temporary register. I just need to find the sweet spot.
* After looking at other implementations for inspiration while I was stuck I noticed that some people avoided a wasteful extra `SP--` during arithmetic commands since the output of the aritmetic command psedocode is normally an `SP++` operation. So commands with left and right hand operands (ex. `add`, `sub`, `and`, etc.) would only perform one `SP--` operation and use `A=M-1` references to talk to the previous stack value. Commands with ONLY a right hand operand (ex. `neg`, `not`) would just never perform an `SP--` operation and simply read and write from/to the previous SP value. This approach would require rewriting most of my helpful assembly utility functions so I just chose to keep the final assembly verbose for now since it passes all the tests and I'd like to continue to the next module.