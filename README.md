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

### Summary of ALL optimizations in the order they were made

| Optimization                                                | Pong Inst. Count | Removed Inst. | Fits in ROM        |
| ----------------------------------------------------------- | ---------------- | ------------- | ------------------ |
| Unoptimized                                                 | `43,543`         | 'N/A'         | ❌ (`10,775` over) |
| [Shared Function Caller](#shared-function-caller)           | `32,165`         | `11,378`      | ✅ (`603` under)   |
| [Arithmetic Op Complexity](#arithmetic-operator-complexity) | `29,021`         | `3,144`       | ✅ (`3,747` under) |
| Simplify Bootstrap                                          | `29,015`         | `6`           | ✅ (`3,753` under) |
| [Tune the Pop Operation](#tune-the-pop-operation)           | `28,730`         | `285`         | ✅ (`4,038` under) |
| [Nitpicky Assembly Tweaks](#nitpicky-assembly-tweaks)       | `26,254`         | `2,476`       | ✅ (`6,514` under) |

### Shared function caller

Much like how I use the same assembly code for all "return" operations, I would like to use the same assembly code for all function "call" operations.

Implementation:

- The caller is responsible for storing the callee's address and the number of arguments in temporary registers.
- The caller is also responsible for putting the return address into the D register
- The shared caller function is responsible for pushing the return address from the D register onto the stack
- The shared caller function will perform the remaining actions to populate the caller's end frame on the stack
- The shared caller will use the temporary registers to recover the callee's address and arguments

### Arithmetic Operator Complexity

Most of the stack operations I developed were based on the pseudocode provided by the course which is naturally verbose to make it easier to understand. Some of the individual steps in the pseudocode can be easily removed.

| Operator(s)         | Assembly Before                                                                                                                                                                                                   | Assembly After                                                                                                                                                       | Op Inst. Removed | Pong Inst. Removed |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ------------------ |
| `add\|sub\|and\|or` | @SP<br>AM=M-1<br>D=M<br>@SP<br>AM=M-1<br>D={D+M,M-D,D&M,M\|D}<br>@SP<br>A=M<br>M=D<br>@SP<br>M=M+1                                                                                                                | @SP<br>AM=M-1<br>D=M<br>A=A-1<br>M={D+M,M-D,D&M,M\|D}                                                                                                                | `6`              | `1,362`            |
| `neg\|not`          | @SP<br>AM=M-1<br>D={-M,!M}<br>@SP<br>A=M<br>M=D<br>@SP<br>M=M+1                                                                                                                                                   | @SP<br>A=M-1<br>M={-M,!M}                                                                                                                                            | `5`              | `930`              |
| `lt\|eq\|gt`        | @SP<br>AM=M-1<br>D=M<br>@SP<br>AM=M-1<br>D=M-D<br>@TRUE_LABEL<br>D;{JLT,JEQ,JGT}<br>@SP<br>A=M<br>M=0<br>@SP<br>M=M+1<br>@END_LABEL<br>0;JMP<br>(TRUE_LABEL)<br>@SP<br>A=M<br>M=-1<br>@SP<br>M=M+1<br>(END_LABEL) | @SP<br>AM=M-1<br>D=M<br>A=A-1<br>D=M-D<br>@TRUE_LABEL<br>D;{JLT,JEQ,JGT}<br>D=0<br>@END_LABEL<br>0;JMP<br>(TRUE_LABEL)<br>D=-1<br>(END_LABEL)<br>@SP<br>A=M-1<br>M=D | `6`              | `852`              |

### Tune the Pop Operation

This was a setting I added based on an implementation I saw from another person who completed the course and it had to do with replacing the use of a temporary register for pop operations with a series of `A=A(+|-)1` calls. There is a threshold at which the number of these increment/decrement calls to the A register consumes less instructions than with the use of a temporary register. I just needed time to test where the threshold was.

As it can be seen here, any pop command with a threshold of 7 or lower will produce less instructions than with the use of a temporary register

| VM Command    | Assembly with Temp Register (R13)                                                              | Assembly without Temp Register                                                                                                                                           |
| ------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pop local 7` | @7<br>D=A<br>@LCL<br>A=D+M<br>D=A<br>@R13<br>M=D<br>@SP<br>AM=M-1<br>D=M<br>@R13<br>A=M<br>M=D | @SP<br>AM=M-1<br>D=M<br>@LCL<br>A=M+1 // LCL(1)<br>A=A+1 // LCL(2)<br>A=A+1 // LCL(3)<br>A=A+1 // LCL(4)<br>A=A+1 // LCL(5)<br>A=A+1 // LCL(6)<br>A=A+1 // LCL(7)<br>M=D |

### Nitpicky Assembly Tweaks

| Explanation                                | Assembly Before                                  | Assembly After                              | Pong Inst. Before | Pong Inst. After |
| ------------------------------------------ | ------------------------------------------------ | ------------------------------------------- | ----------------- | ---------------- |
| Push D Register Value onto Stack           | @SP<br>A=M<br>M=D<br>@SP<br>M=M+1                | @SP<br>M=M+1<br>A=M-1<br>M=D                | `28,730`          | `27,815` (-915)  |
| Push -1, 0, or 1 onto Stack                | @SP<br>A=M<br>M={-1,0,1}<br>@SP<br>M=M+1         | @SP <br>M=M+1<br>A=M-1<br>M={-1,0,1}        | `27,815`          | `27,305` (-510)  |
| Push int onto Stack (not -1, 0, or 1)      | @num<br>D=A<br>@SP<br>A=M<br>M=D<br>@SP<br>M=M+1 | @num<br>D=A<br>@SP<br>M=M+1<br>A=M-1<br>M=D | `27,305`          | `26,396` (-909)  |
| Push int 2 or -2 onto Stack (special case) | @2<br>D=A<br>@SP<br>M=M+1<br>A=M-1<br>M=D        | @SP<br>M=M+1<br>A=M-1<br>M=1<br>M=M+1       | `26,396`          | `26,379` (-17)   |
| Setup Function Local Variables | D=0<br>// for # locals<br>@SP<br>M=M+1<br>A=M-1<br>M=D<br>// endfor | @{# locals}<br>D=A<br>@SP<br>M=D+M<br>// for # locals<br>A={i is 0 ? M : A}-1<br>M=0<br>// endfor | `26,379` | `26,254` (-125) |
