// BasicLoop: push constant 0
@0
D=A
@SP
A=M
M=D
@SP
M=M+1
// BasicLoop: pop local 0
@SP
AM=M-1
D=M
@LCL
A=M
M=D
// BasicLoop: label LOOP
(BasicLoop$LOOP)
// BasicLoop: push argument 0
@ARG
A=M
D=M
@SP
A=M
M=D
@SP
M=M+1
// BasicLoop: push local 0
@LCL
A=M
D=M
@SP
A=M
M=D
@SP
M=M+1
// BasicLoop: add
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
// BasicLoop: pop local 0
@SP
AM=M-1
D=M
@LCL
A=M
M=D
// BasicLoop: push argument 0
@ARG
A=M
D=M
@SP
A=M
M=D
@SP
M=M+1
// BasicLoop: push constant 1
@1
D=A
@SP
A=M
M=D
@SP
M=M+1
// BasicLoop: sub
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
// BasicLoop: pop argument 0
@SP
AM=M-1
D=M
@ARG
A=M
M=D
// BasicLoop: push argument 0
@ARG
A=M
D=M
@SP
A=M
M=D
@SP
M=M+1
// BasicLoop: if-goto LOOP
@SP
AM=M-1
D=M
@BasicLoop$LOOP
D;JNE
// BasicLoop: push local 0
@LCL
A=M
D=M
@SP
A=M
M=D
@SP
M=M+1