"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatEntry = void 0;
const rich_text_types_1 = require("@contentful/rich-text-types");
const cheerio = __importStar(require("cheerio"));
const localizeField = (key, field) => {
    if (key !== "title") {
        if (typeof field === "string" && /<[^>]+>/g.test(field)) {
            return { "en-US": htmlToRichText(field) };
        }
        if (typeof field?.rendered === "string" &&
            /<[^>]+>/g.test(field.rendered)) {
            return { "en-US": htmlToRichText(field.rendered) };
        }
    }
    return {
        "en-US": typeof field === "string" || typeof field === "number"
            ? String(field)
            : field?.rendered || field,
    };
};
const stripTags = (html) => html.replace(/(\n|\t)/g, "");
const htmlToRichText = (html) => {
    const cleanedHtml = stripTags(html);
    const $ = cheerio.load(cleanedHtml);
    const richTextDocument = {
        nodeType: rich_text_types_1.BLOCKS.DOCUMENT,
        data: {},
        content: [],
    };
    $("body")
        .children()
        .each((_, element) => {
        const node = processElement($, element);
        if (node)
            richTextDocument.content.push(node);
    });
    if (richTextDocument.content.length === 0) {
        richTextDocument.content.push({
            nodeType: rich_text_types_1.BLOCKS.PARAGRAPH,
            content: [],
            data: {},
        });
    }
    return richTextDocument;
};
const processElement = ($, element) => {
    const tagName = element.tagName.toLowerCase();
    switch (tagName) {
        case "p":
            return createParagraphNode($, element);
        case "h1":
            return createHeadingNode($, element, rich_text_types_1.BLOCKS.HEADING_1);
        case "h2":
            return createHeadingNode($, element, rich_text_types_1.BLOCKS.HEADING_2);
        case "h3":
            return createHeadingNode($, element, rich_text_types_1.BLOCKS.HEADING_3);
        case "h4":
            return createHeadingNode($, element, rich_text_types_1.BLOCKS.HEADING_4);
        case "h5":
            return createHeadingNode($, element, rich_text_types_1.BLOCKS.HEADING_5);
        case "h6":
            return createHeadingNode($, element, rich_text_types_1.BLOCKS.HEADING_6);
        case "ul":
            return createListNode($, element, rich_text_types_1.BLOCKS.UL_LIST);
        case "ol":
            return createListNode($, element, rich_text_types_1.BLOCKS.OL_LIST);
        case "li":
            return createListItemNode($, element);
        case "blockquote":
            return createBlockquoteNode($, element);
        case "hr":
            return {
                nodeType: rich_text_types_1.BLOCKS.HR,
                data: {},
                content: [],
            };
        case "a":
            return createHyperlinkInBlockNode($, element);
        case "img":
            return createEmbeddedAssetNode($, element);
        default:
            return createParagraphNode($, element);
    }
};
const createParagraphNode = ($, element) => ({
    nodeType: rich_text_types_1.BLOCKS.PARAGRAPH,
    data: {},
    content: processTextContent($, element),
});
const createHeadingNode = ($, element, headingType) => ({
    nodeType: headingType,
    data: {},
    content: processTextContent($, element),
});
const createListNode = ($, element, listType) => {
    const content = [];
    $(element)
        .children("li")
        .each((_, listItem) => {
        const listItemNode = createListItemNode($, listItem);
        if (listItemNode)
            content.push(listItemNode);
    });
    return { nodeType: listType, data: {}, content };
};
const createListItemNode = ($, element) => ({
    nodeType: rich_text_types_1.BLOCKS.LIST_ITEM,
    data: {},
    content: [
        {
            nodeType: rich_text_types_1.BLOCKS.PARAGRAPH,
            data: {},
            content: processTextContent($, element),
        },
    ],
});
const createBlockquoteNode = ($, element) => ({
    nodeType: rich_text_types_1.BLOCKS.QUOTE,
    data: {},
    content: [
        {
            nodeType: rich_text_types_1.BLOCKS.PARAGRAPH,
            data: {},
            content: processTextContent($, element),
        },
    ],
});
const createHyperlinkInBlockNode = ($, element) => ({
    nodeType: rich_text_types_1.BLOCKS.PARAGRAPH,
    data: {},
    content: [createHyperlinkNode($, element)],
});
const createHyperlinkNode = ($, element) => ({
    nodeType: rich_text_types_1.INLINES.HYPERLINK,
    data: { uri: $(element).attr("href") || "" },
    content: processTextContent($, element),
});
const createEmbeddedAssetNode = ($, element) => ({
    nodeType: rich_text_types_1.BLOCKS.EMBEDDED_ASSET,
    data: {
        target: {
            sys: {
                id: $(element).attr("src") || "",
                type: "Link",
                linkType: "Asset",
            },
        },
    },
    content: [],
});
const processTextContent = ($, element) => {
    const content = [];
    $(element)
        .contents()
        .each((_, node) => {
        if (node.type === "text") {
            const text = $(node).text().trim();
            if (text)
                content.push(createTextNode(text, []));
        }
    });
    return content;
};
const createTextNode = (text, marks) => ({
    nodeType: "text",
    value: text,
    marks,
    data: {},
});
const formatEntry = (content) => ({
    fields: Object.fromEntries(Object.entries(content).map(([key, value]) => [
        key,
        localizeField(key, value),
    ])),
});
exports.formatEntry = formatEntry;
