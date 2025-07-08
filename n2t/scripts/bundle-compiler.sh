#!/bin/sh

# Execute this script from the n2t directory by executing 'source ./scripts/bundle-compiler.sh'

# Generate bundle directory
rm -rf bundle
mkdir -p bundle

# Use esbuild to compile the project and bundle it into a single file
npx esbuild ./src/n2t.ts \
    --bundle \
    --platform=node \
    --outfile=./bundle/JackCompiler.js \
    --banner:js="/**
 * Author: Philip Brown
 * Source: https://github.com/pwbrown/nand2tetris/src/n2t.ts
 *
 * In order to comply with the project11 requirements of not including
 * any directories, and only files, I use the esbuild tool to handle
 * bundling the compiled (TypeScript to JavaScript) code into a single
 * file that can be executed. The entrypoint is the n2t script referenced
 * above that I wrote to combine the functionality of the Jack Compiler,
 * VM Translator, and Assembler into a single script. Each use case is a
 * distinct process but they share a common lexical analyzer, base parser, 
 * and file input utilities.
 */"

cat > ./bundle/lang.txt << EOF
nodejs
debug
EOF