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