// FibonacciSeries: push argument 1
@ARG
A=M+1
D=M
@SP
A=M
M=D
@SP
M=M+1
// FibonacciSeries: pop pointer 1
@SP
AM=M-1
D=M
@THAT
M=D
// FibonacciSeries: push constant 0
@0
D=A
@SP
A=M
M=D
@SP
M=M+1
// FibonacciSeries: pop that 0
@SP
AM=M-1
D=M
@THAT
A=M
M=D
// FibonacciSeries: push constant 1
@1
D=A
@SP
A=M
M=D
@SP
M=M+1
// FibonacciSeries: pop that 1
@1
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
// FibonacciSeries: push argument 0
@ARG
A=M
D=M
@SP
A=M
M=D
@SP
M=M+1
// FibonacciSeries: push constant 2
@2
D=A
@SP
A=M
M=D
@SP
M=M+1
// FibonacciSeries: sub
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
// FibonacciSeries: pop argument 0
@SP
AM=M-1
D=M
@ARG
A=M
M=D
// FibonacciSeries: label LOOP
(FibonacciSeries$LOOP)
// FibonacciSeries: push argument 0
@ARG
A=M
D=M
@SP
A=M
M=D
@SP
M=M+1
// FibonacciSeries: if-goto COMPUTE_ELEMENT
@SP
AM=M-1
D=M
@FibonacciSeries$COMPUTE_ELEMENT
D;JNE
// FibonacciSeries: goto END
@FibonacciSeries$END
0;JMP
// FibonacciSeries: label COMPUTE_ELEMENT
(FibonacciSeries$COMPUTE_ELEMENT)
// FibonacciSeries: push that 0
@THAT
A=M
D=M
@SP
A=M
M=D
@SP
M=M+1
// FibonacciSeries: push that 1
@THAT
A=M+1
D=M
@SP
A=M
M=D
@SP
M=M+1
// FibonacciSeries: add
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
// FibonacciSeries: pop that 2
@2
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
// FibonacciSeries: push pointer 1
@THAT
D=M
@SP
A=M
M=D
@SP
M=M+1
// FibonacciSeries: push constant 1
@1
D=A
@SP
A=M
M=D
@SP
M=M+1
// FibonacciSeries: add
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
// FibonacciSeries: pop pointer 1
@SP
AM=M-1
D=M
@THAT
M=D
// FibonacciSeries: push argument 0
@ARG
A=M
D=M
@SP
A=M
M=D
@SP
M=M+1
// FibonacciSeries: push constant 1
@1
D=A
@SP
A=M
M=D
@SP
M=M+1
// FibonacciSeries: sub
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
// FibonacciSeries: pop argument 0
@SP
AM=M-1
D=M
@ARG
A=M
M=D
// FibonacciSeries: goto LOOP
@FibonacciSeries$LOOP
0;JMP
// FibonacciSeries: label END
(FibonacciSeries$END)