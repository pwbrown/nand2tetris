/**
 * BaseLexer
 * Author      : Philip Brown
 * Source Code : https://github.com/pwbrown/nand2tetris/n2t/src/shared/token.ts
 * Notes       : Modified from https://github.com/pwbrown/ts-monkey/blob/main/src/token/token.ts
 */

/** Generic coverage of token types found in jack, vm, and hack assembly */
export enum TokenType {
    // ************** GENERAL ********************
    Unknown = 'Unknown', // Any unknown/unrecognized character
    Illegal = 'Illegal', // A known illegal character or usage of a character
    Eof = 'Eof',         // End of the file
    
    // ************ WHITESPACE/COMMENTS *************
    Newline = 'Newline',             // \n
    Comment = 'Comment', // "//..." OR /** */ OR /* */
    
    // ************* KEYWORDS ****************
    Class = 'Class',
    Constructor = 'Constructor',
    Method = 'Method',
    Function = 'Function',
    Int = 'Int',
    Boolean = 'Boolean',
    Char = 'Char',
    Void = 'Void',
    Var = 'Var',
    Static = 'Static',
    Field = 'Field',
    Let = 'Let',
    Do = 'Do',
    If = 'If',
    Else = 'Else',
    While = 'While',
    Return = 'Return',
    True = 'True',
    False = 'False',
    Null = 'Null',
    This = 'This',

    // ************ SYMBOLS **************
    LParen = 'LParen', // (
    RParen = 'RParen', // )
    LBrack = 'LBrack', // [
    RBrack = 'RBrack', // ]
    LBrace = 'LBrace', // {
    RBrace = 'RBrace', // }
    Comma = 'Comma',   // ,
    Semi = 'Semi',     // ;
    Equal = 'Equal',   // =
    Period = 'Period', // .
    Plus = 'Plus',     // +
    Minus = 'Minus',   // -
    Mult = 'Mult',     // *
    Div = 'Div',       // /
    And = 'And',       // &
    Or = 'Or',         // |
    Neg = 'Neg',       // ~
    Lt = 'Lt',         // <
    Gt = 'Gt',         // >
    At = 'At',         // @

    // *********** CONSTANTS ************
    IntConst = 'IntConst',       // 123
    StringConst = 'StringConst', // "abc..."
    
    // ************ IDENTIFIER ************
    Ident = 'Ident',
}

/** The data type for an individual token */
export interface Token {
    /** Line number where the token was found in the original source */
    line: number;
    /** Column number where the token starts in the original source */
    col: number;
    /** Token type */
    type: TokenType;
    /** Token literal */
    literal: string;
}