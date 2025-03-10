import { createClient, Entry, Asset } from "contentful-management";
import { formatEntry } from "./helpers/formatters";

/**
 * Initializes a Contentful client.
 * @param spaceId - The Space ID.
 * @param environmentId - The Environment ID.
 * @param accessToken - The access token for authentication.
 * @returns Methods to create or update entries and assets.
 */
const initContentfulClient = async (
    spaceId: string,
    environmentId: string,
    accessToken: string
) => {
    const client = createClient({ accessToken });
    const space = await client.getSpace(spaceId);
    const environment = await space.getEnvironment(environmentId);

    /**
     * Creates or updates a Contentful entry.
     * - If `entryId` is provided, the existing entry is updated.
     * - If `entryId` is not provided, a new entry is created.
     * @param contentType - The content type for the entry.
     * @param fields - The fields of the entry.
     * @param uniqueField - The field used to identify uniqueness.
     * @param uniqueValue - The unique value for the unique field.
     * @param publish - Flag to indicate whether the entry should be published (default is true).
     * @returns The created or updated entry.
     */
    const createOrUpdateEntry = async (
        contentType: string,
        fields: Record<string, any>,
        uniqueField: string,
        uniqueValue: string,
        publish = true
    ): Promise<Record<string, any>> => {
        const contentTypeData = await environment.getContentType(contentType);
        const allowedFields = new Set(
            contentTypeData.fields.map((f: any) => f.id)
        );

        const filteredFields = Object.keys(fields).reduce((acc, key) => {
            if (allowedFields.has(key)) {
                acc[key] = fields[key];
            }
            return acc;
        }, {} as Record<string, any>);

        const entries = await environment.getEntries({
            content_type: contentType,
            [`fields.${uniqueField}.en-US`]: uniqueValue,
            limit: 1,
        });

        let entry: Entry;

        if (entries.items.length > 0) {
            entry = entries.items[0];

            try {
                entry = await entry.update();
                if (publish) entry = await entry.publish();
            } catch (error: unknown) {
                console.error(
                    `Error updating entry: ${(error as Error).message}`
                );
            }
        } else {
            try {
                entry = await environment.createEntry(contentType, {
                    fields: filteredFields,
                });
                if (publish) entry = await entry.publish();
            } catch (error: unknown) {
                console.error(
                    `Error creating entry: ${(error as Error).message}`
                );
                throw error;
            }
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
    const createOrUpdateAsset = async (
        url: string,
        contentType: string,
        assetId?: string,
        publish = true
    ): Promise<Asset> => {
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

        let asset: Asset;
        if (assetId) {
            asset = await environment.getAsset(assetId);
            asset.fields = assetFields;
            asset = await asset.update();
        } else {
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
