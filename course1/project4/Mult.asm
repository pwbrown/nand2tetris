// This file is part of www.nand2tetris.org
// and the book "The Elements of Computing Systems"
// by Nisan and Schocken, MIT Press.
// File name: projects/4/Mult.asm

// Multiplies R0 and R1 and stores the result in R2.
// (R0, R1, R2 refer to RAM[0], RAM[1], and RAM[2], respectively.)
// The algorithm is based on repetitive addition.

// Set num1 to the value from R0
@R0
D=M
@num1
M=D

// Set num2 and initial iterator to the value from R1
@R1
D=M
@num2
M=D
@i
M=D

// Set sum to 0
@sum
M=0

(LOOP)
    // if (i==0) goto END
    @i
    D=M
    @END
    D;JEQ

    // Add num1 to the sum
    @num1
    D=M
    @sum
    M=D+M

    // Decrement the counter and goto loop
    @i
    M=M-1
    @LOOP
    0;JMP

(END)
    // Set R2 to the sum
    @sum
    D=M
    @R2
    M=D

// Stop Program with infinite loop
(STOP)
    @STOP
    0;JMP
