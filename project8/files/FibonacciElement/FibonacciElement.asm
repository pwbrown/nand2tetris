// Bootstrap code
// ---- initialize stack pointer to address 256
@256
D=A
@SP
M=D
// ---- initialize LCL as -1
@LCL
M=-1
// ---- initialize ARG as -2
@2
D=-A
@ARG
M=D
// ---- initialize THIS as -3
@3
D=-A
@THIS
M=D
// ---- initialize THAT as -4
@4
D=-A
@THAT
M=D
// ---- push return address to the stack
@Sys.init$ret.0
D=A
@SP
A=M
M=D
@SP
M=M+1
// ---- push LCL pointer to the stack
@LCL
D=M
@SP
A=M
M=D
@SP
M=M+1
// ---- push ARG pointer to the stack
@ARG
D=M
@SP
A=M
M=D
@SP
M=M+1
// ---- push THIS pointer to the stack
@THIS
D=M
@SP
A=M
M=D
@SP
M=M+1
// ---- push THAT pointer to the stack
@THAT
D=M
@SP
A=M
M=D
@SP
M=M+1
// ---- reposition ARG pointer to (SP - frame(5) - args(0))
@5
D=A
@SP
D=M-D
@ARG
M=D
// ---- reposition LCL pointer to the current SP
@SP
D=M
@LCL
M=D
// ---- goto callee function and set the caller return label
@Sys.init
0;JMP
(Sys.init$ret.0)

// Main.fibonacci: function Main.fibonacci 0
// ---- set function label
(Main.fibonacci)

// Main.fibonacci: push argument 0
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

// Main.fibonacci: push constant 2
// ---- push the constant value 2 to the stack
@2
D=A
@SP
A=M
M=D
@SP
M=M+1

// Main.fibonacci: lt
// ---- pop right hand (rh) operand into D Register
@SP
AM=M-1
D=M
// ---- pop left hand (lh) operand
@SP
AM=M-1
// ---- store result of (lh - rh) in D register
D=M-D
// ---- if (D lt 0) goto Main.fibonacci$lt.0
@Main.fibonacci$lt.0
D;JLT
// ---- else push false and goto Main.fibonacci$end_lt.0
@SP
A=M
M=0
@SP
M=M+1
@Main.fibonacci$end_lt.0
0;JMP
// ---- push true
(Main.fibonacci$lt.0)
@SP
A=M
M=-1
@SP
M=M+1
// ---- end of condition
(Main.fibonacci$end_lt.0)

// Main.fibonacci: if-goto N_LT_2
// ---- pop value off the stack into the D register
@SP
AM=M-1
D=M
// ---- goto Main.fibonacci$N_LT_2 if D is true (not 0)
@Main.fibonacci$N_LT_2
D;JNE

// Main.fibonacci: goto N_GE_2
@Main.fibonacci$N_GE_2
0;JMP

// Main.fibonacci: label N_LT_2
(Main.fibonacci$N_LT_2)

// Main.fibonacci: push argument 0
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

// Main.fibonacci: return
// ---- goto the shared return section
@SharedReturn
0;JMP

// Main.fibonacci: label N_GE_2
(Main.fibonacci$N_GE_2)

// Main.fibonacci: push argument 0
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

// Main.fibonacci: push constant 2
// ---- push the constant value 2 to the stack
@2
D=A
@SP
A=M
M=D
@SP
M=M+1

// Main.fibonacci: sub
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

// Main.fibonacci: call Main.fibonacci 1
// ---- push return address to the stack
@Main.fibonacci$ret.0
D=A
@SP
A=M
M=D
@SP
M=M+1
// ---- push LCL pointer to the stack
@LCL
D=M
@SP
A=M
M=D
@SP
M=M+1
// ---- push ARG pointer to the stack
@ARG
D=M
@SP
A=M
M=D
@SP
M=M+1
// ---- push THIS pointer to the stack
@THIS
D=M
@SP
A=M
M=D
@SP
M=M+1
// ---- push THAT pointer to the stack
@THAT
D=M
@SP
A=M
M=D
@SP
M=M+1
// ---- reposition ARG pointer to (SP - frame(5) - args(1))
@6
D=A
@SP
D=M-D
@ARG
M=D
// ---- reposition LCL pointer to the current SP
@SP
D=M
@LCL
M=D
// ---- goto callee function and set the caller return label
@Main.fibonacci
0;JMP
(Main.fibonacci$ret.0)

// Main.fibonacci: push argument 0
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

// Main.fibonacci: push constant 1
// ---- push the constant value 1 to the stack
@SP
A=M
M=1
@SP
M=M+1

// Main.fibonacci: sub
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

// Main.fibonacci: call Main.fibonacci 1
// ---- push return address to the stack
@Main.fibonacci$ret.1
D=A
@SP
A=M
M=D
@SP
M=M+1
// ---- push LCL pointer to the stack
@LCL
D=M
@SP
A=M
M=D
@SP
M=M+1
// ---- push ARG pointer to the stack
@ARG
D=M
@SP
A=M
M=D
@SP
M=M+1
// ---- push THIS pointer to the stack
@THIS
D=M
@SP
A=M
M=D
@SP
M=M+1
// ---- push THAT pointer to the stack
@THAT
D=M
@SP
A=M
M=D
@SP
M=M+1
// ---- reposition ARG pointer to (SP - frame(5) - args(1))
@6
D=A
@SP
D=M-D
@ARG
M=D
// ---- reposition LCL pointer to the current SP
@SP
D=M
@LCL
M=D
// ---- goto callee function and set the caller return label
@Main.fibonacci
0;JMP
(Main.fibonacci$ret.1)

// Main.fibonacci: add
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

// Main.fibonacci: return
// ---- goto the shared return section
@SharedReturn
0;JMP

// Sys.init: function Sys.init 0
// ---- set function label
(Sys.init)

// Sys.init: push constant 4
// ---- push the constant value 4 to the stack
@4
D=A
@SP
A=M
M=D
@SP
M=M+1

// Sys.init: call Main.fibonacci 1
// ---- push return address to the stack
@Main.fibonacci$ret.2
D=A
@SP
A=M
M=D
@SP
M=M+1
// ---- push LCL pointer to the stack
@LCL
D=M
@SP
A=M
M=D
@SP
M=M+1
// ---- push ARG pointer to the stack
@ARG
D=M
@SP
A=M
M=D
@SP
M=M+1
// ---- push THIS pointer to the stack
@THIS
D=M
@SP
A=M
M=D
@SP
M=M+1
// ---- push THAT pointer to the stack
@THAT
D=M
@SP
A=M
M=D
@SP
M=M+1
// ---- reposition ARG pointer to (SP - frame(5) - args(1))
@6
D=A
@SP
D=M-D
@ARG
M=D
// ---- reposition LCL pointer to the current SP
@SP
D=M
@LCL
M=D
// ---- goto callee function and set the caller return label
@Main.fibonacci
0;JMP
(Main.fibonacci$ret.2)

// Sys.init: label END
(Sys.init$END)

// Sys.init: goto END
@Sys.init$END
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