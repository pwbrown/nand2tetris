/**
 * Compile Parse Tree Objects
 * Author      : Philip Brown
 * Source Code : https://github.com/pwbrown/nand2tetris/n2t/src/compile/object.ts
 */

import { Token, TokenType } from "../shared/token";

/** A single node of XML */
export interface XMLNode {
    tag: string;
    props: { [key: string]: string };
    children: string | XMLNode[];
}

/** Generic Object Interface */
export interface Obj {
    /** The first token associated with the object */
    token: Token;
    /** Generates the XML representation of the object as a list of lines */
    toXMLNode: () => XMLNode;
}

/******************** Lexical Elements ***********************/

/** Keyword element */
export class KeywordObj implements Obj {
    constructor(public token: Token) {}

    toXMLNode(): XMLNode {
        return buildXMLNode('keyword', this.token);
    }
}

/** Symbol element */
export class SymbolObj implements Obj {
    constructor(public token: Token) {}

    toXMLNode(): XMLNode {
        return buildXMLNode('symbol', this.token);
    }
}

/** Integer Constant */
export class IntegerConstObj implements Obj {
    public value: number;

    constructor(public token: Token) {
        this.value = parseInt(token.literal, 10);
    }

    toXMLNode(): XMLNode {
        return buildXMLNode('integerConstant', this.token);
    }
}

/** String Constant */
export class StringConstObj implements Obj {
    constructor(public token: Token) {}

    toXMLNode(): XMLNode {
        return buildXMLNode('stringConstant', this.token);
    }
}

/** Identifier */
export class IdentifierObj implements Obj {
    constructor(public token: Token) {}

    toXMLNode(): XMLNode {
        return buildXMLNode('identifier', this.token);
    }
}

/************************** Program Structure ************************/

/** Possible data types (int, char, boolean, className) */
export type DataType = KeywordObj | IdentifierObj;

/** Class */
export class ClassObj implements Obj {
    public token: Token;

    constructor(
        public classKeyword: KeywordObj,
        public classNameIdentifier: IdentifierObj,
        public lBraceSymbol: SymbolObj,
        public classVarDecs: ClassVarDecObj[],
        public subroutineDecs: SubroutineDecObj[],
        public rBraceSymbol: SymbolObj,
    ) {
        this.token = classKeyword.token;
    }

    toXMLNode(): XMLNode {
        return buildXMLNode('class', this.token, [
            this.classKeyword.toXMLNode(),
            this.classNameIdentifier.toXMLNode(),
            this.lBraceSymbol.toXMLNode(),
            ...this.classVarDecs.map((dec) => dec.toXMLNode()),
            ...this.subroutineDecs.map((dec) => dec.toXMLNode()),
            this.rBraceSymbol.toXMLNode(),
        ]);
    };
}

/** Class variable declaration */
export class ClassVarDecObj implements Obj {
    public token: Token;

    constructor(
        public classVarKeyword: KeywordObj,
        public varType: DataType,
        public varNames: IdentifierObj[],
        public commaSymbols: SymbolObj[],
        public semiSymbol: SymbolObj,
    ) {
        this.token = classVarKeyword.token;
    }

    toXMLNode(): XMLNode {
        const varList: XMLNode[] = [];
        this.varNames.forEach((varName, i) => {
            if (i > 0) {
                varList.push(this.commaSymbols[i - 1].toXMLNode());
            }
            varList.push(varName.toXMLNode());
        });
        return buildXMLNode('varDec', this.token, [
            this.classVarKeyword.toXMLNode(),
            this.varType.toXMLNode(),
            ...varList,
            this.semiSymbol.toXMLNode(),
        ]);
    }
}

/** Subroutine declaration */
export class SubroutineDecObj implements Obj {
    public token: Token;

    constructor(
        public routineType: KeywordObj,
        public returnType: DataType,
        public nameIdentifier: IdentifierObj,
        public lParenSymbol: SymbolObj,
        public parameterList: ParameterListObj,
        public rParenSymbol: SymbolObj,
        public subroutineBody: SubroutineBodyObj,
    ) {
        this.token = routineType.token;
    }

    toXMLNode(): XMLNode {
        return buildXMLNode('subroutineDec', this.token, [
            this.routineType.toXMLNode(),
            this.returnType.toXMLNode(),
            this.nameIdentifier.toXMLNode(),
            this.lParenSymbol.toXMLNode(),
            this.parameterList.toXMLNode(),
            this.rParenSymbol.toXMLNode(),
            this.subroutineBody.toXMLNode(),
        ]);
    }
}

/** Parameter list */
export class ParameterListObj implements Obj {
    public token: Token;

    constructor(
        public parameters: [type: DataType, name: IdentifierObj][],
        public commaSymbols: SymbolObj[],
    ) {
        this.token = this.parameters.length
            ? this.parameters[0][0].token
            : unknownToken();
    }
    
    toXMLNode(): XMLNode {
        const children: XMLNode[] = [];
        this.parameters.forEach(([varType, varName], i) => {
            if (i > 0) {
                children.push(this.commaSymbols[i - 1].toXMLNode());
            }
            children.push(
                varType.toXMLNode(),
                varName.toXMLNode(),
            );
        });
        return buildXMLNode('parameterList', this.token, children);
    };
}

/** Subroutine body */
export class SubroutineBodyObj implements Obj {
    public token: Token;

    constructor(
        public lBraceSymbol: SymbolObj,
        public varDecs: VarDecObj[],
        public statements: StatementsObj,
        public rBraceSymbol: SymbolObj,
    ) {
        this.token = lBraceSymbol.token;
    }

    toXMLNode(): XMLNode {
        return buildXMLNode('subroutineBody', this.token, [
            this.lBraceSymbol.toXMLNode(),
            ...this.varDecs.map((dec) => dec.toXMLNode()),
            this.statements.toXMLNode(),
            this.rBraceSymbol.toXMLNode(),
        ]);
    }
}

/** Variable declaration */
export class VarDecObj implements Obj {
    public token: Token;

    constructor(
        public varKeyword: KeywordObj,
        public varType: DataType,
        public varNames: IdentifierObj[],
        public commaSymbols: SymbolObj[],
        public semiSymbol: SymbolObj,
    ) {
        this.token = varKeyword.token;
    }

    toXMLNode(): XMLNode {
        const varList: XMLNode[] = [];
        this.varNames.forEach((varName, i) => {
            if (i > 0) {
                varList.push(this.commaSymbols[i - 1].toXMLNode());
            }
            varList.push(varName.toXMLNode());
        });
        return buildXMLNode('varDec', this.token, [
            this.varKeyword.toXMLNode(),
            this.varType.toXMLNode(),
            ...varList,
            this.semiSymbol.toXMLNode(),
        ]);
    }
}


/************************** Statements ******************************/

/** Statement is a union of multiple statement types */
export type StatementObj =
    LetStatementObj |
    IfStatementObj |
    WhileStatementObj |
    DoStatementObj |
    ReturnStatementObj;

/** List of Statements */
export class StatementsObj implements Obj {
    public token: Token;

    constructor(public statements: StatementObj[]) {
        /** Assign token to the first statement token */
        this.token = statements[0]?.token || {
            type: TokenType.Unknown,
            literal: '',
            line: -1,
            col: -1,
        };
    }

    toXMLNode(): XMLNode {
        return buildXMLNode(
            'statements',
            this.token,
            this.statements.map((stmt) => stmt.toXMLNode()),
        );
    }
}

/** Let Statement */
export class LetStatementObj implements Obj {
    public token: Token;

    constructor(
        public letKeyword: KeywordObj,
        public variable: IdentifierObj | IndexExpressionObj,
        public equalSymbol: SymbolObj,
        public expression: ExpressionObj,
        public semiSymbol: SymbolObj,
    ) {
        this.token = letKeyword.token;
    }

    toXMLNode(): XMLNode {
        return buildXMLNode('letStatement', this.token, [
            this.letKeyword.toXMLNode(),
            /** Handle variable vs index expression differently */
            ...(
                this.variable instanceof IdentifierObj
                    ? [this.variable.toXMLNode()]
                    : this.variable.toXMLNode().children as XMLNode[]
            ),
            this.variable.toXMLNode(),
            this.equalSymbol.toXMLNode(),
            this.expression.toXMLNode(),
            this.semiSymbol.toXMLNode(),
        ]);
    }
}


/** If/Else Statement */
export class IfStatementObj implements Obj {
    public token: Token;

    constructor(
        public ifKeyword: KeywordObj,
        public lParenSymbol: SymbolObj,
        public conditionExpression: ExpressionObj,
        public rParenSymbol: SymbolObj,
        public consLBraceSymbol: SymbolObj,
        public consequenceStatements: StatementsObj,
        public consRBraceSymbol: SymbolObj,
        public elseKeyword: KeywordObj | null,
        public altLBraceSymbol: SymbolObj | null,
        public altStatements: StatementsObj | null,
        public altRBraceSymbol: SymbolObj | null,
    ) {
        this.token = ifKeyword.token;
    }

    toXMLNode(): XMLNode {
        return buildXMLNode('ifStatement', this.token, [
            this.ifKeyword.toXMLNode(),
            this.lParenSymbol.toXMLNode(),
            this.conditionExpression.toXMLNode(),
            this.rParenSymbol.toXMLNode(),
            this.consLBraceSymbol.toXMLNode(),
            this.consequenceStatements.toXMLNode(),
            this.consRBraceSymbol.toXMLNode(),
            ...(
                this.elseKeyword && this.altLBraceSymbol && this.altStatements && this.altRBraceSymbol
                    ? [
                        this.elseKeyword.toXMLNode(),
                        this.altLBraceSymbol.toXMLNode(),
                        this.altStatements.toXMLNode(),
                        this.altRBraceSymbol.toXMLNode(),
                    ] :
                    []
            )
        ]);
    }
}

/** While Statement */
export class WhileStatementObj implements Obj {
    public token: Token;

    constructor(
        public whileKeyword: KeywordObj,
        public lParenSymbol: SymbolObj,
        public expression: ExpressionObj,
        public rParenSymbol: SymbolObj,
        public lBraceSymbol: SymbolObj,
        public statements: StatementsObj,
        public rBraceSymbol: SymbolObj,
    ) {
        this.token = whileKeyword.token;
    }

    toXMLNode(): XMLNode {
        return buildXMLNode('whileStatement', this.token, [
            this.whileKeyword.toXMLNode(),
            this.lParenSymbol.toXMLNode(),
            this.expression.toXMLNode(),
            this.rParenSymbol.toXMLNode(),
            this.lBraceSymbol.toXMLNode(),
            this.statements.toXMLNode(),
            this.rBraceSymbol.toXMLNode(),
        ]);
    }
}

/** Do Statement */
export class DoStatementObj implements Obj {
    public token: Token;

    constructor(
        public doKeyword: KeywordObj,
        public subroutineCall: SubroutineCallObj,
        public semiSymbol: SymbolObj,
    ) {
        this.token = doKeyword.token;
    }

    toXMLNode(): XMLNode {
        return buildXMLNode('doStatement', this.token, [
            this.doKeyword.toXMLNode(),
            this.subroutineCall.toXMLNode(),
            this.semiSymbol.toXMLNode(),
        ]);
    }
}

/** Return Statement with optional expression */
export class ReturnStatementObj implements Obj {
    public token: Token;

    constructor(
        public returnKeyword: KeywordObj,
        public expression: ExpressionObj | null,
        public semiSymbol: SymbolObj,
    ) {
        this.token = returnKeyword.token;
    }

    toXMLNode(): XMLNode {
        return buildXMLNode('returnStatement', this.token, [
            this.returnKeyword.toXMLNode(),
            ...(this.expression ? [this.expression.toXMLNode()] : []),
            this.semiSymbol.toXMLNode(),
        ]);
    };
}

/************************* Expressions ******************************/

/** All possible terms */
export type Term =
    IntegerConstObj |
    StringConstObj |
    KeywordObj |     // Constant keyword (true, false, null, this)
    IdentifierObj |
    IndexExpressionObj |
    SubroutineCallObj |
    ExpressionGroupObj |
    UnaryOpTermObj;

/** A single Term */
export class TermObj implements Obj {
    public token: Token;

    constructor(public term: Term) {
        this.token = term.token;
    }

    toXMLNode(): XMLNode {
        return buildXMLNode('term', this.token, [this.term.toXMLNode()]);
    };
}

/** Single Expression */
export class ExpressionObj implements Obj {
    public token: Token;

    constructor(
        public terms: TermObj[],
        public operators: SymbolObj[],
    ) {
        if (!terms.length) {
            throw new Error('Fatal error: Cannot instantiate an expression without terms');
        }
        this.token = terms[0].token;
    }

    toXMLNode(): XMLNode {
        const children: XMLNode[] = [];
        this.terms.forEach((term, i) => {
            if (i > 0) {
                children.push(this.operators[i - 1].toXMLNode());
            }
            children.push(term.toXMLNode());
        });
        return buildXMLNode('expression', this.token, children);
    };
}

/** List of Expressions */
export class ExpressionListObj implements Obj {
    public token: Token;

    constructor(
        public expressions: ExpressionObj[],
        public commaSymbols: SymbolObj[],
    ) {
        this.token = expressions.length
            ? expressions[0].token
            : unknownToken();
    }

    toXMLNode(): XMLNode {
        const children: XMLNode[] = [];
        this.expressions.forEach((exp, i) => {
            if (i > 0) {
                children.push(this.commaSymbols[i - 1].toXMLNode());
            }
            children.push(exp.toXMLNode());
        });
        return buildXMLNode('expressionList', this.token, children);
    }
}

/** An expression wrapped in parenthesis */
export class ExpressionGroupObj implements Obj {
    public token: Token;

    constructor(
        public lParenSymbol: SymbolObj,
        public expression: ExpressionObj,
        public rParenSymbol: SymbolObj,
    ) {
        this.token = lParenSymbol.token;
    }

    toXMLNode(): XMLNode {
        /** Only care about the children */
        return buildXMLNode('expressionGroup', this.token, [
            this.lParenSymbol.toXMLNode(),
            this.expression.toXMLNode(),
            this.rParenSymbol.toXMLNode(),
        ]);
    }
}

/** Unary operator followed by a term */
export class UnaryOpTermObj implements Obj {
    public token: Token;

    constructor(
        public operator: SymbolObj,
        public term: TermObj,
    ) {
        this.token = operator.token;
    }

    toXMLNode(): XMLNode {
        /** Only care about the children */
        return buildXMLNode('unaryOpTerm', this.token, [
            this.operator.toXMLNode(),
            this.term.toXMLNode(),
        ]);
    };
}

/** Call Expression for a subroutine */
export class SubroutineCallObj implements Obj {
    public token: Token;

    constructor(
        public objNameIdentifier: IdentifierObj | null,
        public periodSymbol: SymbolObj | null,
        public subroutineNameIdentifier: IdentifierObj,
        public lParenSymbol: SymbolObj,
        public expressionList: ExpressionListObj,
        public rParenSymbol: SymbolObj,
    ) {
        this.token = subroutineNameIdentifier.token;
    }

    toXMLNode(): XMLNode {
        return buildXMLNode('subroutineCall', this.token, [
            ...(
                this.objNameIdentifier && this.periodSymbol
                    ? [
                        this.objNameIdentifier.toXMLNode(),
                        this.periodSymbol.toXMLNode(),
                    ]
                    : []
            ),
            this.subroutineNameIdentifier.toXMLNode(),
            this.lParenSymbol.toXMLNode(),
            this.expressionList.toXMLNode(),
            this.rParenSymbol.toXMLNode(),
        ]);
    }
}

/** A variable index expression */
export class IndexExpressionObj implements Obj {
    public token: Token;

    constructor(
        public varIdentifier: IdentifierObj,
        public lBrackSymbol: SymbolObj,
        public indexExpression: ExpressionObj,
        public rBrackSymbol: SymbolObj,
    ) {
        this.token = varIdentifier.token;
    }

    toXMLNode(): XMLNode {
        /** We only care about the children in this node */
        return buildXMLNode('indexExpression', this.token, [
            this.varIdentifier.toXMLNode(),
            this.lBrackSymbol.toXMLNode(),
            this.indexExpression.toXMLNode(),
            this.rBrackSymbol.toXMLNode(),
        ]);
    }
}

/************************ Utility Functions ************************/

/** Build an XML Node object using simple building blocks */
const buildXMLNode = (tag: string, token: Token, children?: XMLNode[]): XMLNode => ({
    tag,
    props: {
        line: token.line.toString(),
        col: token.col.toString(),
    },
    children: children || token.literal,
});

/** Generates an unknown token for fallback usage */
const unknownToken = (): Token => ({
    type: TokenType.Unknown,
    literal: '',
    line: -1,
    col: -1,
});