const axios = require('axios');

class MetadataFetcher {
    constructor() {
        this.baseUrl = 'https://api.jikan.moe/v4';
    }

    async fetchAnimeMetadata(title) {
        try {
            console.log(`Fetching metadata for: ${title}`);
            // Jikan search endpoint
            const response = await axios.get(`${this.baseUrl}/anime`, {
                params: {
                    q: title,
                    limit: 1
                }
            });

            if (response.data.data && response.data.data.length > 0) {
                const anime = response.data.data[0];
                return {
                    tmdb_id: anime.mal_id, // We use mal_id as tmdb_id for now or rename column
                    title: anime.title_english || anime.title,
                    overview: anime.synopsis,
                    poster_path: anime.images.jpg.large_image_url,
                    backdrop_path: anime.images.jpg.large_image_url, // Jikan doesn't provide backdrops easily
                    first_air_date: anime.aired.from,
                    status: anime.status,
                    score: anime.score
                };
            }
            return null;
        } catch (error) {
            console.error(`Metadata fetch failed for ${title}:`, error.message);
            return null;
        }
    }
}

module.exports = new MetadataFetcher();
