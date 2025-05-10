// SimpleAdd: push constant 7
@7
D=A
@SP
A=M
M=D
@SP
M=M+1
// SimpleAdd: push constant 8
@8
D=A
@SP
A=M
M=D
@SP
M=M+1
// SimpleAdd: add
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