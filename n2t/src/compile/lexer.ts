import { Lexer as BaseLexer } from '../shared/lexer';
import { Token, TokenType } from '../shared/token';
import { XMLNode } from './object';

/**
 * Lexer for the compiler that simply wraps the base lexer and
 * records a list of all tokens that can be later converted to XML
 */
export class Lexer extends BaseLexer {
    /** List of ALL tokens returned by nextToken */
    private tokens: Token[] = [];
    
    constructor(input: string) {
        super(input);
        this.skipComments();
        this.skipNewlines();
    }

    /** Wrapper around base lexer next token that records all tokens internally */
    public nextToken() {
        const token = super.nextToken();
        this.tokens.push(token);
        return token;
    }

    /** Exports a single tokens xml node with  */
    toXMLNode(): XMLNode {
        const children: XMLNode[] = [];
        for (const token of this.tokens) {
            const tag = TOKEN_TAG[token.type];
            if (tag !== Tag.unhandled) {
                children.push({
                    tag,
                    props: {
                        line: token.line.toString(),
                        col: token.col.toString(),
                    },
                    children: token.literal,
                });
            }
        }
        return {
            tag: 'tokens',
            children,
        }
    }
}

/** Possible tokenizer XML token tags */
enum Tag {
    keyword = 'keyword',
    symbol = 'symbol',
    integerConstant = 'integerConstant',
    stringConstant = 'stringConstant',
    identifier = 'identifier',
    unhandled = 'unhandled',
}

/** Map of each token type to the appropriate lexicon XML tag */
const TOKEN_TAG: { [type in TokenType]: string } = {
    /********************* KEYWORD *******************/
    [TokenType.Class]: Tag.keyword,
    [TokenType.Constructor]: Tag.keyword,
    [TokenType.Function]: Tag.keyword,
    [TokenType.Method]: Tag.keyword,
    [TokenType.Field]: Tag.keyword,
    [TokenType.Static]: Tag.keyword,
    [TokenType.Var]: Tag.keyword,
    [TokenType.Int]: Tag.keyword,
    [TokenType.Char]: Tag.keyword,
    [TokenType.Boolean]: Tag.keyword,
    [TokenType.Void]: Tag.keyword,
    [TokenType.True]: Tag.keyword,
    [TokenType.False]: Tag.keyword,
    [TokenType.Null]: Tag.keyword,
    [TokenType.This]: Tag.keyword,
    [TokenType.Let]: Tag.keyword,
    [TokenType.Do]: Tag.keyword,
    [TokenType.If]: Tag.keyword,
    [TokenType.Else]: Tag.keyword,
    [TokenType.While]: Tag.keyword,
    [TokenType.Return]: Tag.keyword,
    /**************** SYMBOL ******************/
    [TokenType.LBrace]: Tag.symbol,
    [TokenType.RBrace]: Tag.symbol,
    [TokenType.LParen]: Tag.symbol,
    [TokenType.RParen]: Tag.symbol,
    [TokenType.LBrack]: Tag.symbol,
    [TokenType.RBrack]: Tag.symbol,
    [TokenType.Period]: Tag.symbol,
    [TokenType.Comma]: Tag.symbol,
    [TokenType.Semi]: Tag.symbol,
    [TokenType.Plus]: Tag.symbol,
    [TokenType.Minus]: Tag.symbol,
    [TokenType.Mult]: Tag.symbol,
    [TokenType.Div]: Tag.symbol,
    [TokenType.And]: Tag.symbol,
    [TokenType.Or]: Tag.symbol,
    [TokenType.Lt]: Tag.symbol,
    [TokenType.Gt]: Tag.symbol,
    [TokenType.Equal]: Tag.symbol,
    [TokenType.Neg]: Tag.symbol,
    /****************** OTHERS *******************/
    [TokenType.IntConst]: Tag.integerConstant,
    [TokenType.StringConst]: Tag.stringConstant,
    [TokenType.Ident]: Tag.identifier,
    /******************* UNHANDLED *******************/
    [TokenType.Newline]: Tag.unhandled,
    [TokenType.Comment]: Tag.unhandled,
    [TokenType.Eof]: Tag.unhandled,
    [TokenType.Illegal]: Tag.unhandled,
    [TokenType.Unknown]: Tag.unhandled,
    [TokenType.At]: Tag.unhandled,
}