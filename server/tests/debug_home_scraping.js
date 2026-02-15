const axios = require('axios');

const SERVER = 'https://witanime.you/';

async function testHomePageScraping() {
    try {
        console.log('Fetching home page...');
        const { data: html } = await axios.get(SERVER, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        const cheerio = require('cheerio');
        const $ = cheerio.load(html);

        // Test hero slider
        console.log('\n=== HERO SLIDER ===');
        const sliderItems = $('.lucodeia-slider-slide-item');
        console.log(`Found ${sliderItems.length} slider items`);
        sliderItems.each((i, el) => {
            const title = $(el).attr('title');
            const url = $(el).attr('href');
            console.log(`  ${i + 1}. ${title} -> ${url}`);
        });

        // Test trending/most viewed
        console.log('\n=== TRENDING (Most Viewed) ===');
        const widgets = $('.main-widget');
        console.log(`Found ${widgets.length} main-widget elements`);

        const trendingWidget = widgets.eq(2);
        const trendingCards = trendingWidget.find('.anime-card-container');
        console.log(`Third widget has ${trendingCards.length} anime cards`);
        trendingCards.slice(0, 3).each((i, el) => {
            const link = $(el).find('.anime-card-title h3 > a');
            const img = $(el).find('.anime-card-poster img');
            console.log(`  ${i + 1}. ${link.text().trim()} - ${img.attr('src')}`);
        });

        // Test latest episodes
        console.log('\n=== LATEST EPISODES ===');
        const episodeCards = $('.episodes-card-container');
        console.log(`Found ${episodeCards.length} episode cards`);
        episodeCards.slice(0, 3).each((i, el) => {
            const epLink = $(el).find('.episodes-card-title h3 > a');
            const animeLink = $(el).find('.ep-card-anime-title h3 > a');
            console.log(`  ${i + 1}. ${animeLink.text().trim()} - ${epLink.text().trim()}`);
        });

    } catch (error) {
        console.error('Error:', error.message);
    }
}

testHomePageScraping();
