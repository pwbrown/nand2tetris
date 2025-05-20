[Back](../README.md)

# Course 1 Project 4

This project involved learning the Hack Machine Language and the Hack Assembly language. The final project consisted of writing two programs in Hack Assembly.

## Hack Assembly Overview

The Hack Assembly language consists of 2 instruction types: an `A` instruction which is used for setting an address, and a `C` instruction type which is used for performing calculations using the ALU and manipulating internal registers and memory.

### A instruction

The `A` instruction is used for setting the A-Register value which controls the selected address for memory read/write operations and ROM (instruction memory) jump operations.

**_Syntax Options_**

- `@{decimal_value}` - Sets the A-Register directly to the binary version of the decimal value
- `@R[0-15]` - Uses the reserved `R0` - `R15` keywords to set the A-Register to the respective value. This is a shortcut.
- `@SCREEN` - Sets the A-Register to the base address of the screen memory map
- `@KBD` - Sets the A-Register to the address of the keyboard memory register
- `@{any_identifier}` - Sets the A-Register to the address associated with the identifier. If the identifier is associated with a Jump Label, then it will be replaced with the instruction address associated with the label during assembly, otherwise it will be replaced with an address selected from the data memory starting at address 16 (0-15 are reserved) during assembly.

### C instruction

The `C` instruction is used for performing calculations using the CPU's ALU chip and it is capable of manipulating the A and D Registers as well has performing jump operations to allow for more complex operations.

**_Syntax Options_**

- `{destination}={operation};{jump}` - Performs and operation, assigns the result to the destination, and performs a jump operation based on the the operation output and the current address.
- `{operation};{jump}` - Performs and operation and performs a jump operation based on the operation output and the current address.
- `{destination}={operation}` - Performs and operation and assigns the result to the destination without performing any jump operation (continues to the next instruction).
- `0;jmp` - Syntax for the unconditional jump operation which simply jumps to the currently selected address (A-Register).

**_Destination Options_**

| Mnemonic | Destination                                                |
| -------- | ---------------------------------------------------------- |
| `null`   | Value is not stored anywhere                               |
| `M`      | Value is stored in Data Memory at address A                |
| `D`      | Value is stored in the D-Register                          |
| `MD`     | Value is stored in both Memory\[A\] and the D-Register     |
| `A`      | Value is stored in the A-Register                          |
| `AM`     | Value is stored in the A-Register and Memory\[A\]          |
| `AD`     | Value is stored in the A-Register and D-Register           |
| `ADM`    | Value is stored in A-Register, Memory\[A\], and D-Register |

**_ALL Possible Operations_**

| Operation   | Mnemonics                  |
| ----------- | -------------------------- |
| Bit         | `0`, `1`, `-1`             |
| Value       | `D`, `A`, `M`              |
| Negation    | `!D`, `!A`, `!M`           |
| Negative    | `-D`, `-A`, `-M`           |
| Increment   | `D+1`, `A+1`, `M+1`        |
| Addition    | `D+A`, `D+M`               |
| Subtraction | `D-A`, `D-M`, `A-D`, `M-D` |
| Bitwise And | `D&A`, `D&M`               |
| Bitwise Or  | `D\|A`, `D\|M`             |

**_ALL Possible Jump Commands_**

| Mnemonic | Jump if operation output: |
| -------- | ------------------------- |
| `null`   | No Jump                   |
| `JGT`    | `> 0`                     |
| `JEQ`    | `== 0`                    |
| `JGE`    | `>= 0`                    |
| `JLT`    | `< 0`                     |
| `JNE`    | `!= 0`                    |
| `JLE`    | `<= 0`                    |
| `JMP`    | Jump                      |

### Instruction Labels

Instruction labels can be added to Hack Assembly to simplify the process of addressing specific instructions. When a label is declared, the address of the very next instruction is linked to the label name such that any A instructions using the label will be replaced with the correct instruction during assembly.

**_Syntax_**

```
({LABEL_IDENTIFIER})
```

### Example(s)

**_Add the values from the first 2 registers together and save the sum to register 3_**

```
// Save value of register 0 into the D-Register
@R0
D=M
// Add value of register 1 to the D-Register
@R1
D=D+M
// Store the D-Register value into register 2
@R3
M=D
// Infinite loop to stop the program
(STOP)
  @STOP
  0;JMP
```

## Project Description

The assignment was to build 2 different programs in assembly. The details of each program are documented at the top of each assembly file:

- [Fill.asm](./Fill.asm) - Fill the entire screen as long as any key is pressed otherwise clear the screen if no key is pressed.
- [Mult.asm](./Mult.asm) - Multiply together the values in the first two registers, and store the product in the third register.