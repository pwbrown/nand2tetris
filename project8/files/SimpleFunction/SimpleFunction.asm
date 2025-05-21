// SimpleFunction.test: function SimpleFunction.test 2
// ---- set function label
(SimpleFunction.test)
// ---- push 0 for the number of local variables (2)
D=0
@SP
A=M
M=D
@SP
M=M+1
@SP
A=M
M=D
@SP
M=M+1

// SimpleFunction.test: push local 0
// ---- set the D register to the value at (LCL + 0)
@LCL
A=M
D=M
// ---- push the D register to the stack
@SP
A=M
M=D
@SP
M=M+1

// SimpleFunction.test: push local 1
// ---- set the D register to the value at (LCL + 1)
@LCL
A=M+1
D=M
// ---- push the D register to the stack
@SP
A=M
M=D
@SP
M=M+1

// SimpleFunction.test: add
// ---- pop right hand (rh) operand
@SP
AM=M-1
D=M
// ---- pop left hand (lh) operand
@SP
AM=M-1
// ---- calculate (rh + lh)
D=D+M
// ---- push result to the stack
@SP
A=M
M=D
@SP
M=M+1

// SimpleFunction.test: not
// ---- pop the operand
@SP
AM=M-1
// ---- not (!) the operand
D=!M
// ---- push result to the stack
@SP
A=M
M=D
@SP
M=M+1

// SimpleFunction.test: push argument 0
// ---- set the D register to the value at (ARG + 0)
@ARG
A=M
D=M
// ---- push the D register to the stack
@SP
A=M
M=D
@SP
M=M+1

// SimpleFunction.test: add
// ---- pop right hand (rh) operand
@SP
AM=M-1
D=M
// ---- pop left hand (lh) operand
@SP
AM=M-1
// ---- calculate (rh + lh)
D=D+M
// ---- push result to the stack
@SP
A=M
M=D
@SP
M=M+1

// SimpleFunction.test: push argument 1
// ---- set the D register to the value at (ARG + 1)
@ARG
A=M+1
D=M
// ---- push the D register to the stack
@SP
A=M
M=D
@SP
M=M+1

// SimpleFunction.test: sub
// ---- pop right hand (rh) operand into D Register
@SP
AM=M-1
D=M
// ---- pop left hand (lh) operand
@SP
AM=M-1
// ---- store result of (lh - rh) in D register
D=M-D
// ---- push result to the stack
@SP
A=M
M=D
@SP
M=M+1

// SimpleFunction.test: return
// ---- goto the shared return section
@SharedReturn
0;JMP

// Shared return function
(SharedReturn)
// ---- store endframe address to temp register
@LCL
D=M
@R13
M=D
// ---- store return address in temp register
@5
D=A
@R13
A=M-D
D=M
@R14
M=D
// ---- replace caller's args with callee's return value
@SP
AM=M-1
D=M
@ARG
A=M
M=D
// ---- move SP back to the caller
@ARG
D=M+1
@SP
M=D
// ---- restore THAT pointer to caller
@R13
A=M-1
D=M
@THAT
M=D
// ---- restore THIS pointer to caller
@R13
A=M-1
A=A-1
D=M
@THIS
M=D
// ---- restore ARG pointer to caller
@3
D=A
@R13
A=M-D
D=M
@ARG
M=D
// ---- restore LCL pointer to caller
@4
D=A
@R13
A=M-D
D=M
@LCL
M=D
// ---- goto return address
@R14
A=M
0;JMP