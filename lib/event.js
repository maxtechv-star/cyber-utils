const moment = require("moment-timezone");
const { getBuffer } = require("./myfunc");

module.exports = {
    /**
     * Handle group participants update (welcome/goodbye messages)
     */
    handleGroupParticipantsUpdate: async (Cyber, update) => {
        const { id, participants, action } = update;
        
        try {
            const groupData = await Cyber.groupMetadata(id);
            const groupMembers = groupData.participants.length;
            const groupName = groupData.subject;

            for (const participant of participants) {
                const userPic = await getUserPicture(Cyber, participant);
                const groupPic = await getGroupPicture(Cyber, id);

                if (action === 'add') {
                    await sendWelcomeMessage(Cyber, id, participant, groupName, groupMembers, userPic);
                } else if (action === 'remove') {
                    await sendGoodbyeMessage(Cyber, id, participant, groupName, groupMembers, userPic);
                }
            }
        } catch (error) {
            console.error('Error in group participants update:', error);
        }
    },

    /**
     * Handle incoming calls (anti-call feature)
     */
    handleCall: async (Cyber, incomingCalls) => {
        console.log('Incoming call detected:', incomingCalls);

        for (let call of incomingCalls) {
            if (!call.isGroup && call.status === "offer") { 
                let message = `🚨 *𝙲𝙰𝙻𝙻 𝙳𝙴𝚃𝙴𝙲𝚃𝙴𝙳!* 🚨\n\n`;
                message += `@${call.from.split('@')[0]}, my owner cannot receive ${call.isVideo ? `video` : `audio`} calls at the moment.\n\n`;

                if (global.anticall === "block") {
                    message += `❌ You are being *blocked* for causing a disturbance. If this was a mistake, contact my owner to be unblocked.`;
                } else {
                    message += `⚠️ Your call has been *declined*. Please avoid calling.`;
                }

                await Cyber.sendTextWithMentions(call.from, message);
                await Cyber.rejectCall(call.id, call.from);

                if (global.anticall === "block") {
                    await sleep(8000);
                    await Cyber.updateBlockStatus(call.from, "block");
                }
            }
        }
    }
};

/**
 * Get user profile picture
 */
async function getUserPicture(Cyber, userId) {
    try {
        return await Cyber.profilePictureUrl(userId, 'image');
    } catch {
        return 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png?q=60';
    }
}

/**
 * Get group profile picture
 */
async function getGroupPicture(Cyber, groupId) {
    try {
        return await Cyber.profilePictureUrl(groupId, 'image');
    } catch {
        return 'https://i.ibb.co/RBx5SQC/avatar-group-large-v2.png?q=60';
    }
}

/**
 * Send welcome message to new group members
 */
async function sendWelcomeMessage(Cyber, groupId, participant, groupName, memberCount, profilePic) {
    const welcomeMessage = `✨ *Welcome to ${groupName}!* ✨ @${participant.split('@')[0]}

You're our ${memberCount}th member!

Join time: ${moment.tz(global.timezones).format('HH:mm:ss')},  ${moment.tz(global.timezones).format('DD/MM/YYYY')}

Stay awesome!😊

> ${global.wm}`;

    await Cyber.sendMessage(groupId, {
        text: welcomeMessage,
        contextInfo: {
            mentionedJid: [participant],
            externalAdReply: {
                title: global.botname,
                body: global.ownername,
                previewType: 'PHOTO',
                thumbnailUrl: '',
                thumbnail: await getBuffer(profilePic),
                sourceUrl: global.plink
            }
        }
    });
}

/**
 * Send goodbye message to leaving group members
 */
async function sendGoodbyeMessage(Cyber, groupId, participant, groupName, memberCount, profilePic) {
    const goodbyeMessage = `✨ *Goodbye @${participant.split('@')[0]}!* ✨

You'll be missed in ${groupName}!🥲

We're now ${memberCount} members.

Left at: ${moment.tz(global.timezones).format('HH:mm:ss')},  ${moment.tz(global.timezones).format('DD/MM/YYYY')}

> ${global.wm}`;

    await Cyber.sendMessage(groupId, {
        text: goodbyeMessage,
        contextInfo: {
            mentionedJid: [participant],
            externalAdReply: {
                title: global.botname,
                body: global.ownername,
                previewType: 'PHOTO',
                thumbnailUrl: '',
                thumbnail: await getBuffer(profilePic),
                sourceUrl: global.plink
            }
        }
    });
}

/**
 * Sleep function
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}