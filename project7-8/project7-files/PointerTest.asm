// PointerTest: push constant 3030
@3030
D=A
@SP
A=M
M=D
@SP
M=M+1
// PointerTest: pop pointer 0
@SP
AM=M-1
D=M
@THIS
M=D
// PointerTest: push constant 3040
@3040
D=A
@SP
A=M
M=D
@SP
M=M+1
// PointerTest: pop pointer 1
@SP
AM=M-1
D=M
@THAT
M=D
// PointerTest: push constant 32
@32
D=A
@SP
A=M
M=D
@SP
M=M+1
// PointerTest: pop this 2
@2
D=A
@THIS
D=D+M
@R13
M=D
@SP
AM=M-1
D=M
@R13
A=M
M=D
// PointerTest: push constant 46
@46
D=A
@SP
A=M
M=D
@SP
M=M+1
// PointerTest: pop that 6
@6
D=A
@THAT
D=D+M
@R13
M=D
@SP
AM=M-1
D=M
@R13
A=M
M=D
// PointerTest: push pointer 0
@THIS
D=M
@SP
A=M
M=D
@SP
M=M+1
// PointerTest: push pointer 1
@THAT
D=M
@SP
A=M
M=D
@SP
M=M+1
// PointerTest: add
@SP
AM=M-1
D=M
@SP
AM=M-1
D=D+M
@SP
A=M
M=D
@SP
M=M+1
// PointerTest: push this 2
@THIS
A=M+1
A=A+1
D=M
@SP
A=M
M=D
@SP
M=M+1
// PointerTest: sub
@SP
AM=M-1
D=M
@SP
AM=M-1
D=M-D
@SP
A=M
M=D
@SP
M=M+1
// PointerTest: push that 6
@6
D=A
@THAT
A=D+M
D=M
@SP
A=M
M=D
@SP
M=M+1
// PointerTest: add
@SP
AM=M-1
D=M
@SP
AM=M-1
D=D+M
@SP
A=M
M=D
@SP
M=M+1