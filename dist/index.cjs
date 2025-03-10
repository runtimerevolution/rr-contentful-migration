import { createClient } from "contentful-management";
import { formatEntry } from "./helpers/formatters";
/**
 * Initializes a Contentful client.
 * @param spaceId - The Space ID.
 * @param environmentId - The Environment ID.
 * @param accessToken - The access token for authentication.
 * @returns Methods to create or update entries and assets.
 */
const initContentfulClient = async (spaceId, environmentId, accessToken) => {
    const client = createClient({ accessToken });
    const space = await client.getSpace(spaceId);
    const environment = await space.getEnvironment(environmentId);
    /**
     * Creates or updates a Contentful entry.
     * - If `entryId` is provided, the existing entry is updated.
     * - If `entryId` is not provided, a new entry is created.
     * @param contentType - The content type for the entry.
     * @param fields - The fields of the entry.
     * @param entryId - Optional ID for updating an existing entry.
     * @param publish - Flag to indicate whether the entry should be published (default is true).
     * @returns The created or updated entry.
     */
    const createOrUpdateEntry = async (contentType, fields, entryId, publish = true) => {
        const formattedFields = formatEntry(fields);
        let entry;
        if (entryId) {
            entry = await environment.getEntry(entryId);
            Object.keys(formattedFields.fields).forEach((key) => {
                entry.fields[key] = formattedFields.fields[key];
            });
            entry = await entry.update();
        }
        else {
            entry = await environment.createEntry(contentType, {
                fields: formattedFields.fields,
            });
        }
        if (publish) {
            await entry.publish();
        }
        return entry;
    };
    /**
     * Creates or updates a Contentful asset from a URL.
     * - If `assetId` is provided, the existing asset is updated.
     * - If `assetId` is not provided, a new asset is created.
     * @param url - The URL of the asset.
     * @param contentType - The MIME type of the asset.
     * @param assetId - Optional ID for updating an existing asset.
     * @param publish - Flag to indicate whether the asset should be published (default is true).
     * @returns The created or updated asset.
     */
    const createOrUpdateAsset = async (url, contentType, assetId, publish = true) => {
        const fileName = url.split("/").pop() || "default_filename";
        const assetFields = {
            title: { "en-US": fileName },
            description: { "en-US": "Description of the asset" },
            file: {
                "en-US": {
                    file: { url },
                    contentType,
                    fileName,
                },
            },
        };
        let asset;
        if (assetId) {
            asset = await environment.getAsset(assetId);
            asset.fields = assetFields;
            asset = await asset.update();
        }
        else {
            asset = await environment.createAsset({ fields: assetFields });
        }
        if (publish) {
            await asset.publish();
        }
        return asset;
    };
    return {
        createOrUpdateEntry,
        createOrUpdateAsset,
    };
};
export { initContentfulClient, formatEntry };
