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

## N2T Command Line Utility

While I was completing the course I started implementing the assembler and the translator as their own distinct programming projects. When I started module 9 which introduced the Jack programming language, I took a brief break from the course lessons and decided to rewrite the assembler and translator into a much more streamlined tool. This tool would make room for the enventual Jack compiler and would serve a single command that could take Jack code all the way down to Hack binary (if desired). [Read more...](./n2t/README.md)