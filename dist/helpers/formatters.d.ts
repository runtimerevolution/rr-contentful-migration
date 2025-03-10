import { Document as RichTextDocument } from "@contentful/rich-text-types";
type RichText = RichTextDocument;
type LocalizedContent = {
    "en-US": string | RichText;
};
export interface IBaseEntry {
    fields: Record<string, LocalizedContent>;
}
export declare const formatEntry: (content: Record<string, any>) => IBaseEntry;
export {};
