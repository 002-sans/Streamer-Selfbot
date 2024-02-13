const StreamVideo  = require('@dank074/discord-video-stream'),     
    ffmpegPath     = require('@ffmpeg-installer/ffmpeg').path,
    Discord        = require('discord.js-selfbot-v13'),
    config         = require('./config.json'),
    ffmpeg         = require('fluent-ffmpeg')
                     require('colors')

ffmpeg.setFfmpegPath(ffmpegPath)

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
            message.channel.send(`
            \`${config.prefix}help\` ➜ **Affiche ce menu**
            \`${config.prefix}ping\` ➜ **Montre le ping du bot**
            \`${config.prefix}play <lien>\` ➜ **Stream une vidéo (.mp4)**
            \`${config.prefix}stop\` ➜ **Coupe le stream**
            \`${config.prefix}leave\` ➜ **Quitte le salon vocale**`.replaceAll("            ", "")).then(m => deletemsg(m, 10))
            console.log(`[✉️] | Commande ${args[0]} executée`.yellow)
            break

        case "ping":
            const msg = await message.channel.send(`Ping: \`${streamer.client.ws.ping}\`ms`).then(m => deletemsg(m, 10))
            //msg.edit(`Ping: \`${streamer.client.ws.ping}\`ms\nLatance: \`${msg.createdAt - message.createdAt}\`ms`).then(m => deletemsg(m, 10))
            break

        case "play":
            if (!message.guild) return message.channel.send("Veuillez utiliser cette commande sur un serveur !").then(m => deletemsg(m, 10))
            if (!message.member.voice) return message.channel.send("Veuillez rejoindre un salon vocale !").then(m => deletemsg(m, 10))
            if (!message.member.voice.channel.joinable) return message.channel.send("Je ne peux pas rejoindre le salon vocale !").then(m => deletemsg(m, 10))
            if (!args[1] || !args[1].startsWith("https://")) return message.channel.send("Veuillez me donner un lien de vidéo valide !").then(m => deletemsg(m, 10))

            await streamer.joinVoice(message.guild.id, message.member.voice.channel.id).catch(() => false)
            const udp = await streamer.createStream();
            udp.mediaConnection.setSpeaking(true);
            udp.mediaConnection.setVideoStatus(true);
            try {
                console.log(`[✉️] | Commande ${args[0]} executée`.yellow)
                message.channel.send(`Lancement du stream sur ${message.member.voice.channel} !`).then(m => deletemsg(m, 10))
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
            message.channel.send("Le stream a été arrêté !").then(m => deletemsg(m, 10))
            console.log(`[✉️] | Commande ${args[0]} executée`.yellow)
            break

        case "leave":
            streamer.leaveVoice()
            message.channel.send("J'ai quitté le salon vocale !").then(m => deletemsg(m, 10))
            console.log(`[✉️] | Commande ${args[0]} executée`.yellow)
            break
    }
})


function deletemsg(msg, ms){
    setTimeout(() => {
        if (msg?.deletable) message.delete().catch(() => false)
    }, ms * 1000 * 60);
}