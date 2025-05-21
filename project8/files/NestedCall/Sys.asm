// Sys.init: function Sys.init 0
// ---- set function label
(Sys.init)

// Sys.init: push constant 4000
// ---- push the constant value 4000 to the stack
@4000
D=A
@SP
A=M
M=D
@SP
M=M+1

// Sys.init: pop pointer 0
// ---- pop value from the stack to the D register
@SP
AM=M-1
D=M
// ---- set value of THIS to the value in the D register
@THIS
M=D

// Sys.init: push constant 5000
// ---- push the constant value 5000 to the stack
@5000
D=A
@SP
A=M
M=D
@SP
M=M+1

// Sys.init: pop pointer 1
// ---- pop value from the stack to the D register
@SP
AM=M-1
D=M
// ---- set value of THAT to the value in the D register
@THAT
M=D

// Sys.init: call Sys.main 0
// ---- push return address to the stack
@Sys.main$ret.0
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
@Sys.main
0;JMP
(Sys.main$ret.0)

// Sys.init: pop temp 1
// ---- pop value from the stack to the D register
@SP
AM=M-1
D=M
// ---- set value of R(5 + 1) -> R6 to the value in the D register
@R6
M=D

// Sys.init: label LOOP
(Sys.init$LOOP)

// Sys.init: goto LOOP
@Sys.init$LOOP
0;JMP

// Sys.main: function Sys.main 5
// ---- set function label
(Sys.main)
// ---- push 0 for the number of local variables (5)
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
@SP
A=M
M=D
@SP
M=M+1

// Sys.main: push constant 4001
// ---- push the constant value 4001 to the stack
@4001
D=A
@SP
A=M
M=D
@SP
M=M+1

// Sys.main: pop pointer 0
// ---- pop value from the stack to the D register
@SP
AM=M-1
D=M
// ---- set value of THIS to the value in the D register
@THIS
M=D

// Sys.main: push constant 5001
// ---- push the constant value 5001 to the stack
@5001
D=A
@SP
A=M
M=D
@SP
M=M+1

// Sys.main: pop pointer 1
// ---- pop value from the stack to the D register
@SP
AM=M-1
D=M
// ---- set value of THAT to the value in the D register
@THAT
M=D

// Sys.main: push constant 200
// ---- push the constant value 200 to the stack
@200
D=A
@SP
A=M
M=D
@SP
M=M+1

// Sys.main: pop local 1
// ---- pop value from the stack to the D register
@SP
AM=M-1
D=M
// ---- set value of (LCL + 1) to the value in the D register
@LCL
A=M+1
M=D

// Sys.main: push constant 40
// ---- push the constant value 40 to the stack
@40
D=A
@SP
A=M
M=D
@SP
M=M+1

// Sys.main: pop local 2
// ---- pop value from the stack to the D register
@SP
AM=M-1
D=M
// ---- set value of (LCL + 2) to the value in the D register
@LCL
A=M+1
A=A+1
M=D

// Sys.main: push constant 6
// ---- push the constant value 6 to the stack
@6
D=A
@SP
A=M
M=D
@SP
M=M+1

// Sys.main: pop local 3
// ---- set the D register to the address at (LCL + 3)
@3
D=A
@LCL
A=D+M
D=A
// ---- set the value at temp register R13 to the value in the D register
@R13
M=D
// ---- pop value from the stack to the D register
@SP
AM=M-1
D=M
// ---- recover the address stored in the temp register R13
@R13
A=M
// ---- store the popped value to the address at (LCL + 3)
M=D

// Sys.main: push constant 123
// ---- push the constant value 123 to the stack
@123
D=A
@SP
A=M
M=D
@SP
M=M+1

// Sys.main: call Sys.add12 1
// ---- push return address to the stack
@Sys.add12$ret.0
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
@Sys.add12
0;JMP
(Sys.add12$ret.0)

// Sys.main: pop temp 0
// ---- pop value from the stack to the D register
@SP
AM=M-1
D=M
// ---- set value of R(5 + 0) -> R5 to the value in the D register
@R5
M=D

// Sys.main: push local 0
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

// Sys.main: push local 1
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

// Sys.main: push local 2
// ---- set the D register to the value at (LCL + 2)
@LCL
A=M+1
A=A+1
D=M
// ---- push the D register to the stack
@SP
A=M
M=D
@SP
M=M+1

// Sys.main: push local 3
// ---- set the D register to the value at (LCL + 3)
@3
D=A
@LCL
A=D+M
D=M
// ---- push the D register to the stack
@SP
A=M
M=D
@SP
M=M+1

// Sys.main: push local 4
// ---- set the D register to the value at (LCL + 4)
@4
D=A
@LCL
A=D+M
D=M
// ---- push the D register to the stack
@SP
A=M
M=D
@SP
M=M+1

// Sys.main: add
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

// Sys.main: add
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

// Sys.main: add
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

// Sys.main: add
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

// Sys.main: return
// ---- goto the shared return section
@SharedReturn
0;JMP

// Sys.add12: function Sys.add12 0
// ---- set function label
(Sys.add12)

// Sys.add12: push constant 4002
// ---- push the constant value 4002 to the stack
@4002
D=A
@SP
A=M
M=D
@SP
M=M+1

// Sys.add12: pop pointer 0
// ---- pop value from the stack to the D register
@SP
AM=M-1
D=M
// ---- set value of THIS to the value in the D register
@THIS
M=D

// Sys.add12: push constant 5002
// ---- push the constant value 5002 to the stack
@5002
D=A
@SP
A=M
M=D
@SP
M=M+1

// Sys.add12: pop pointer 1
// ---- pop value from the stack to the D register
@SP
AM=M-1
D=M
// ---- set value of THAT to the value in the D register
@THAT
M=D

// Sys.add12: push argument 0
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

// Sys.add12: push constant 12
// ---- push the constant value 12 to the stack
@12
D=A
@SP
A=M
M=D
@SP
M=M+1

// Sys.add12: add
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

// Sys.add12: return
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