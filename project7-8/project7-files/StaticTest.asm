// StaticTest: push constant 111
@111
D=A
@SP
A=M
M=D
@SP
M=M+1
// StaticTest: push constant 333
@333
D=A
@SP
A=M
M=D
@SP
M=M+1
// StaticTest: push constant 888
@888
D=A
@SP
A=M
M=D
@SP
M=M+1
// StaticTest: pop static 8
@SP
AM=M-1
D=M
@StaticTest.8
M=D
// StaticTest: pop static 3
@SP
AM=M-1
D=M
@StaticTest.3
M=D
// StaticTest: pop static 1
@SP
AM=M-1
D=M
@StaticTest.1
M=D
// StaticTest: push static 3
@StaticTest.3
D=M
@SP
A=M
M=D
@SP
M=M+1
// StaticTest: push static 1
@StaticTest.1
D=M
@SP
A=M
M=D
@SP
M=M+1
// StaticTest: sub
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
// StaticTest: push static 8
@StaticTest.8
D=M
@SP
A=M
M=D
@SP
M=M+1
// StaticTest: add
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