/**
 * Compile XML Tests
 * Author      : Philip Brown
 * Source Code : https://github.com/pwbrown/nand2tetris/n2t/src/compile/xml.spec.ts
 */

import { toXMLString } from './xml';
import { Lexer } from '../shared/lexer';
import { Parser } from './parser';
import { ClassObj } from './object';

describe('Compile XML', () => {
    describe('Lexer XML', () => {
        it('should generate XML for all lexical tokens', () => {
            expectInputTokens(
                `
                    class MyClass {
                        field int age, weight;

                        constructor MyClass new(boolean something) {
                           let age = 0;
                           let weight = age * 2;
                           return this;
                        }

                        method void print() {
                           var String myLocal;
                           let myLocal = "Blah";
                           return;
                        }
                    }
                `,
                `
                    <tokens>
                        <keyword> class </keyword>
                        <identifier> MyClass </identifier>
                        <symbol> { </symbol>
                        <keyword> field </keyword>
                        <keyword> int </keyword>
                        <identifier> age </identifier>
                        <symbol> , </symbol>
                        <identifier> weight </identifier>
                        <symbol> ; </symbol>
                        <keyword> constructor </keyword>
                        <identifier> MyClass </identifier>
                        <identifier> new </identifier>
                        <symbol> ( </symbol>
                        <keyword> boolean </keyword>
                        <identifier> something </identifier>
                        <symbol> ) </symbol>
                        <symbol> { </symbol>
                        <keyword> let </keyword>
                        <identifier> age </identifier>
                        <symbol> = </symbol>
                        <integerConstant> 0 </integerConstant>
                        <symbol> ; </symbol>
                        <keyword> let </keyword>
                        <identifier> weight </identifier>
                        <symbol> = </symbol>
                        <identifier> age </identifier>
                        <symbol> * </symbol>
                        <integerConstant> 2 </integerConstant>
                        <symbol> ; </symbol>
                        <keyword> return </keyword>
                        <keyword> this </keyword>
                        <symbol> ; </symbol>
                        <symbol> } </symbol>
                        <keyword> method </keyword>
                        <keyword> void </keyword>
                        <identifier> print </identifier>
                        <symbol> ( </symbol>
                        <symbol> ) </symbol>
                        <symbol> { </symbol>
                        <keyword> var </keyword>
                        <identifier> String </identifier>
                        <identifier> myLocal </identifier>
                        <symbol> ; </symbol>
                        <keyword> let </keyword>
                        <identifier> myLocal </identifier>
                        <symbol> = </symbol>
                        <stringConstant> Blah </stringConstant>
                        <symbol> ; </symbol>
                        <keyword> return </keyword>
                        <symbol> ; </symbol>
                        <symbol> } </symbol>
                        <symbol> } </symbol>
                    </tokens>
                `
            );
        });
    });

    describe('Parser XML', () => {});
});


/** tokenizes an input string and compares it to the output xml */
const expectInputTokens = (input: string, xml: string, props = false) => {
    const [parser] = parseInput(input);
    const node = parser.tokensToXMLNode();
    const actualXML = toXMLString(node, { includeProps: props }).trim();
    const expectedXML = leftAlign(xml);
    expect(actualXML).toBe(expectedXML);
}

/** Use a lexer to fully tokenize an input string */
const parseInput = (input: string): [Parser, ClassObj | null, string[]] => {
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const parsed = parser.parseClass();
    const errors = parser.getErrors();
    return [parser, parsed, errors];
}

/** Left aligns text while retaining indentation pattern */
const leftAlign = (input: string): string => {
    /** Get non empty lines as an array */
    const lines = input.split('\n').filter((l) => !!l.trim());
    /** Get baseline left-padding from first string */
    const leftPadding = lines[0].length - lines[0].trimStart().length;
    return lines.map((line) => line.substring(leftPadding)).join('\n');
}