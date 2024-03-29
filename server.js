// ____       _                  _____  _                       _   _______                  _       _             
// |  _ \     (_)                |  __ \(_)                     | | |__   __|                | |     | |            
// | |_) |_ __ _ _ __ ___   ___  | |  | |_ ___  ___ ___  _ __ __| |    | |_ __ __ _ _ __  ___| | __ _| |_ ___  _ __ 
// |  _ <| '__| | '_ ` _ \ / _ \ | |  | | / __|/ __/ _ \| '__/ _` |    | | '__/ _` | '_ \/ __| |/ _` | __/ _ \| '__|
// | |_) | |  | | | | | | |  __/ | |__| | \__ \ (_| (_) | | | (_| |    | | | | (_| | | | \__ \ | (_| | || (_) | |   
// |____/|_|  |_|_| |_| |_|\___| |_____/|_|___/\___\___/|_|  \__,_|    |_|_|  \__,_|_| |_|___/_|\__,_|\__\___/|_|   

/////////////////////////
// Written by: Geeken //
///////////////////////


// Standard import stuff
const Discord = require('discord.js');
const client = new Discord.Client();
const translate = require("deepl");
const fetch = require('node-fetch');
require('dotenv').config()


// Define the webhooks that will be used to send messages on the different language channels.
// These may be generated by visiting, Server Settings -> Integrations -> Webhooks
// Create one for each of the language channels you have. (there's prob. a much easier way that wouldn't require this, but I can't be bothered.) 
// EXAMPLE: https://discord.com/api/webhooks/850203723991875616/ylJjRDi9yR-9hlYalw0RU1YLXEN7cRHjRHCXHU9yFAQFKQVeTwb82DAlXJqskKUJIn1i
//                                                 ^webhookID                               ^webhookToken
//                                               (put this below)                         (put this in .env)
// 
// i.e. - https://discord.com/api/webhooks/webhookID/webhookToken

const english = new Discord.WebhookClient('849863508606058519', process.env.ENwebhookClientKey);
const russian = new Discord.WebhookClient('849857368182489129', process.env.RUwebhookClientKey);
const spanish = new Discord.WebhookClient('850194441456320532', process.env.SPwebhookClientKey);
const german = new Discord.WebhookClient('850194935356456961', process.env.DEwebhookClientKey);
const polish = new Discord.WebhookClient('850195089292787752', process.env.PLwebhookClientKey);

// Log that we successfully connected to Discord
client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

// Listen for messages on Brime Discord Server
// brimeLangChannels = {"DISCORD_CHANNEL_NAME": "DEEPL_LANG_KEY"}
client.on('message', msg => {
    const brimeLangChannels = {
        "english": "EN",
        "russian": "RU",
        "spanish": "ES",
        "german": "DE",
        "polish": "PL",
    }

    // Only process messages that originate from one of the channels defined above in brimeLangChannels.
    if (brimeLangChannels.hasOwnProperty(msg.channel.name)) {
        const msgChannel = msg.channel.name

        // Remove the channel that the message was sent on from the translated receiving end.
        delete brimeLangChannels[msgChannel]

        // Remove the @everyone mention from the message.
        // This is because Discord doesn't like @everyone mentions.
        let sanatizedMsg = msg.content.replace(/@everyone/gi, "/// This user attempted to @ Everyone - Ban Them. (-Geeken) ///")

        // Drop messages sent from Webhooks to prevent loop. && Verify that the message contains text to be translated and is not an attachment.
        if (!msg.webhookID && msg.content) {
            console.log(`{
            Message Received: { 
               "channel": ${msg.channel.name},
               "sender": ${msg.author.username},
               "message": ${msg.content},
               "sanatizedMsg": ${sanatizedMsg}
            }
        }`)
            // Call a translate function for each of the channels that should received a localized version of the message.
            Object.keys(brimeLangChannels).forEach(function (key) {
                transMsg(sanatizedMsg, msg.author, brimeLangChannels[key], key)
            })
        }
        // Check if the message contains only an attachment. If true, then just proxy the message to the receiving channels without translating.
        if (msg.attachments.size > 0 && !msg.content) {
            msg.attachments.forEach(Attachment => {
                Object.keys(brimeLangChannels).forEach(function (key) {
                    proxyMsg(Attachment.url, msg.author, brimeLangChannels[key], key)
                })
            })
        }
    }
});

// Connect to the Discord server
client.login(process.env.discordBotToken);

// Define translate function that gets called above
function transMsg(msgToTrans, sender, lang, destChannel) {
    // Just some basic logging in json format.
    console.log(`{
        Translation Task: { 
           "sender": ${sender.username},
           "message": ${msgToTrans},
           "sentLanguage": ${lang},
           "destChannel": ${destChannel}
        }
    }`)
    // Translation Magic 🦄 - Send the message off to the DeepL API for translation.
    translate({
            text: msgToTrans,
            target_lang: lang,
            auth_key: process.env.deepLKey,
            // All optional DeepL parameters available in the official documentation can be defined here as well.
        })
        .then(result => {
            // Send the translated version of the message to the appropriate Discord channel :)
            eval(destChannel).send(result.data.translations[0].text, {
                username: sender.username,
                avatarURL: `https://cdn.discordapp.com/avatars/${sender.id}/${sender.avatar}.jpeg`,
            });
        })
        // Catch Errors. But of course, I never make mistakes, so this is a useless line *kappa*
        .catch(error => {
            console.error(error)
        })
}
// Bypass translation and proxy the message media to the additional language channels.
function proxyMsg(msgToTrans, sender, lang, destChannel) {
    console.log(`{
        Proxy Task: { 
           "sender": ${sender.username},
           "message": ${msgToTrans},
           "sentLanguage": ${lang},
           "destChannel": ${destChannel}
        }
    }`)
    eval(destChannel).send(msgToTrans, {
        username: sender.username,
        avatarURL: `https://cdn.discordapp.com/avatars/${sender.id}/${sender.avatar}.jpeg`,
    })
}