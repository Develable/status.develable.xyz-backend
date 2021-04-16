import Discord from 'discord.js';

export enum _MessageType {
    WARN,
    ERROR,
    INFO,
    SUCCESS,
    NONE
}

export interface _Message {
    type         : _MessageType,
    ServiceTitle : string
    FieldTitle   : string,
    FieldInfo    : string,
    starttime    : string,
    endtime      : string,
    timestamp    : string,
}

class _Discord {
    private botToken: Discord.Snowflake;
    private targetChannelID: Discord.Snowflake;
    private targetChannel: Discord.TextChannel | undefined;
    private client: Discord.Client;
    constructor(botToken: Discord.Snowflake, targetChannelID: Discord.Snowflake) {
        this.botToken = botToken;
        this.targetChannelID = targetChannelID;
        this.client = new Discord.Client();
        this.targetChannel = undefined;

        this.client.on('ready', this.onReady);

        this.client.login(this.botToken);
    }

    private onReady = (): void => {
        console.log('discord module is ready.');

        let targetChannel = this.client.channels.cache.find((channel: Discord.Channel) => channel.id == this.targetChannelID);
        if (!targetChannel) {
            this.client.destroy();
            console.log('ERROR! targetChannelID is unknown.');
            process.exit(); // 솔직히 이건 터트려야지
        }
        if (!((targetChannel): targetChannel is Discord.TextChannel => targetChannel.type === 'text' || targetChannel.type === 'news')(targetChannel)) return;
        this.targetChannel = targetChannel;
        console.log(`targetChannel(ID: ${this.targetChannelID}) is ready.`);
    }

    public sendMessage = (message: _Message): Promise<boolean> => {
       return new Promise((res, rej) => {
        if (this.targetChannel === undefined) {
            console.log('ERROR! targetChannel is not ready.');
        }

        let EmbedTitle: String = `[정보 없음] ${message.ServiceTitle}`,
            EmbedSecondField: String = '정보 없음',
            EmbedColor: String = '#FFFFFF';

        switch (message.type) {
            case _MessageType.ERROR: // 대규모
                EmbedTitle = `[대규모 문제] ${message.ServiceTitle}`;
                EmbedSecondField = `발생 시각 : ${message.starttime}`;
                EmbedColor = '#E74C3C';
                break;
            case _MessageType.WARN: // 소규모
                EmbedTitle = `[소규모 문제] ${message.ServiceTitle}`;
                EmbedSecondField = `발생 시각 : ${message.starttime}`;
                EmbedColor = '#EDAA16';
                break;
            case _MessageType.INFO: // 점검
                EmbedTitle = `[점검 예정됨] ${message.ServiceTitle}`;
                EmbedSecondField = `점검 시작 : ${message.starttime}\n점검 종료 : ${message.endtime}`;
                EmbedColor = '#337AB7';
                break;
            case _MessageType.SUCCESS: // 정상
                EmbedTitle = `[해결됨] ${message.ServiceTitle}`;
                EmbedSecondField = `완료 시각 : ${message.starttime}`;
                EmbedColor = '#2FCC66';
                break;
        }

        let messageEmbed = new Discord.MessageEmbed()
            .setTitle(EmbedTitle)
            .addField(message.FieldTitle, message.FieldInfo, false)
            .addField(`시간정보`, `${EmbedSecondField}\n\n[서버상태 페이지](http://status.develable.xyz)`, false)
            .setColor(`${EmbedColor}`)
            .setTimestamp(new Date(`${message.timestamp}`))
            .setFooter(`© 2018-2021 Develable`);

        this.targetChannel?.send(messageEmbed).then((message) => {
            message.crosspost().then(() => console.log('message crossposted')).catch((e) => console.error(e));

            if (message.editable) res(true);
            else res(false);
        });
       });
    }
}

export default _Discord;