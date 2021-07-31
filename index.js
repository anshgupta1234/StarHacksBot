const Discord = require('discord.js');
const client = new Discord.Client();
const dotenv = require('dotenv');
dotenv.config();

client.once('ready', () => {
	console.log('Ready!');
});

client.login(process.env.DISCORD_API_KEY);

client.on('message', message => {
    try {
        if (message.channel.name === "join-team" && !message.content.includes("@everyone") && !message.author.bot) {
            console.log(message.content)
            if (message.content.substring(0, 6) === "!join "){
                if (message.content.split(" ").length === 2) {
                    const teamName = message.content.slice(6).toLowerCase()
                    const member   = message.member
                    const guild    = message.guild
                    let role       = guild.roles.cache.find(role => role.name === teamName)
                    // Edge Cases
                    if (!teamName.match(/^[0-9]*$/)) {
                        message.reply("Please make sure your team name is alphanumeric! (a-z, 0-9)")
                        return true
                    }
                    if ((teamName.toLowerCase().includes("mentor")
                    || teamName.toLowerCase().includes("staff")
                    || teamName.toLowerCase().includes("Admin")
                    || teamName.toLowerCase().includes("Dyno"))) {
                            message.reply("You cannot join a team named 'staff', 'mentor', 'Admin', or 'Dyno'!")
                            return true
                    }
                    const rawRoles = member.roles.cache.array()
                    let count = 0;
                    let mentor = false;
                    for (var i = 0; i < rawRoles.length; i++) {
                        if (!isNaN(rawRoles[i].name)) {
                            console.log(rawRoles[i].name)
                            count++
                        } else if (rawRoles[i].name.toLowerCase().includes("mentor")) {
                            mentor = true
                            console.log("Found a mentor")
                        }
                    }
                    if ((!role && count < 1) || mentor) {
                        console.log(mentor)
                        console.log(!role && count < 1)
                        mentor = false
                        count = 0
                        // Create Role
                        guild.roles.create({
                            data: {
                                name: teamName,
                                color: 'RED',
                                hoist: true
                            },
                            reason: "Here is your team " + teamName
                        }).then(role => {
                            member.roles.add(role)
                            // Create Category & Set Permissions
                            guild.channels.create("Team " + teamName, {
                                type: 'category',
                                topic: "This is your team's PRIVATE folder. Only your team, the mentors, and the organizers can see this! Please @[Mentor Name] if you need to ping anybody.",
                                permissionOverwrites: [
                                    {
                                        id: guild.roles.everyone.id,
                                        deny: ['VIEW_CHANNEL']
                                    },
                                    {
                                        id: role.id,
                                        allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'CONNECT', 'SPEAK', 'STREAM', 'USE_VAD', 'READ_MESSAGE_HISTORY', 'ADD_REACTIONS', 'ATTACH_FILES', 'EMBED_LINKS', 'MENTION_EVERYONE']
                                    },
                                    {
                                        id: guild.roles.cache.find(role => role.name === "mentor").id,
                                        allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'CONNECT', 'SPEAK', 'STREAM', 'USE_VAD', 'READ_MESSAGE_HISTORY', 'ADD_REACTIONS', 'ATTACH_FILES', 'EMBED_LINKS', 'MENTION_EVERYONE']
                                    }
                                ],
                            }).then(channel => {
                                // Create Text Channel
                                guild.channels.create("team-" + teamName.toLowerCase(), {
                                    parent: channel.id,
                                    type: 'text',
                                    topic: "This is your team's PRIVATE channel. Only your team, the mentors, and the organizers can see this! Please @[Mentor Name] if you need to ping anybody.",
                                }).then(ch => ch.send(`Welcome, <@${member.user.id}>! Please ask your teammates to join this group chat using **!join ${teamName}**.\nIf you made this team by accident, you can go back to <#${message.channel.id}> and type **!leave**\n\nIf you need general help, start typing **@mentor** and on the top of your text box, there should be an orange text saying "@mentor". Just click that, and your text should transform to look like <@&${guild.roles.cache.find(role => role.name === "mentor").id}>\n\nIf you need to contact a staff member, type <@&${guild.roles.cache.find(role => role.name === "staff").id}>\n\nNeed help for HTML? Type <@&${guild.roles.cache.find(role => role.name === "HTML Mentor").id}>\nNeed help with Flutter? Type <@&${guild.roles.cache.find(role => role.name === "Flutter Mentor").id}>`))
                                .catch(e => console.log(e))
                                // Create Voice Channel
                                guild.channels.create("Speak with your team here, " + teamName, {
                                    type: 'voice',
                                    topic: "This is your team's PRIVATE channel. Only your team, the mentors, and the organizers can see this! Please @[Mentor Name] if you need to ping anybody.",
                                    parent: channel.id
                                })
                            }).catch(e => console.log(e))
                        }).catch(e => console.log(e))
                        message.reply("You have been added to Team " + teamName)
                        mentor = false
                    } else if (count >= 1) {
                        console.log(count)
                        count = 0
                        message.reply("You have already joined a team! Please use !leave to leave your current team in order to join a new one.")
                    } else if ((role && count < 1) || mentor) {
                        member.roles.add(role)
                        count = 0
                        message.reply("You have been added to Team " + teamName)
                    }
                } else {
                    message.reply("Please make sure that your team name has NO SPACES and is alphanumerical (a-z, 0-9)!")
                }
            } else if (message.content === "!leave") {
                const member   = message.member
                const guild    = message.guild
                let roles      = member.roles.cache.array()
                member.voice.kick()
                for (let i = 0; i < roles.length; i++) {
                    const role = roles[i]
                    if (role.id !== guild.roles.everyone.id && role.name !== "Admin" && role.name !== "Organizer" && role.name !== "mentor" && role.name !== "staff" && role.name !== "Team Mentor" && role.name !== "HTML Mentor" && role.name !== "Flutter Mentor") {
                        member.roles.remove(role)
                        const members = role.members.array()
                        let count = 0
                        for (let i = 0; i < members.length; i++) {
                            const member = members[i]
                            if (member._roles.includes(role.id)) count++;
                        } 
                        if (count <= 2) { 
                            const teamName = role.name.toLowerCase()
                            console.log("I made it here " + teamName)
                            guild.channels.cache.find(channel => {
                                if (channel.name.toLowerCase() === "team-" + teamName
                                || channel.name.toLowerCase() === "speak with your team here, " + teamName
                                || channel.name.toLowerCase() === "team " + teamName) {
                                    channel.delete()
                                }
                            })
                            role.delete()
                            message.reply("Removed from **Team " + teamName + "**")
                        } else {
                            console.log("Oops! We lost gamers: ", count)
    
                        }
                    }
                }
            } else if (message.content.substring(0, 6) === "!kick " && message.member.hasPermission('ADMINISTRATOR')) {
                const member   = message.member
                const guild    = message.guild
                const teamName = message.content.slice(6).toLowerCase()
                
                guild.channels.cache.find(channel => {
                    if (channel.name.toLowerCase() === "team-" + teamName
                    || channel.name.toLowerCase() === "speak with your team here, " + teamName
                    || channel.name.toLowerCase() === "team " + teamName) {
                        channel.delete()
                    }
                })
                let role = guild.roles.cache.find(r => r.name === teamName);
                role.delete()
    
                message.reply("Removed Team " + teamName)
            }
        }
    } catch (e) {
    }
})
