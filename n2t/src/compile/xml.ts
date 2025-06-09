import { XMLNode } from "./object";

interface ToXMLOptions {
    spaces?: number;
    includeProps?: boolean;
}

const DEFAULT_SPACES = 4;

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
        return `${pad}${open} ${node.children.trim()} ${close}\n`;
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