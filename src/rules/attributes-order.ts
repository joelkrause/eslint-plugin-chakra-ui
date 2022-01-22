import { AST_NODE_TYPES, TSESLint } from "@typescript-eslint/experimental-utils";
import { isChakraElement } from "../lib/isChakraElement";
import { getPriorityIndex } from "../lib/getPriorityIndex";

export const attributesOrder: TSESLint.RuleModule<"invalidOrder", []> = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Check JSXText's unnecessary `$` character.",
      recommended: "error",
      url: "",
    },
    messages: {
      invalidOrder: "Invalid Chakra attributes order.",
    },
    schema: [],
    fixable: "code",
  },

  create: ({ parserServices, report, getSourceCode }) => {
    if (!parserServices) {
      return {};
    }

    return {
      JSXElement(node) {
        if (!isChakraElement(node, parserServices)) {
          return;
        }

        const sorted = [...node.openingElement.attributes].sort((a, b) => {
          const aPriority =
            a.type === AST_NODE_TYPES.JSXSpreadAttribute
              ? Number.MAX_SAFE_INTEGER
              : getPriorityIndex(a.name.name.toString());
          const bPriority =
            b.type === AST_NODE_TYPES.JSXSpreadAttribute
              ? Number.MAX_SAFE_INTEGER
              : getPriorityIndex(b.name.name.toString());

          return aPriority - bPriority;
        });

        for (const [index, attribute] of node.openingElement.attributes.entries()) {
          if (attribute.type !== AST_NODE_TYPES.JSXAttribute) {
            return;
          }

          const sortedAttribute = sorted[index];
          if (
            sortedAttribute.type !== AST_NODE_TYPES.JSXAttribute ||
            sortedAttribute.name.name !== attribute.name.name
          ) {
            if (!attribute.parent) {
              return;
            }
            report({
              node: attribute.parent,
              messageId: "invalidOrder",
              fix(fixer) {
                const sourceCode = getSourceCode();
                const start = node.openingElement.attributes[0].range[0];
                const end = node.openingElement.attributes[node.openingElement.attributes.length - 1].range[1];
                const attributesText = sorted.map((attribute) => sourceCode.getText(attribute)).join(" ");

                return fixer.replaceTextRange([start, end], attributesText);
              },
            });
            break;
          }
        }
      },
    };
  },
};
