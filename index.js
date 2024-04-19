const StreamVideo  = require('@dank074/discord-video-stream'),     
      ffmpegPath   = require('@ffmpeg-installer/ffmpeg').path,
      Discord      = require('discord.js-selfbot-v13'),
      config       = require('./config.json')
      ffmpeg       = require('fluent-ffmpeg'),
      db           = require('./db.json'),
      fs           = require('node:fs')
                     require('colors')
                     ffmpeg.setFfmpegPath(ffmpegPath)


console.clear()
console.log(`
.=====================================================================================================================.
|                          ███████╗████████╗██████╗ ███████╗ █████╗ ███╗   ███╗███████╗██████╗                        |
|                          ██╔════╝╚══██╔══╝██╔══██╗██╔════╝██╔══██╗████╗ ████║██╔════╝██╔══██╗                       |
|                          ███████╗   ██║   ██████╔╝█████╗  ███████║██╔████╔██║█████╗  ██████╔╝                       |
|                          ╚════██║   ██║   ██╔══██╗██╔══╝  ██╔══██║██║╚██╔╝██║██╔══╝  ██╔══██╗                       |
|                          ███████║   ██║   ██║  ██║███████╗██║  ██║██║ ╚═╝ ██║███████╗██║  ██║                       |
|                          ╚══════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚══════╝╚═╝  ╚═╝                       |
\`=====================================================================================================================´`)
console.log("{ Logs: }\n".red)
const streamer = new StreamVideo.Streamer(new Discord.Client());
streamer.client.login(config.token).catch(e => console.log(`[🔴] | ${e}`.red));
streamer.client.on('ready', async client => console.log(`[🟢] | ${client.user.username} est connecté`.green));
streamer.client.on('messageCreate', async message => {
    if (message.author.id !== streamer.client.user.id &&
        !config.allowedUser.includes(message.author.id)) return;

    const args = message.content.substring(config.prefix.length).split(' ')

    switch(args[0]){
        case "help":
            editMessage(streamer.client, message, `
            \`${config.prefix}help\` ➜ **Affiche ce menu**
            \`${config.prefix}ping\` ➜ **Montre le ping du bot**
            \`${config.prefix}play <lien>\` ➜ **Stream une vidéo (.mp4)**
            \`${config.prefix}stop\` ➜ **Coupe le stream**
            \`${config.prefix}leave\` ➜ **Quitte le salon vocale**`.replaceAll("            ", "")).then(m => deletemsg(m, 10))
            console.log(`[✉️] | Commande ${args[0]} executée`.yellow)
            break

        case "ping":
            const msg = await message.channel.send(`Ping: \`${streamer.client.ws.ping}\`ms`)
            msg.edit(`Ping: \`${streamer.client.ws.ping}\`ms\nLatance: \`${msg.createdAt - message.createdAt}\`ms`).then(m => deletemsg(m, 10))
            break

        case "play":
            if (!message.guild) return editMessage(streamer.client, message, "Veuillez utiliser cette commande sur un serveur !")
            if (!message.member.voice.channel) return editMessage(streamer.client, message, "Veuillez rejoindre un salon vocale !")
            if (!message.member.voice.channel.joinable) return editMessage(streamer.client, message, "Je ne peux pas rejoindre le salon vocale !")
            if (!args[1] || !args[1].startsWith("http")) return editMessage(streamer.client, message, "Veuillez me donner un lien de vidéo valide !")

            await streamer.joinVoice(message.guild.id, message.member.voice.channel.id).catch(() => false)
            const udp = await streamer.createStream();
            udp.mediaConnection.setSpeaking(true);
            udp.mediaConnection.setVideoStatus(true);
            try {
                console.log(`[✉️] | Commande ${args[0]} executée`.yellow)
                editMessage(streamer.client, message, `Lancement du stream sur ${message.member.voice.channel} !`)
                await StreamVideo.streamLivestreamVideo(args[1], udp);
            } catch (e) { 
                message.channel.send(`${e}`).then(m => deletemsg(m, 10))
            } 
            finally {
                udp.mediaConnection.setSpeaking(false);
                udp.mediaConnection.setVideoStatus(false);
            }
            break

        case "stop":
            streamer.stopStream()
            editMessage(streamer.client, message, "Le stream a été arrêté !")
            console.log(`[✉️] | Commande ${args[0]} executée`.yellow)
            break

        case "leave":
            streamer.leaveVoice()
            editMessage(streamer.client, message, "J'ai quitté le salon vocale !")
            console.log(`[✉️] | Commande ${args[0]} executée`.yellow)
            break

    }
})


function deletemsg(msg, ms){
    setTimeout(() => {
        if (msg.deletable) message.delete().catch(() => false)
    }, ms * 1000 * 60);
}

function editMessage(client, message, text){
    if (message.author.id === client.user.id) message.edit(text).then(m => deletemsg(m, 10)).catch(() => message.delete().catch(() => false))
    else message.channel.send(text).then(m => deletemsg(m, 10)).catch(() => message.delete().catch(() => false))
}
