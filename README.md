# Nand2Tetris Solutions

This repo contains my solutions to the different projects from the [Nand2Tetris](https://www.nand2tetris.org/) course(s).

## Overview

As part of my self-imposed commitment to try and learn something new every year, I am taking the Nand2Tetris course(s) in 2025 to deepen my knowledge of how computers work from a fundamental level. I'm a visual person so along with completing each of the projects I am documenting all of the chips visually using the [chips.drawio](./chips.drawio) diagram file. I will also be adding additional notes as I deem necessary to project-level markdown documentation just as a reference.

## Course 1 - "Nand to Hack Computer"

- [Project 1](./project1/README.md) - Building elementary logic gate chips in HDL (Hardware Description Language) using the course-provided `Nand` chip
- [Project 2](./project2/README.md) - Building chips required for an `ALU` (Arithmetic Logic Unit)
- [Project 3](./project3/README.md) - Build the `Bit`, `Register`, `RAM`, and `PC` (Program Counter) chips using the course-provided `DFF` (Data Flip-Flop) chip
- [Project 4](./project4/README.md) - Learn the Hack Machine Language and write two programs in Hack Assembly language
- [Project 5](./project5/README.md) - Build the `Memory`, `CPU`, and `Computer` chips using the course-provided `ARegister`, `DRegister`, `ROM32K`, `Screen`, and `Keyboard` chips
- [Project 6](./project6/README.md) - Build an Assembler for the Hack Machine Language using a high-level programming language (TypeScript+NodeJS was my choice)

## Course 2 - "Hack Assembly to Jack and OS (Tetris)"

- [Project 7](./project7/README.md) - Build the initial VM translator to support basic memory segment stack operations and arithmetic operations
- [Project 8](./project8/README.md) - Finish building the VM translator with support for functions, gotos, conditionals, and multi-file support
- [Project 9](./project9/README.md) - Build an application in the Jack programming language (My project: The sliding puzzle game)
- [Project 10](./project10/README.md) - Build the lexical analyzer and parser for the Jack programming language compiler
- [Project 11](./project11/README.md) - Build the finished Jack compiler

## N2T Command Line Utility

While I was completing the course I started implementing the assembler and the translator as their own distinct programming projects. When I started module 9 which introduced the Jack programming language, I took a brief break from the course lessons and decided to rewrite the assembler and translator into a much more streamlined tool. This tool makes room for the Jack compiler and serves as a single command that can take Jack code all the way down to Hack binary (if desired). [Read more...](./n2t/README.md)

## Post Course Optimization

During the course, all of the projects were completed on "virtual" hardware or VM simulators that did not enforce space constraints. This meant that even if the total instructions in the program exceeded the hack computer's instruction memory (ROM) it would still work just fine. This is not good enough for me, so I took an extra journey after completing both courses to try and optimize all of the code I had written to make the benchmark game "Pong" from project 11 fit into the hack computer. And I wanted it to be done using MY implementation of the Jack operating system since it includes extra redundancy features that will cause it to be larger. This means it's an extra challenge.

Hack Computer ROM Size is 32K (`32768` instructions). This is the goal, but ultimately I would like to condense it as much as possible.

### Original "Unoptimized" Implementation

This represents the version of the compiler, translator, assembler, and Jack operating system as they were when I completed the course.

Instruction Count: `43,543` (10,775 over max ❌)

### Optimization #1 - Shared function caller (translator optimization)

Much like how I use the same assembly code for all "return" operations, I would like to use the same assembly code for all function "call" operations.

Implementation:
- The caller is responsible for storing the callee's address and the number of arguments in temporary registers.
- The caller is also responsible for putting the return address into the D register
- The shared caller function is responsible for pushing the return address from the D register onto the stack
- The shared caller function will perform the remaining actions to populate the caller's end frame on the stack
- The shared caller will use the temporary registers to recover the callee's address and arguments

Instruction Count: `32,165` (603 under max ✅)

