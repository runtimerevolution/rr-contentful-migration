import { Entry, Asset } from "contentful-management";

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
     * @returns The created or updated entry
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
     * @returns The requested entry
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
     * @returns The matching entry or null if not found
     */
    getEntryBySlug: (
        contentType: string,
        slug: string
    ) => Promise<Entry | null>;

    /**
     * Retrieves all entries of a specific content type.
     * @param contentType - The content type identifier
     * @returns Array of entries or undefined if none found
     */
    getAllEntries: (contentType: string) => Promise<Entry[] | undefined>;

    /**
     * Retrieves an asset by its ID.
     * @param assetId - The ID of the asset to retrieve
     * @returns The requested asset
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
 * Initializes a Contentful client with the given credentials.
 * @param spaceId - The Space ID from Contentful
 * @param environmentId - The Environment ID (e.g., 'master')
 * @param accessToken - The Content Management API access token
 * @returns A client instance with methods for managing Contentful content
 */
export function initContentfulClient(
    spaceId: string,
    environmentId: string,
    accessToken: string
): Promise<ContentfulClient>;

/**
 * Helper function to format entry data.
 * @param entry - The entry to format
 * @returns Formatted entry data
 */
export function formatEntry(entry: Entry): any;
