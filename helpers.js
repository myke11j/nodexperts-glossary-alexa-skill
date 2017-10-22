'use strict';

const helpers = {};

helpers.buildSpeechletResponse = (title, output, repromptText, shouldEndSession) => {
    return {
        outputSpeech: {
            type: 'PlainText',
            text: output,
        },
        card: {
            type: 'Simple',
            title: `SessionSpeechlet - ${title}`,
            content: `SessionSpeechlet - ${output}`,
        },
        reprompt: {
            outputSpeech: {
                type: 'PlainText',
                text: repromptText,
            },
        },
        shouldEndSession,
    };
}

helpers.buildResponse = (sessionAttributes, speechletResponse) => {
    return {
        version: '1.0',
        sessionAttributes,
        response: speechletResponse,
    };
}

module.exports = helpers;