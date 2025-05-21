[Back](../README.md)

# Course 1 Project 6

This project involves building a Hack Assembler that is capable of assembling Hack Assembly Code into the binary Hack Machine Code representation. It must be capable of resolving custom symbols and labels.

## Installation

1. Navigate to the n2t directory: `cd n2t`
2. Install [nvm (Node Version Manager)](https://github.com/nvm-sh/nvm?tab=readme-ov-file#installing-and-updating)
3. Install the correct nodejs version: `nvm install`
4. Install dependencies: `npm install`
5. Build the CLI tool: `npm run build`

## Usage

```sh
# Assemble all .asm files into .hack files recursively within a directory
npm run n2t -- ../project6/files

# Assemble an individual .asm file into .hack file
npm run n2t -- ../project6/files/Add.asm
```