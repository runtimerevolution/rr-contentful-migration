"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dataFetcher = void 0;
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const dataFetcher = async (url, retries = 5, timeout = 10000) => {
    let attempt = 0;
    const controller = new AbortController();
    const signal = controller.signal;
    const fetchWithTimeout = async (url, signal) => {
        const fetchPromise = fetch(url, { signal });
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Request timed out")), timeout));
        return Promise.race([fetchPromise, timeoutPromise]);
    };
    while (attempt < retries) {
        try {
            const response = await fetchWithTimeout(url, signal);
            const text = await response.text();
            if (!response.ok) {
                if (response.status === 503) {
                    const backoffTime = Math.pow(2, attempt) * 1000;
                    console.log(`Service unavailable. Retrying in ${backoffTime / 1000} seconds...`);
                    await delay(backoffTime);
                    attempt++;
                    continue;
                }
                else {
                    throw new Error(`Failed to fetch from ${url}, Status: ${response.status}`);
                }
            }
            try {
                return JSON.parse(text);
            }
            catch (parseError) {
                if (parseError instanceof Error) {
                    throw new Error(`Failed to parse JSON from response: ${parseError.message}`);
                }
                else {
                    throw new Error("Unknown error while parsing JSON.");
                }
            }
        }
        catch (error) {
            if (error instanceof Error) {
                if (error.name === "AbortError") {
                    console.error(`Request aborted for ${url}`);
                }
                else if (error.message === "Request timed out") {
                    console.error(`Request timed out for ${url}`);
                }
                else {
                    console.error(`Error fetching data from ${url}:`, error);
                }
                if (attempt === retries - 1) {
                    throw new Error(`Max retries reached for ${url}. Last error: ${error.message}`);
                }
            }
            else {
                console.error(`Unexpected error fetching data from ${url}:`, error);
                throw new Error("Unexpected error occurred during fetch.");
            }
            attempt++;
        }
    }
};
exports.dataFetcher = dataFetcher;
