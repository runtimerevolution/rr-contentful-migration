import {
    Document as RichTextDocument,
    BLOCKS,
    INLINES,
    MARKS,
    Text,
    type TopLevelBlock,
    type Block,
    Inline,
} from "@contentful/rich-text-types";
import * as cheerio from "cheerio";

type RichText = RichTextDocument;
type LocalizedContent = { "en-US": string | RichText };
type CheerioAPI = ReturnType<typeof cheerio.load>;

type Mark = { type: MARKS };

type CheerioElement = cheerio.AcceptedElems<any>;

export interface IBaseEntry {
    fields: Record<string, LocalizedContent>;
}

const localizeField = (key: any, field: any): LocalizedContent => {
    if (key !== "title") {
        if (typeof field === "string" && /<[^>]+>/g.test(field)) {
            return { "en-US": htmlToRichText(field) };
        }
        if (
            typeof field?.rendered === "string" &&
            /<[^>]+>/g.test(field.rendered)
        ) {
            return { "en-US": htmlToRichText(field.rendered) };
        }
    }
    return {
        "en-US":
            typeof field === "string" || typeof field === "number"
                ? String(field)
                : field?.rendered || field,
    };
};

const stripTags = (html: string): string => html.replace(/(\n|\t)/g, "");

const htmlToRichText = (html: string): RichText => {
    const cleanedHtml = stripTags(html);
    const $ = cheerio.load(cleanedHtml);

    const richTextDocument: RichText = {
        nodeType: BLOCKS.DOCUMENT,
        data: {},
        content: [],
    };

    $("body")
        .children()
        .each((_, element) => {
            const node = processElement($, element);
            if (node) richTextDocument.content.push(node);
        });

    if (richTextDocument.content.length === 0) {
        richTextDocument.content.push({
            nodeType: BLOCKS.PARAGRAPH,
            content: [],
            data: {},
        });
    }

    return richTextDocument;
};

const processElement = (
    $: CheerioAPI,
    element: CheerioElement
): TopLevelBlock | null => {
    const tagName = element.tagName.toLowerCase();

    switch (tagName) {
        case "p":
            return createParagraphNode($, element) as TopLevelBlock;
        case "h1":
            return createHeadingNode(
                $,
                element,
                BLOCKS.HEADING_1
            ) as TopLevelBlock;
        case "h2":
            return createHeadingNode(
                $,
                element,
                BLOCKS.HEADING_2
            ) as TopLevelBlock;
        case "h3":
            return createHeadingNode(
                $,
                element,
                BLOCKS.HEADING_3
            ) as TopLevelBlock;
        case "h4":
            return createHeadingNode(
                $,
                element,
                BLOCKS.HEADING_4
            ) as TopLevelBlock;
        case "h5":
            return createHeadingNode(
                $,
                element,
                BLOCKS.HEADING_5
            ) as TopLevelBlock;
        case "h6":
            return createHeadingNode(
                $,
                element,
                BLOCKS.HEADING_6
            ) as TopLevelBlock;
        case "ul":
            return createListNode($, element, BLOCKS.UL_LIST) as TopLevelBlock;
        case "ol":
            return createListNode($, element, BLOCKS.OL_LIST) as TopLevelBlock;
        case "li":
            return createListItemNode($, element) as TopLevelBlock;
        case "blockquote":
            return createBlockquoteNode($, element) as TopLevelBlock;
        case "hr":
            return {
                nodeType: BLOCKS.HR,
                data: {},
                content: [],
            } as TopLevelBlock;
        case "a":
            return createHyperlinkInBlockNode($, element) as TopLevelBlock;
        case "img":
            return createEmbeddedAssetNode($, element) as TopLevelBlock;
        default:
            return createParagraphNode($, element) as TopLevelBlock;
    }
};

const createParagraphNode = (
    $: CheerioAPI,
    element: CheerioElement
): Block => ({
    nodeType: BLOCKS.PARAGRAPH,
    data: {},
    content: processTextContent($, element),
});

const createHeadingNode = (
    $: CheerioAPI,
    element: CheerioElement,
    headingType: BLOCKS
): Block => ({
    nodeType: headingType,
    data: {},
    content: processTextContent($, element),
});

const createListNode = (
    $: CheerioAPI,
    element: CheerioElement,
    listType: BLOCKS
): Block => {
    const content: Block[] = [];
    $(element)
        .children("li")
        .each((_, listItem) => {
            const listItemNode = createListItemNode($, listItem);
            if (listItemNode) content.push(listItemNode);
        });
    return { nodeType: listType, data: {}, content };
};

const createListItemNode = ($: CheerioAPI, element: CheerioElement): Block => ({
    nodeType: BLOCKS.LIST_ITEM,
    data: {},
    content: [
        {
            nodeType: BLOCKS.PARAGRAPH,
            data: {},
            content: processTextContent($, element),
        },
    ],
});

const createBlockquoteNode = (
    $: CheerioAPI,
    element: CheerioElement
): Block => ({
    nodeType: BLOCKS.QUOTE,
    data: {},
    content: [
        {
            nodeType: BLOCKS.PARAGRAPH,
            data: {},
            content: processTextContent($, element),
        },
    ],
});

const createHyperlinkInBlockNode = (
    $: CheerioAPI,
    element: CheerioElement
): Block => ({
    nodeType: BLOCKS.PARAGRAPH,
    data: {},
    content: [createHyperlinkNode($, element)],
});

const createHyperlinkNode = (
    $: CheerioAPI,
    element: CheerioElement
): Inline => ({
    nodeType: INLINES.HYPERLINK,
    data: { uri: $(element).attr("href") || "" },
    content: processTextContent($, element),
});

const createEmbeddedAssetNode = (
    $: CheerioAPI,
    element: CheerioElement
): Block => ({
    nodeType: BLOCKS.EMBEDDED_ASSET,
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

const processTextContent = (
    $: CheerioAPI,
    element: CheerioElement
): (Text | Inline)[] => {
    const content: (Text | Inline)[] = [];
    $(element)
        .contents()
        .each((_, node) => {
            if (node.type === "text") {
                const text = $(node).text().trim();
                if (text) content.push(createTextNode(text, []));
            }
        });
    return content;
};

const createTextNode = (text: string, marks: Mark[]): Text => ({
    nodeType: "text",
    value: text,
    marks,
    data: {},
});

export const formatEntry = (content: Record<string, any>): IBaseEntry => ({
    fields: Object.fromEntries(
        Object.entries(content).map(([key, value]) => [
            key,
            localizeField(key, value),
        ])
    ),
});
