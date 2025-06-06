/**
 * Compile Parser
 * Author      : Philip Brown
 * Source Code : https://github.com/pwbrown/nand2tetris/n2t/src/compile/parser.ts
 */

import { BaseParser } from '../shared/base-parser';
import { Lexer } from '../shared/lexer';
import { TokenType } from '../shared/token';
import {
    ClassObj,
    ClassVarDecObj,
    DataType,
    DoStatementObj,
    ExpressionGroupObj,
    ExpressionListObj,
    ExpressionObj,
    IdentifierObj,
    IfStatementObj,
    IndexExpressionObj,
    IntegerConstObj,
    KeywordObj,
    LetStatementObj,
    ParameterListObj,
    ReturnStatementObj,
    StatementObj,
    StatementsObj,
    StringConstObj,
    SubroutineBodyObj,
    SubroutineCallObj,
    SubroutineDecObj,
    SymbolObj,
    Term,
    TermObj,
    UnaryOpTermObj,
    VarDecObj,
    WhileStatementObj,
} from './object';

export class Parser extends BaseParser {
    constructor(lexer: Lexer) {
        lexer
            .skipComments()
            .skipNewlines();
        super(lexer);
    }

    /** Parse the program class */
    public parseClass(): ClassObj | null {
        /** Class Keyword */
        if (!this.curTokenIs(TokenType.Class)) {
            this.tokenError(this.curToken, `expected class but got ${this.curToken.type}`);
            return null;
        }
        const classKeyword = new KeywordObj(this.curToken);
        /** Class Name */
        if (!this.expectPeek(TokenType.Ident)) {
            return null;
        }
        const className = new IdentifierObj(this.curToken);
        /** Left Brace */
        if (!this.expectPeek(TokenType.LBrace)) {
            return null;
        }
        const lBrace = new SymbolObj(this.curToken);
        /** Variable Declarations */
        const varDecs = this.parseClassVarDecs();
        if (!varDecs) {
            return null;
        }
        /** Subroutine Declarations */
        const subroutineDecs = this.parseSubroutineDecs();
        if (!subroutineDecs || !this.expectPeek(TokenType.RBrace)) {
            return null;
        }
        /** Right Brace */
        const rBrace = new SymbolObj(this.curToken);
        return new ClassObj(
            classKeyword,
            className,
            lBrace,
            varDecs,
            subroutineDecs,
            rBrace,
        );
    }

    /** Parse zero or more class variable declarations */
    private parseClassVarDecs(): ClassVarDecObj[] | null {
        const varDecs: ClassVarDecObj[] = [];
        while(this.peekTokenIs(TokenType.Field, TokenType.Static)) {
            const varDec = this.parseVarDec('class');
            if (!varDec) {
                return null;
            }
            varDecs.push(varDec);
        }
        return varDecs;
    }

    /** Parse zero or more subroutine declarations */
    private parseSubroutineDecs(): SubroutineDecObj[] | null {
        const subroutineDecs: SubroutineDecObj[] = [];
        while (this.peekTokenIs(TokenType.Constructor, TokenType.Method, TokenType.Function)) {
            const subroutineDec = this.parseSubroutineDec();
            if (!subroutineDec) {
                return null;
            }
            subroutineDecs.push(subroutineDec);
        }
        return subroutineDecs;
    }

    /** Parse a single class subroutine declaration */
    private parseSubroutineDec(): SubroutineDecObj | null {
        /** Get subroutine type */
        this.nextToken();
        const routineType = new KeywordObj(this.curToken);
        /** Get return type */
        if (!this.expectPeekDataType(TokenType.Void)) {
            return null;
        }
        const returnType = this.curToDataTypeObj();
        /** Get subroutine name */
        if (!this.expectPeek(TokenType.Ident)) {
            return null;
        }
        const subroutineName = new IdentifierObj(this.curToken);
        /** Left paren */
        if (!this.expectPeek(TokenType.LParen)) {
            return null;
        }
        const lParenSymbol = new SymbolObj(this.curToken);
        /** Parameter List */
        const params = this.parseParameterList();
        if (!params) {
            return null;
        }
        /** Right paren */
        if (!this.expectPeek(TokenType.RParen)) {
            return null;
        }
        const rParenSymbol = new SymbolObj(this.curToken);
        /** Subroutine body */
        const body = this.parseSubroutineBody();
        if (!body) {
            return null;
        }
        return new SubroutineDecObj(
            routineType,
            returnType,
            subroutineName,
            lParenSymbol,
            params,
            rParenSymbol,
            body,
        );
    }

    /** Parse a list of parameters */
    private parseParameterList(): ParameterListObj | null {
        const params: [type: DataType, name: IdentifierObj][] = [];
        const commas: SymbolObj[] = [];
        if (this.peekTokenIsDataType()) {
            /** Parse the first parameter */
            const param = this.parseParameter();
            if (!param) {
                return null;
            }
            params.push(param);
            /** Check for additional parameters seperated by commas */
            while(this.peekTokenIs(TokenType.Comma)) {
                this.nextToken();
                commas.push(new SymbolObj(this.curToken));
                const param = this.parseParameter();
                if (!param) {
                    return null;
                }
                params.push(param);
            }
        }
        return new ParameterListObj(params, commas);
    }

    /** Parse a single parameter */
    private parseParameter(): [type: DataType, name: IdentifierObj] | null {
        this.nextToken();
        const paramType = this.curToDataTypeObj();
        if (!this.expectPeek(TokenType.Ident)) {
            return null;
        }
        const paramName = new IdentifierObj(this.curToken);
        return [paramType, paramName];
    }

    /** Parse a subroutine body object */
    private parseSubroutineBody(): SubroutineBodyObj | null {
        /** Left Brace */
        if (!this.expectPeek(TokenType.LBrace)) {
            return null;
        }
        const lBrace = new SymbolObj(this.curToken);
        /** Variable declarations */
        const varDecs = this.parseVarDecs();
        if (!varDecs) {
            return null;
        }
        /** Statements */
        const statements = this.parseStatements();
        if (!statements) {
            return null;
        }
        /** Right Brace */
        if (!this.expectPeek(TokenType.RBrace)) {
            return null;
        }
        const rBrace = new SymbolObj(this.curToken);
        return new SubroutineBodyObj(
            lBrace,
            varDecs,
            statements,
            rBrace,
        );
    }

    /** Parse zero or more variable declarations */
    private parseVarDecs(): VarDecObj[] | null {
        const varDecs: VarDecObj[] = [];
        while(this.peekTokenIs(TokenType.Var)) {
            const varDec = this.parseVarDec('subroutine');
            if (!varDec) {
                return null;
            }
            varDecs.push(varDec);
        }
        return varDecs;
    }

    /** Parse a single variable declaration */
    private parseVarDec<T extends VarDecContext>(context: T): VarDecReturn<T> | null {
        /** Get keyword (var) */
        this.nextToken();
        const varKeyword = new KeywordObj(this.curToken);
        /** Get data type (int, char, boolean, or ClassName) */
        if (!this.expectPeekDataType()) {
            return null;
        }
        const varType = this.curToDataTypeObj();
        /** Get variable names */
        const varNames: IdentifierObj[] = [];
        const commaSymbols: SymbolObj[] = [];
        if (!this.expectPeek(TokenType.Ident)) {
            return null;
        }
        varNames.push(new IdentifierObj(this.curToken));
        while (this.peekTokenIs(TokenType.Comma)) {
            this.nextToken();
            commaSymbols.push(new SymbolObj(this.curToken));
            if (!this.expectPeek(TokenType.Ident)) {
                return null;
            }
            varNames.push(new IdentifierObj(this.curToken));
        }
        /** Get semicolon */
        if (!this.expectPeek(TokenType.Semi)) {
            return null;
        }
        const semiSymbol = new SymbolObj(this.curToken);
        /** Assemble final variable declaration and push */
        if (context === 'class') {
            return new ClassVarDecObj(
                varKeyword,
                varType,
                varNames,
                commaSymbols,
                semiSymbol,
            ) as VarDecReturn<T>;
        } else {
            return new VarDecObj(
                varKeyword,
                varType,
                varNames,
                commaSymbols,
                semiSymbol,
            ) as VarDecReturn<T>;
        }
    }

    /** Parse zero or more statements */
    private parseStatements(): StatementsObj | null {
        const statements: StatementObj[] = [];
        /** Parse until the class closing brace or the end of the file */
        while (!this.peekTokenIs(TokenType.RBrace, TokenType.Eof)) {
            const statement = this.parseStatement();
            if (!statement) {
                return null;
            }
            statements.push(statement);
        }
        return new StatementsObj(statements);
    }

    /** Parse a single statement */
    private parseStatement(): StatementObj | null {
        switch(this.peekToken.type) {
            case TokenType.Let:
                return this.parseLetStatement();
            case TokenType.If:
                return this.parseIfStatement();
            case TokenType.While:
                return this.parseWhileStatement();
            case TokenType.Do:
                return this.parseDoStatement();
            case TokenType.Return:
                return this.parseReturnStatement();
            default:
                return this.tokenError(this.peekToken, `no statement parser for token '${this.peekToken.type}'`);
        }
    }

    /** Parse a let statement */
    private parseLetStatement(): LetStatementObj | null {
        /** let keyword */
        this.nextToken();
        const letKeyword = new KeywordObj(this.curToken);
        /** variable name or index expression */
        const varName = this.parseVarReference();
        if (!varName) {
            return null;
        }
        /** Equal sign */
        if (!this.expectPeek(TokenType.Equal)) {
            return null;
        }
        const equalSymbol = new SymbolObj(this.curToken);
        /** Expression */
        const expression = this.parseExpression();
        if (!expression) {
            return null;
        }
        /** Semicolon */
        if (!this.expectPeek(TokenType.Semi)) {
            return null;
        }
        const semiSymbol = new SymbolObj(this.curToken);
        return new LetStatementObj(
            letKeyword,
            varName,
            equalSymbol,
            expression,
            semiSymbol,
        );
    }

    /** Parse an if statement */
    private parseIfStatement(): IfStatementObj | null {
        /** if keyword */
        this.nextToken();
        const ifKeyword = new KeywordObj(this.curToken);
        /** Reuse parse expression group */
        const condition = this.parseExpressionGroup();
        if (!condition) {
            return null;
        }
        /** consequence block */
        const consequence = this.parseStatementBlock();
        if (!consequence) {
            return null;
        }
        /** check for alternative (else) */
        let elseKeyword: KeywordObj | null = null;
        let alternative: [
            SymbolObj | null,
            StatementsObj | null,
            SymbolObj | null
        ] | null = [null, null, null];
        if (this.peekTokenIs(TokenType.Else)) {
            /** else keyword */
            this.nextToken();
            elseKeyword = new KeywordObj(this.curToken);
            /** alternative block */
            alternative = this.parseStatementBlock();
            if (!alternative) {
                return null;
            }
        }
        return new IfStatementObj(
            ifKeyword,
            condition.lParenSymbol,
            condition.expression,
            condition.rParenSymbol,
            ...consequence,
            elseKeyword,
            ...alternative,
        );
    }

    /** Parse a while statement */
    private parseWhileStatement(): WhileStatementObj | null {
        /** while keyword */
        this.nextToken();
        const whileKeyword = new KeywordObj(this.curToken);
        /** Condition */
        const condition = this.parseExpressionGroup();
        if (!condition) {
            return null;
        }
        /** while block */
        const whileBlock = this.parseStatementBlock();
        if (!whileBlock) {
            return null;
        }
        return new WhileStatementObj(
            whileKeyword,
            condition.lParenSymbol,
            condition.expression,
            condition.rParenSymbol,
            ...whileBlock,
        );
    }

    /** Parse a do statement */
    private parseDoStatement(): DoStatementObj | null {
        /** Do keyword */
        this.nextToken();
        const doKeyword = new KeywordObj(this.curToken);
        /** Subroutine call */
        const subroutineCall = this.parseSubroutineCall();
        if (!subroutineCall) {
            return null;
        }
        /** semicolon */
        if (!this.expectPeek(TokenType.Semi)) {
            return null;
        }
        const semiSymbol = new SymbolObj(this.curToken);
        return new DoStatementObj(
            doKeyword,
            subroutineCall,
            semiSymbol,
        );
    }

    /** Parse a return statement */
    private parseReturnStatement(): ReturnStatementObj | null {
        /** return keyword */
        this.nextToken();
        const returnKeyword = new KeywordObj(this.curToken);
        /** expression */
        let expression: ExpressionObj | null = null;
        if (!this.peekTokenIs(TokenType.Semi)) {
            expression = this.parseExpression();
            if (!expression) {
                return null;
            }
        }
        /** semicolon */
        if (!this.expectPeek(TokenType.Semi)) {
            return null;
        }
        const semiSymbol = new SymbolObj(this.curToken);
        return new ReturnStatementObj(
            returnKeyword,
            expression,
            semiSymbol,
        );
    }

    /** Parses a list of statements surrounded by curly braces */
    private parseStatementBlock(): [lBrace: SymbolObj, stmts: StatementsObj, rBrace: SymbolObj] | null {
        /** left brace */
        if (!this.expectPeek(TokenType.LBrace)) {
            return null;
        }
        const lBrace = new SymbolObj(this.curToken);
        /** block statements */
        const statements = this.parseStatements();
        if (!statements) {
            return null;
        }
        /** right brace */
        if (!this.expectPeek(TokenType.RBrace)) {
            return null;
        }
        const rBrace = new SymbolObj(this.curToken);
        return [lBrace, statements, rBrace];
    }

    /** Parses an expression list */
    private parseExpressionList(terminator = TokenType.RParen): ExpressionListObj | null {
        const expressions: ExpressionObj[] = [];
        const commaSymbols: SymbolObj[] = [];
        if (!this.peekTokenIs(terminator)) {
            /** Parse initial expression */
            const expression = this.parseExpression();
            if (!expression) {
                return null;
            }
            expressions.push(expression);
            while (this.peekTokenIs(TokenType.Comma)) {
                /** Parse comma */
                this.nextToken();
                commaSymbols.push(new SymbolObj(this.curToken));
                /** Parse expression */
                const expression = this.parseExpression();
                if (!expression) {
                    return null;
                }
                expressions.push(expression);
            }
        }
        return new ExpressionListObj(expressions, commaSymbols);
    }

    /** Parse an expression */
    private parseExpression(): ExpressionObj | null {
        const terms: TermObj[] = [];
        const ops: SymbolObj[] = [];
        /** Initial term */
        const term = this.parseTerm();
        if (!term) {
            return null;
        }
        terms.push(term);
        /** Additional operators and terms */
        while (this.peekTokenIsOp()) {
            /** Op */
            this.nextToken();
            ops.push(new SymbolObj(this.curToken));
            /** Term */
            const term = this.parseTerm();
            if (!term) {
                return null;
            }
            terms.push(term);
        }
        return new ExpressionObj(terms, ops);
    }

    /** Parse a term */
    private parseTerm(): TermObj | null {
        let term: Term | null;
        /** Integer Constant */
        if (this.peekTokenIs(TokenType.IntConst)) {
            this.nextToken();
            term = new IntegerConstObj(this.curToken);
        }
        /** String Constant */
        else if (this.peekTokenIs(TokenType.StringConst)) {
            this.nextToken();
            term = new StringConstObj(this.curToken);
        }
        /** Keyword Constant */
        else if (this.peekTokenIsKeywordConst()) {
            this.nextToken();
            term = new KeywordObj(this.curToken);
        }
        /** Terms that start with an identifier */
        else if (this.peekTokenIs(TokenType.Ident)) {
            this.nextToken(); // Need to see the next token
            /** Subroutine call */
            if (this.peekTokenIs(TokenType.Period, TokenType.LParen)) {
                term = this.parseSubroutineCall(true);
            }
            /** Variable or index expression */
            else {
                term = this.parseVarReference(true);
            }
            if (!term) {
                return null;
            }
        }
        /** Expression Group */
        else if (this.peekTokenIs(TokenType.LParen)) {
            term = this.parseExpressionGroup();
            if (!term) {
                return null;
            }
        }
        /** Unary operator term */
        else if (this.peekTokenIsUnaryOp()) {
            term = this.parseUnaryOpTerm();
            if (!term) {
                return null;
            }
        }
        /** Unsupported token */
        else {
            this.tokenError(this.peekToken, `unsupported term token '${this.peekToken.type}`);
            return null;
        }
        return new TermObj(term);
    }

    /** Parse and expression surrounded by parenthesis */
    private parseExpressionGroup(): ExpressionGroupObj | null {
        /** Left paren */
        if (!this.expectPeek(TokenType.LParen)) {
            return null;
        }
        const lParen = new SymbolObj(this.curToken);
        /** Expression */
        const expression = this.parseExpression();
        if (!expression) {
            return null;
        }
        /** Right paren */
        if (!this.expectPeek(TokenType.RParen)) {
            return null;
        }
        const rParen = new SymbolObj(this.curToken);
        return new ExpressionGroupObj(lParen, expression, rParen);
    }

    /** Parse unary op term */
    private parseUnaryOpTerm(): UnaryOpTermObj | null {
        /** Unary operator */
        this.nextToken();
        const op = new SymbolObj(this.curToken);
        /** Term */
        const term = this.parseTerm();
        if (!term) {
            return null;
        }
        return new UnaryOpTermObj(op, term);
    }

    /** Parse a variable name or an indexed variable expression */
    private parseVarReference(isCur = false): IdentifierObj | IndexExpressionObj | null {
        if (!isCur && !this.expectPeek(TokenType.Ident)) {
            return null;
        }
        const varName = new IdentifierObj(this.curToken);
        /** Check for index expression */
        if (this.peekTokenIs(TokenType.LBrack)) {
            /** Left Bracket */
            this.nextToken();
            const lBrack = new KeywordObj(this.curToken);
            /** index expression */
            const expression = this.parseExpression();
            if (!expression) {
                return null;
            }
            /** Right Bracket */
            if (!this.expectPeek(TokenType.RBrack)) {
                return null;
            }
            const rBrack = new KeywordObj(this.curToken);
            return new IndexExpressionObj(
                varName,
                lBrack,
                expression,
                rBrack,
            );
        }
        return varName;
    }

    /** Parse a subroutine call */
    private parseSubroutineCall(isCur = false): SubroutineCallObj | null {
        /** Handle the optional class reference after parsing first ident */
        let objName: IdentifierObj | null = null;
        let periodSymbol: SymbolObj | null = null;
        /** Subroutine or object name */
        if (!isCur) {
            this.nextToken();
        }
        let subroutineName = new IdentifierObj(this.curToken);
        /** Handle class subroutine */
        if (this.peekTokenIs(TokenType.Period)) {
            /** Reassign the subroutine name as the object name */
            objName = subroutineName;
            /** Period symbol */
            this.nextToken();
            periodSymbol = new SymbolObj(this.curToken);
            /** subroutine name */
            if (!this.expectPeek(TokenType.Ident)) {
                return null;
            }
            subroutineName = new IdentifierObj(this.curToken);
        }
        /** left paren */
        if (!this.expectPeek(TokenType.LParen)) {
            return null;
        }
        const lParen = new SymbolObj(this.curToken);
        /** Expression list */
        const expressionList = this.parseExpressionList();
        if (!expressionList) {
            return null;
        }
        /** right paren */
        if (!this.expectPeek(TokenType.RParen)) {
            return null;
        }
        const rParen = new SymbolObj(this.curToken);
        return new SubroutineCallObj(
            objName,
            periodSymbol,
            subroutineName,
            lParen,
            expressionList,
            rParen,
        );
    }

    /** Expect a data type token */
    private expectPeekDataType(...types: TokenType[]) {
        return this.expectPeek(
            TokenType.Int,
            TokenType.Char,
            TokenType.Boolean,
            TokenType.Ident,
            ...types,
        );
    }

    /** Check if the peek token is a data type */
    private peekTokenIsDataType() {
        return this.peekTokenIs(
            TokenType.Int,
            TokenType.Char,
            TokenType.Boolean,
            TokenType.Ident,
        );
    }

    /** Check if the peek token is a keyword constant */
    private peekTokenIsKeywordConst() {
        return this.peekTokenIs(
            TokenType.True,
            TokenType.False,
            TokenType.Null,
            TokenType.This,
        );
    }

    /** Check if the peek token is an operator token */
    private peekTokenIsOp() {
        return this.peekTokenIs(
            TokenType.Plus,  // +
            TokenType.Minus, // -
            TokenType.Mult,  // *
            TokenType.Div,   // /
            TokenType.And,   // &
            TokenType.Or,    // |
            TokenType.Lt,    // <
            TokenType.Gt,    // >
            TokenType.Equal, // =
        );
    }

    /** Check if the peek token is a unary operator token */
    private peekTokenIsUnaryOp() {
        return this.peekTokenIs(
            TokenType.Neg,   // ~
            TokenType.Minus, // -
        );
    }

    /** Convert the current token to the appropriate data type object */
    private curToDataTypeObj(): KeywordObj | IdentifierObj {
        return this.curTokenIs(TokenType.Ident)
            ? new IdentifierObj(this.curToken)
            : new KeywordObj(this.curToken);
    }
}

/***************** HELPER TYPES **************************/
type VarDecContext = 'class' | 'subroutine';
type VarDecReturn<T> = 
    T extends 'class' ? ClassVarDecObj :
    T extends 'subroutine' ? VarDecObj :
    never;