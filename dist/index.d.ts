import { Asset } from "contentful-management";
import { formatEntry } from "./helpers/formatters";
/**
 * Initializes a Contentful client.
 * @param spaceId - The Space ID.
 * @param environmentId - The Environment ID.
 * @param accessToken - The access token for authentication.
 * @returns Methods to create or update entries and assets.
 */
declare const initContentfulClient: (spaceId: string, environmentId: string, accessToken: string) => Promise<{
    createOrUpdateEntry: (contentType: string, fields: Record<string, any>, uniqueField: string, uniqueValue: string, publish?: boolean) => Promise<Record<string, any>>;
    createOrUpdateAsset: (url: string, contentType: string, assetId?: string, publish?: boolean) => Promise<Asset>;
}>;
export { initContentfulClient, formatEntry };
