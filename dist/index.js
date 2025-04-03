"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatEntry = exports.initContentfulClient = void 0;
const contentful_management_1 = require("contentful-management");
const formatters_1 = require("./helpers/formatters");
Object.defineProperty(exports, "formatEntry", { enumerable: true, get: function () { return formatters_1.formatEntry; } });
/**
 * Initializes a Contentful client.
 * @param spaceId - The Space ID.
 * @param environmentId - The Environment ID.
 * @param accessToken - The access token for authentication.
 * @returns Methods for CRUD operations on entries and assets.
 */
const initContentfulClient = async (spaceId, environmentId, accessToken) => {
    const client = (0, contentful_management_1.createClient)({ accessToken });
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
    const createOrUpdateEntry = async (contentType, fields, uniqueField, uniqueValue, publish = true) => {
        const contentTypeData = await environment.getContentType(contentType);
        const allowedFields = new Set(contentTypeData.fields.map((f) => f.id));
        const filteredFields = Object.keys(fields).reduce((acc, key) => {
            if (allowedFields.has(key)) {
                acc[key] = fields[key];
            }
            return acc;
        }, {});
        const entries = await environment.getEntries({
            content_type: contentType,
            [`fields.${uniqueField}.en-US`]: uniqueValue,
            limit: 1,
        });
        let entry;
        if (entries.items.length > 0) {
            entry = entries.items[0];
            const existingFields = entry.fields;
            let hasChanges = false;
            Object.keys(filteredFields).forEach((key) => {
                const newValue = filteredFields[key];
                const existingValue = existingFields[key]?.["en-US"];
                if (JSON.stringify(newValue["en-US"]) !==
                    JSON.stringify(existingValue)) {
                    hasChanges = true;
                    existingFields[key] = newValue;
                }
            });
            if (hasChanges) {
                try {
                    entry.fields = existingFields;
                    entry = await entry.update();
                    if (publish)
                        entry = await entry.publish();
                }
                catch (error) {
                    console.error(`Error updating entry: ${error.message}`);
                }
            }
        }
        else {
            try {
                entry = await environment.createEntry(contentType, {
                    fields: filteredFields,
                });
                if (publish)
                    entry = await entry.publish();
            }
            catch (error) {
                console.error(`Error creating entry: ${error.message}`);
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
    const getEntry = async (entryId) => {
        return await environment.getEntry(entryId);
    };
    /**
     * Deletes a Contentful entry by ID.
     * @param entryId - The ID of the entry to delete.
     */
    const deleteEntry = async (entryId) => {
        const entry = await environment.getEntry(entryId);
        await entry.unpublish().catch(() => { });
        await entry.delete();
    };
    /**
     * Retrieves a Contentful asset by ID.
     * @param assetId - The ID of the asset.
     * @returns The retrieved asset.
     */
    const getAsset = async (assetId) => {
        return await environment.getAsset(assetId);
    };
    /**
     * Deletes a Contentful asset by ID.
     * @param assetId - The ID of the asset to delete.
     */
    const deleteAsset = async (assetId) => {
        const asset = await environment.getAsset(assetId);
        await asset.unpublish().catch(() => { });
        await asset.delete();
    };
    const getEntryBySlug = async (contentType, slug) => {
        const entries = await environment.getEntries({
            content_type: contentType,
            "fields.slug.en-US": slug,
            limit: 1,
        });
        return entries.items.length > 0 ? entries.items[0] : null;
    };
    const getAllEntries = async (contentType) => {
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
exports.initContentfulClient = initContentfulClient;
//# sourceMappingURL=index.js.map