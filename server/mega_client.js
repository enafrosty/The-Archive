const { File } = require('megajs');

class MegaClient {
    constructor() {
        this.cache = new Map();
    }

    async getFile(megaUrl) {
        if (this.cache.has(megaUrl)) {
            return this.cache.get(megaUrl);
        }

        try {
            const file = File.fromURL(megaUrl);
            await file.loadAttributes();
            this.cache.set(megaUrl, file);
            return file;
        } catch (error) {
            console.error("Failed to load Mega file:", megaUrl, error);
            return null;
        }
    }

    async getFolderContents(folderUrl) {
        try {
            const folder = File.fromURL(folderUrl);
            await folder.loadAttributes();
            return folder.children || [];
        } catch (error) {
            console.error("Failed to load Mega folder:", folderUrl, error);
            return [];
        }
    }

    async getFileFromFolder(folderUrl, relativePath) {
        try {
            const folder = File.fromURL(folderUrl);
            await folder.loadAttributes();

            const parts = relativePath.split('/');
            let current = folder;

            for (const part of parts) {
                if (!current.children) return null;
                const found = current.children.find(c => c.name === part);
                if (!found) return null;
                current = found;
            }

            return current;
        } catch (error) {
            console.error("Failed to traverse Mega folder:", error);
            return null;
        }
    }

    async getStream(fileOrUrl, options = {}) {
        let file;
        if (typeof fileOrUrl === 'string') {
            file = await this.getFile(fileOrUrl);
        } else {
            file = fileOrUrl;
        }

        if (!file) throw new Error("File not found");
        return file.download(options);
    }
}

module.exports = new MegaClient();
