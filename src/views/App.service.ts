import {EditorConfiguration} from 'codemirror';
import {Node, parse, stringify} from 'scss-parser';

export const STYLE_USAGE_REGEX: RegExp = /styles((\.([_a-zA-Z0-9]+))|(\['([_\-a-zA-Z0-9]+)'\]))/gm;

export const MIXIN_USAGE_REGEX: RegExp = /@include ([A-z0-9-]+)/gm;

export interface AppService {
  getCodeMirrorOption(mode: string): EditorConfiguration;

  clean(scss: string, usedClasses: Record<string, string>): string;

  getNumLineOfCodeRemoved(oldScss: string, newScss: string): number;
  
  formatRuleSpacing(scss: string): string;

  getMixinDeclarations(scss: string, keyword?: string, type?: string): Record<string, string>;

  removeUnusedMixins(scss: string): string;

  getUsedClasses(tsx: string): Record<string, string>;

  flatten(rootNode: Node): Node[];
}

export const appService: AppService = {
  getCodeMirrorOption(mode: string): EditorConfiguration {
    return {
      mode,
      theme: 'monokai',
      lineNumbers: true,
      viewportMargin: Infinity,
      inputStyle: 'contenteditable',
    };
  },

  clean(scss: string, usedClasses: Record<string, string>): string {
    const ast = parse(scss);
    const newNodes: Node[] = (ast.value as Node[])
      .filter((node) => {
        if (node.type !== 'space') {
          if (node.type === 'rule') {
            const selectorNode: Node = (node.value[0] as Node);
            if (selectorNode.type === 'selector') {
              const classNode: Node = selectorNode.value[0] as Node;
              if (classNode.type === 'class') {
                const identifierNode: Node = classNode.value[0] as Node;
                if (identifierNode.type === 'identifier') {
                  if (!usedClasses.hasOwnProperty(identifierNode.value as string)) {
                    return false;
                  }
                }
              }
            }
          }
          return true;
        }
        return true;
      });

    const newScss: string =
      stringify({
        ...ast,
        value: newNodes,
      })
        .trim();
    return this.formatRuleSpacing(newScss);
  },

  getNumLineOfCodeRemoved(oldScss: string, newScss: string): number {
    const oldLength: number = oldScss.split("\n").length;
    const newLength: number = newScss.split("\n").length;
    return oldLength - newLength;
  },

  formatRuleSpacing(scss: string): string {
    return scss.split(/\n{2,}/).join("\n\n") + "\n";
  },

  getUsedClasses(tsx: string): Record<string, string> {
    const map: Record<string, string> = {};
    const matches: IterableIterator<RegExpMatchArray> = tsx.matchAll(STYLE_USAGE_REGEX);
    if (matches) {
      let result: IteratorResult<RegExpMatchArray> = matches.next();
      while (!result.done) {
        const matchArray: RegExpMatchArray = result.value;
        const className: string = typeof matchArray[3] === 'undefined' ? matchArray[5] : matchArray[3];
        map[className] = className;
        result = matches.next();
      }
    }
    return map;
  },

  getMixinDeclarations(scss: string, keyword: string = 'mixin', type: string = 'identifier'): Record<string, string> {
    const map: Record<string, string> = {};
    const rootNode: Node = parse(scss);
    (rootNode.value as Node[]).forEach((node) => {
      if (typeof node === 'object') {
        if (node.type === 'atrule') {
          const keywordNode: Node = node.value[0] as Node;
          const identifierNode: Node = node.value[2] as Node;
          if (
            typeof identifierNode === 'object' &&
            identifierNode?.type === type &&
            typeof keywordNode === 'object' &&
            keywordNode.value === keyword &&
            typeof identifierNode.value === 'string'
          ) {
            map[identifierNode.value] = identifierNode.value;
          }
        }
      }
    });
    return map;
  },

  flatten(rootNode: Node): Node[] {
    const nodes: Node[] = [];
    nodes.push(rootNode);
    if (rootNode?.value instanceof Array) {
      rootNode.value.forEach((subNode) => {
        nodes.push(...this.flatten(subNode));
      });
    }
    return nodes;
  },

  removeUnusedMixins(scss: string): string {
    const rootNode: Node = parse(scss);
    const mixins: Record<string, string> = this.getMixinDeclarations(scss);

    const matches: IterableIterator<RegExpMatchArray> = scss.matchAll(MIXIN_USAGE_REGEX);
    let result: IteratorResult<RegExpMatchArray> = matches?.next();
    while (!result?.done) {
      if (mixins.hasOwnProperty(result.value[1])) {
        delete mixins[result.value[1]];
      }
      result = matches.next();
    }

    rootNode.value = (rootNode.value as Node[])
      .filter((node) => {
        if (typeof node === 'object') {
          if (node.type === 'atrule') {
            const keywordNode: Node = node.value[0] as Node;
            const identifierNode: Node = node.value[2] as Node;
            if (
              typeof identifierNode === 'object' &&
              identifierNode?.type === 'identifier' &&
              typeof keywordNode === 'object' &&
              keywordNode.value === 'mixin' &&
              typeof identifierNode.value === 'string'
            ) {
              const nodeName: string = identifierNode.value;
              return !mixins.hasOwnProperty(nodeName);
            }
          }
        }
        return true;
      });
    return this.formatRuleSpacing(stringify(rootNode));
  }
};
