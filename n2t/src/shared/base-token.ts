/** Generic coverage of token types found in jack, vm, and hack assembly */
export enum BaseTokenType {
    // ************** GENERAL ********************
    Unknown = 'Unknown', // Any unknown/unrecognized character
    Illegal = 'Illegal', // A known illegal character or usage of a character
    Eof = 'Eof',         // End of the file
    
    // ************ WHITESPACE/COMMENTS *************
    Newline = 'Newline',             // \n
    InlineComment = 'InlineComment', // "//..."
    MultiComment = 'MultiComment',   // "/* ... */"
    DocComment = 'DocComment',       // "/** ... */"
    
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
    Assign = 'Assign', // =
    Equal = 'Equal',   // ==
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
    Lte = 'Lte',       // <=
    Gte = 'Gte',       // >=
    At = 'At',         // @

    // *********** CONSTANTS ************
    IntConst = 'IntConst',       // 123
    StringConst = 'StringConst', // "abc..."
    
    // ************ IDENTIFIER ************
    Ident = 'Ident',
}

/** The data type for an individual token */
export interface BaseToken {
    /** Line number where the token was found in the original source */
    line: number;
    /** Column number where the token starts in the original source */
    col: number;
    /** Token type */
    type: BaseTokenType;
    /** Token literal */
    literal: string;
}