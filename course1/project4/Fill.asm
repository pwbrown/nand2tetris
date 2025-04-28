// This file is part of www.nand2tetris.org
// and the book "The Elements of Computing Systems"
// by Nisan and Schocken, MIT Press.
// File name: projects/4/Fill.asm

// Runs an infinite loop that listens to the keyboard input. 
// When a key is pressed (any key), the program blackens the screen,
// i.e. writes "black" in every pixel. When no key is pressed, 
// the screen should be cleared.

// Initialize Max Screen Words (256 * 512 / 16 = 8192)
@8192
D=A
@max
M=D

// Initialize the target variable to on and tell the screen to empty at startup
@tar
M=-1 // -1 for screen on, and 0 for screen off
@EMPTY
0;JMP

// Loop that probes the keyboard input and only moves
// on if a key is pressed
(PROBE)
    @KBD
    D=M
    @EMPTY
    D;JEQ
    @FILL
    0;JMP
    
// Handles filling the whole screen or ignoring if already full
(FILL)
    // Ignores filling if the target is already set to 0
    @tar
    D=M
    @PROBE
    D;JLT
    // Sets the target to -1 and paints
    @tar
    M=-1
    @PAINT
    0;JMP

// Handles emptying the whole screen or ignoring if already empty
(EMPTY)
    // Ignores emptying if the target is already set to 0
    @tar
    D=M
    @PROBE
    D;JEQ
    // Sets the target to 0 and paints
    @tar
    M=0
    @PAINT
    0;JMP
    
// Handles painting the whole screen with the target value
(PAINT)
    @i
    M=0
    (PAINT_LOOP)
        // if (i == max) goto PROBE
        @max
        D=M
        @i
        D=D-M
        @PROBE
        D;JEQ

        // Set screen register to target value
        @SCREEN
        D=A
        @i
        D=D+M
        @addr
        M=D
        @tar
        D=M
        @addr
        A=M
        M=D

        // Increment i
        @i
        M=M+1
        @PAINT_LOOP
        0;JMP


