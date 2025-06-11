/**
 * Compile XML Utilities
 * Author      : Philip Brown
 * Source Code : https://github.com/pwbrown/nand2tetris/n2t/src/compile/xml.ts
 */

import { XMLNode } from './object';

interface ToXMLOptions {
    spaces?: number;
    includeProps?: boolean;
}

const DEFAULT_SPACES = 4;

/** Map of special characters to their corresponding XML entities */
const SPECIAL_CHARS: { [char: string]: string} = {
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    '&': '&amp;',
}

/** Converts a single XMLNode into an XML String */
export const toXMLString = (node: XMLNode, options: ToXMLOptions, level = 0): string => {
    const spaces = typeof options.spaces === 'number' ? options.spaces : DEFAULT_SPACES;
    const pad = ''.padStart(spaces * level);
    let props = '';
    if (options.includeProps && node.props) {
        Object.entries(node.props).forEach(([name, value]) => {
            props += ` ${name}="${value}"`;
        });
    }
    const open = `<${node.tag}${props}>`;
    const close = `</${node.tag}>`;
    /** Single Child */
    if (typeof node.children === 'string') {
        const text = node.children === 'constructor'
            ? node.children // Handle special case since constructor is technically a property of everything in javascript (lol)
            : SPECIAL_CHARS[node.children] || node.children;
        return `${pad}${open} ${text} ${close}\n`;
    }
    /** Multiple Children */
    else {
        let output = '';
        output += `${pad}${open}\n`;
        node.children.forEach((child) => {
            output += toXMLString(child, options, level + 1);
        });
        output += `${pad}${close}\n`;
        return output;
    }
}