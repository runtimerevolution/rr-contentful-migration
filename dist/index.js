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
 * @returns Methods to create or update entries and assets.
 */
const initContentfulClient = async (spaceId, environmentId, accessToken) => {
    const client = (0, contentful_management_1.createClient)({ accessToken });
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
            try {
                entry = await entry.update();
                if (publish)
                    entry = await entry.publish();
            }
            catch (error) {
                console.error(`Error updating entry: ${error.message}`);
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
exports.initContentfulClient = initContentfulClient;
