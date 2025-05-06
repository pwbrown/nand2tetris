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

```
npm run translate -- input.vm output.asm
```