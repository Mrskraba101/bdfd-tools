const axios = require('axios');
const FormData = require('form-data');

exports.handler = async (event) => {
    const params = event.queryStringParameters || {};
    
    // Decoding content here helps BDFD data pass through correctly
    const type = params.type;
    const channelID = params.channelID;
    const token = params.token;
    const content = params.content ? decodeURIComponent(params.content) : null;

    if (!type || !content || !channelID || !token) {
        return {
            statusCode: 400,
            body: "Missing parameters: type, content, channelID, or token."
        };
    }

    try {
        const filename = `file.${type.toLowerCase()}`;
        const buffer = Buffer.from(content, 'utf-8');

        const form = new FormData();
        // Append ONLY the file
        form.append('file', buffer, filename);

        await axios.post(
            `https://discord.com/api/v10/channels/${channelID}/messages`,
            form,
            {
                headers: {
                    ...form.getHeaders(),
                    Authorization: `Bot ${token}`,
                },
            }
        );

        return {
            statusCode: 200,
            body: ""
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: `Discord Error: ${JSON.stringify(error.response?.data || error.message)}`
        };
    }
};
