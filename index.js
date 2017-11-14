'use strict';

const AWS = require('aws-sdk');

const helpers = require('./helpers');
const messages = require('./messages');
const alexaLogger = require('./logger');
const dynamodb = new AWS.DynamoDB();

// --------------- Functions that control the skill's behavior -----------------------

function getWelcomeResponse(callback) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    const sessionAttributes = {};
    const cardTitle = messages.titleMessage;
    const speechOutput = messages.greetingMessage;
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    const repromptText = messages.repromptMessage;
    const shouldEndSession = false;

    callback(sessionAttributes,
        helpers.buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function startOver(callback) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    const sessionAttributes = {};
    const cardTitle = messages.titleMessage;
    const speechOutput = messages.greetingMessage;
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    const repromptText = messages.continueMessage;
    const shouldEndSession = false;

    callback(sessionAttributes,
        helpers.buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function handleSessionEndRequest(callback) {
    const cardTitle = 'Exit NodeXperts Javascript Glossary';
    const speechOutput = messages.goodByeMessgae;
    // Setting this to true ends the session and exits the skill.
    const shouldEndSession = true;

    callback({}, helpers.buildSpeechletResponse(cardTitle, speechOutput, null, shouldEndSession));
}

function handleSessionHelpRequest(callback) {
    const cardTitle = 'Exit NodeXperts Javascript Glossary';
    const speechOutput = messages.helpMessage;
    // Setting this to true ends the session and exits the skill.
    const shouldEndSession = false;

    callback({}, helpers.buildSpeechletResponse(cardTitle, speechOutput, null, shouldEndSession));
}

function handleInvalidIntentRequest(callback) {
    const cardTitle = 'Unexpected error occured';
    const speechOutput = messages.invalidIntent;
    // Setting this to true ends the session and exits the skill.
    const shouldEndSession = true;

    callback({}, helpers.buildSpeechletResponse(cardTitle, speechOutput, null, shouldEndSession));
}

function getQueryBySlot(slotVal) {
    const params = {
        TableName: process.env.AWS_DYNAMODB_TABLE_NAME,
        Key: {
            "glossary_id": {
                S: slotVal
            }
        }
    };
    return params;
}

/**
 * Gets the information via slot value 'Term'
 */
function getDataViaSlotVal(request, session, callback) {
    const intent = request.intent;
    const slot = intent.slots['Term'];
    const cardTitle = `Javascript Glossary - ${slot.value}`;
    alexaLogger.logInfo(`Term ${slot.value} requested`);
    const query = getQueryBySlot(slot.value);
    let sessionAttributes = {};
    const shouldEndSession = true;
    dynamodb.getItem(query, (err, data) => {
        let speechOutput;
        if (err) {
            alexaLogger.logError(`Error in getting data from dynamodb: ${err}`);
            speechOutput = 'We\'re sorry, there was some issue in getting response. Please try again.'
        } else if (data.Item && data.Item.answer['S']) {
            speechOutput = data.Item.answer['S'];
            alexaLogger.logInfo(`Recieved data from table for sessionId=${session.sessionId}: ${speechOutput}`);
        } else {
            speechOutput = `${messages.noDataFound} for ${slot.value}`;
        }
        callback(sessionAttributes,
            helpers.buildSpeechletResponse(cardTitle, speechOutput, null, shouldEndSession));
    });
}


// --------------- Events -----------------------

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    alexaLogger.logInfo(`onSessionStarted requestId=${sessionStartedRequest.requestId}, sessionId=${session.sessionId}`);
}

/**
 * Called when the user launches the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    alexaLogger.logInfo(`onLaunch requestId=${launchRequest.requestId}, sessionId=${session.sessionId}`);
    // Dispatch to your skill's launch.
    getWelcomeResponse(callback);
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    alexaLogger.logInfo(`onSessionEnded requestId=${sessionEndedRequest.requestId}, sessionId=${session.sessionId}`);
    handleSessionEndRequest(callback);
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(request, session, callback) {
    alexaLogger.logInfo(`onIntent requestId=${request.requestId}, sessionId=${session.sessionId}`);
    const intent = request.intent;
    alexaLogger.logInfo(`intent recieved ${intent.name}`);
    switch (intent.name) {
        case 'AMAZON.HelpIntent':
            handleSessionHelpRequest(callback);
            break;
        case 'AMAZON.CancelIntent':
            handleSessionEndRequest(callback);
            break;
        case 'AMAZON.StopIntent':
            handleSessionEndRequest(callback);
            break;
        case 'AMAZON.NoIntent':
            handleSessionEndRequest(callback);
            break;
        case 'AMAZON.YesIntent':
            startOver(callback);
            break;
        case 'SearchGlossary':
            getDataViaSlotVal(request, session, callback)
            break;
        default:
            handleInvalidIntentRequest(callback);
            break;
    }
}

// --------------- Main handler -----------------------

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = (event, context, callback) => {
    try {
        context.callbackWaitsForEmptyEventLoop = false;
        alexaLogger
            .init()
            .then(() => {
                alexaLogger.logInfo(`event.session.application.applicationId=${event.session.application.applicationId}`);
                if (event.session.new) {
                    onSessionStarted({ requestId: event.request.requestId }, event.session);
                }

                if (event.request.type === 'LaunchRequest') {
                    onLaunch(event.request,
                        event.session,
                        (sessionAttributes, speechletResponse) => {
                            callback(null, helpers.buildResponse(sessionAttributes, speechletResponse));
                        });
                } else if (event.request.type === 'IntentRequest') {
                    onIntent(event.request,
                        event.session,
                        (sessionAttributes, speechletResponse) => {
                            callback(null, helpers.buildResponse(sessionAttributes, speechletResponse));
                        });
                } else if (event.request.type === 'SessionEndedRequest') {
                    onSessionEnded(event.request, event.session);
                    callback();
                }
            })
            .catch((err) => {
                alexaLogger.logError(`Error in handling request: ${err}`);
                return callback(err);
            });
    } catch (err) {
        alexaLogger.logError(`Error in try-catch: ${err}`);
        return callback(err);
    }
};
