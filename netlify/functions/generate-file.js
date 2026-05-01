const axios = require('axios');
const FormData = require('form-data');

exports.handler = async (event) => {
    const { type, content, channelID, token } = event.queryStringParameters || {};

    if (!type || !content || !channelID || !token) {
        return {
            statusCode: 400,
            body: "Missing parameters: type, content, channelID, or token."
        };
    }

    const filename = `file.${type}`;
    const buffer = Buffer.from(content, 'utf-8');

    // Create the "Multipart" form data Discord requires for files
    const form = new FormData();
    form.append('file', buffer, filename);
    form.append('payload_json', JSON.stringify({
        content: `Here is your generated **.${type}** file!`
    }));

    try {
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
            body: "File sent to Discord successfully!"
        };
    } catch (error) {
        console.error(error.response?.data || error);
        return {
            statusCode: 500,
            body: `Discord Error: ${JSON.stringify(error.response?.data || error.message)}`
        };
    }
};
