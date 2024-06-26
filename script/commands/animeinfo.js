const axios = require('axios');
const ANILIST_URL = 'https://graphql.anilist.co/'

module.exports = {
  config: {
    name: 'animeinfo',
    aliases: ["anime"],
    author: "David",
    description: {
      short: "Fetches details bout anime",
      long: this.short
    },
    usage: "{pn} <anime_name>",
    cooldown: 10,
    category: "anime"
  },

  start: async function({ api, event, args, cmd, message }) {
    if (!args[0]) return message.Syntax(cmd)
    try {
      api.sendChatAction(event.chat.id, 'upload_document');
      const query = `
        query ($title: String) {
          Media (search: $title, type: ANIME) {
            id
            title {
              romaji
              english
              native
            }
            description
            coverImage {
              medium
              large
            }
            genres
            format
            startDate {
              year
              month
              day
            }
            endDate {
              year
              month
              day
            }
            season
            seasonYear
            episodes
            status
            averageScore
            genres
            relations {
            edges {
              relationType(version: 2)
              node {
                id
                title {
                  romaji
                  english
                }
              }
            }
          }
          }
        }
      `;

      const variables = {
        title: args.join(' ')
      };

      const response = await axios.post(ANILIST_URL, { query, variables });
      const animeData = response.data.data.Media;

      if (!animeData) {
        return api.sendMessage(event.chat.id, `No anime found with the title: ${animeTitle}`);
      }

      const { romaji, english, native } = animeData.title;
      let title = '';
      if (english) {
        title += `\`${english}\`\n`;
      }
      if (romaji) {
        title += `• \`${romaji}\`\n`;
      }
      if (native) {
        title += `• \`${native}\`\n`;
      }
      const description = animeData.description.replace(/<[^>]+>/g, ' ').substring(0, 300) + "...";
      const genres = animeData.genres.join(', ');
      const format = animeData.format;
      const startDate = `${animeData.startDate.day}-${animeData.startDate.month}-${animeData.startDate.year}`;
      const endDate = animeData.endDate ? `${animeData.endDate.day}-${animeData.endDate.month}-${animeData.endDate.year}` : 'Still Airing';
      const season = animeData.season;
      const seasonYear = animeData.seasonYear;
      const episodes = animeData.episodes || 'N/A';
      const status = animeData.status;
      const averageScore = animeData.averageScore;
      const id = animeData.id;
      const coverImage = `https://img.anili.st/media/${id}`

      let relations = '';
      animeData.relations.edges.forEach(edge => {
        if (edge.relationType === 'PREQUEL' || edge.relationType === 'SEQUEL') {
          relations += `*${edge.relationType}:* \`${edge.node.title.english || edge.node.title.romamji}\n\``;
        }
      });

      const message = `❏ *Title:* ${title}
*➤ Type:* ${format}
*➤ Genres:* ${genres}
*➤ Start Date:* ${startDate}
*➤ End Date:* ${endDate}
*➤ Seaon:* ${season}, ${seasonYear}
*➤ Episodes:* ${episodes}
*➤ Status:* ${status}
*➤ Score:* ${averageScore}\n
${relations ? '*➤ Relations:*\n' + relations : ''}
*➤ Description:* ${description}
*➤ Link:* [View on AniList](https://anilist.co/anime/${id})`;
      await api.sendMessage(event.chat.id, message, {
        parse_mode: 'Markdown',
        disable_web_page_preview: false
      });
    } catch (error) {
      console.error(error);
      api.sendMessage(event.chat.id, 'An error occurred while fetching anime information.\nTry the romanji name or a proper name.');
    }
  }
}