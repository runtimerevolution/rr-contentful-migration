import { createClient, Entry, Asset } from "contentful-management";
import { formatEntry } from "./helpers/formatters";

/**
 * A client for interacting with Contentful's Content Management API.
 * Provides methods for CRUD operations on entries and assets.
 */
export interface ContentfulClient {
    /**
     * Creates a new entry or updates an existing one based on a unique field value.
     * Only updates fields that have changed, preserving existing values.
     * @param contentType - The content type identifier for the entry
     * @param fields - The fields to set on the entry (must include locale, e.g., { "en-US": value })
     * @param uniqueField - The field name to use for finding existing entries
     * @param uniqueValue - The value to match against the uniqueField
     * @param publish - Whether to publish the entry after creation/update (defaults to true)
     */
    createOrUpdateEntry: (
        contentType: string,
        fields: Record<string, any>,
        uniqueField: string,
        uniqueValue: string,
        publish?: boolean
    ) => Promise<Entry>;

    /**
     * Retrieves an entry by its ID.
     * @param entryId - The ID of the entry to retrieve
     */
    getEntry: (entryId: string) => Promise<Entry>;

    /**
     * Deletes an entry by its ID.
     * Automatically unpublishes the entry before deletion if needed.
     * @param entryId - The ID of the entry to delete
     */
    deleteEntry: (entryId: string) => Promise<void>;

    /**
     * Retrieves an entry by its content type and slug.
     * @param contentType - The content type identifier
     * @param slug - The slug value to search for
     */
    getEntryBySlug: (
        contentType: string,
        slug: string
    ) => Promise<Entry | null>;
    /**
     * Retrieves all entries of a specific content type.
     * @param contentType - The content type identifier
     */
    getAllEntries: (contentType: string) => Promise<Entry[] | undefined>;

    /**
     * Retrieves an asset by its ID.
     * @param assetId - The ID of the asset to retrieve
     */
    getAsset: (assetId: string) => Promise<Asset>;

    /**
     * Deletes an asset by its ID.
     * Automatically unpublishes the asset before deletion if needed.
     * @param assetId - The ID of the asset to delete
     */
    deleteAsset: (assetId: string) => Promise<void>;
}

/**
 * Initializes a Contentful client.
 * @param spaceId - The Space ID.
 * @param environmentId - The Environment ID.
 * @param accessToken - The access token for authentication.
 * @returns Methods for CRUD operations on entries and assets.
 */
const initContentfulClient = async (
    spaceId: string,
    environmentId: string,
    accessToken: string
): Promise<ContentfulClient> => {
    const client = createClient({ accessToken });
    const space = await client.getSpace(spaceId);
    const environment = await space.getEnvironment(environmentId);

    /**
     * Creates or updates a Contentful entry.
     * @param contentType - The content type for the entry.
     * @param fields - The fields of the entry.
     * @param uniqueField - The field used to identify uniqueness.
     * @param uniqueValue - The unique value for the unique field.
     * @param publish - Whether to publish the entry (default is true).
     * @returns The created or updated entry.
     */
    const createOrUpdateEntry = async (
        contentType: string,
        fields: Record<string, any>,
        uniqueField: string,
        uniqueValue: string,
        publish = true
    ): Promise<Entry> => {
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
            const existingFields = entry.fields;
            let hasChanges = false;

            Object.keys(filteredFields).forEach((key) => {
                const newValue = filteredFields[key];
                const existingValue = existingFields[key]?.["en-US"];

                if (
                    JSON.stringify(newValue["en-US"]) !==
                    JSON.stringify(existingValue)
                ) {
                    hasChanges = true;
                    existingFields[key] = newValue;
                }
            });

            if (hasChanges) {
                try {
                    entry.fields = existingFields;
                    entry = await entry.update();
                    if (publish) entry = await entry.publish();
                } catch (error: unknown) {
                    console.error(
                        `Error updating entry: ${(error as Error).message}`
                    );
                }
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
     * Retrieves a Contentful entry by ID.
     * @param entryId - The ID of the entry.
     * @returns The retrieved entry.
     */
    const getEntry = async (entryId: string): Promise<Entry> => {
        return await environment.getEntry(entryId);
    };

    /**
     * Deletes a Contentful entry by ID.
     * @param entryId - The ID of the entry to delete.
     */
    const deleteEntry = async (entryId: string): Promise<void> => {
        const entry = await environment.getEntry(entryId);
        await entry.unpublish().catch(() => {});
        await entry.delete();
    };

    /**
     * Retrieves a Contentful asset by ID.
     * @param assetId - The ID of the asset.
     * @returns The retrieved asset.
     */
    const getAsset = async (assetId: string): Promise<Asset> => {
        return await environment.getAsset(assetId);
    };

    /**
     * Deletes a Contentful asset by ID.
     * @param assetId - The ID of the asset to delete.
     */
    const deleteAsset = async (assetId: string): Promise<void> => {
        const asset = await environment.getAsset(assetId);
        await asset.unpublish().catch(() => {});
        await asset.delete();
    };

    const getEntryBySlug = async (
        contentType: string,
        slug: string
    ): Promise<Entry | null> => {
        const entries = await environment.getEntries({
            content_type: contentType,
            "fields.slug.en-US": slug,
            limit: 1,
        });

        return entries.items.length > 0 ? entries.items[0] : null;
    };

    const getAllEntries = async (
        contentType: string
    ): Promise<Entry[] | undefined> => {
        const entries = await environment.getEntries({
            content_type: contentType,
        });

        return entries.items;
    };

    return {
        createOrUpdateEntry,
        getEntry,
        deleteEntry,
        getEntryBySlug,
        getAsset,
        deleteAsset,
        getAllEntries,
    };
};

const exports = {
    initContentfulClient,
    formatEntry,
};

export = exports;
