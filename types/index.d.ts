import { Entry, Asset } from "contentful-management";

export type ContentfulEntryFields = Record<string, any>;

export type FormattedEntry = {
    fields: ContentfulEntryFields;
};

export type CreateOrUpdateEntry = (
    contentType: string,
    fields: ContentfulEntryFields,
    entryId?: string,
    publish?: boolean
) => Promise<Entry>;

export type CreateOrUpdateAsset = (
    url: string,
    contentType: string,
    assetId?: string,
    publish?: boolean
) => Promise<Asset>;
