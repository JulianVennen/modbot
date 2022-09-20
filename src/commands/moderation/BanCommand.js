import Command from '../Command.js';
import {ActionRowBuilder, EmbedBuilder, escapeMarkdown, ModalBuilder, PermissionFlagsBits, PermissionsBitField, TextInputBuilder, TextInputStyle} from 'discord.js';
import MemberWrapper from '../../discord/MemberWrapper.js';
import {formatTime, parseTime} from '../../util/timeutils.js';
import colors from '../../util/colors.js';

export default class BanCommand extends Command {

    buildOptions(builder) {
        builder.addUserOption(option =>
            option
                .setName('user')
                .setDescription('The user you want to ban')
                .setRequired(true)
        );
        builder.addStringOption(option =>
            option.setName('reason')
                .setDescription('Ban reason')
                .setRequired(false)
        );
        builder.addStringOption(option =>
            option.setName('duration')
                .setDescription('Ban duration')
                .setRequired(false)
        );
        builder.addIntegerOption(option =>
            option.setName('delete')
                .setDescription('Delete messages for the last x days')
                .setRequired(false)
                .setMinValue(0)
                .setMaxValue(7)
        );
        return super.buildOptions(builder);
    }

    getDefaultMemberPermissions() {
        return new PermissionsBitField()
            .add(PermissionFlagsBits.BanMembers);
    }

    getRequiredBotPermissions() {
        return new PermissionsBitField()
            .add(PermissionFlagsBits.BanMembers);
    }

    supportsUserCommands() {
        return true;
    }

    async execute(interaction) {
        await this.ban(interaction,
            new MemberWrapper(interaction.options.getUser('user', true), interaction.guild),
            interaction.options.getString('reason'),
            interaction.user,
            parseTime(interaction.options.getString('duration')),
            interaction.options.getInteger('delete', true)
        );
    }

    /**
     *
     * @param {import('discord.js').Interaction} interaction
     * @param {MemberWrapper} member
     * @param {?string} reason
     * @param {import('discord.js').User} moderator
     * @param {?number} duration
     * @param {?number} deleteMessageTime
     * @return {Promise<void>}
     */
    async ban(interaction, member, reason, moderator, duration, deleteMessageTime) {
        reason = reason || 'No reason provided';

        if (!await member.isModerateable()) {
            await interaction.reply({ephemeral: true, content: 'I can\'t moderate this member!'});
            return;
        }

        await member.ban(reason, moderator, duration, deleteMessageTime);
        await interaction.reply({
            ephemeral: true,
            embeds: [new EmbedBuilder()
                .setDescription(`${escapeMarkdown(member.user.tag)} has been banned${duration ? ` for ${formatTime(duration)}` : ''}: ${reason}`)
                .setColor(colors.RED)
            ]}
        );
    }

    async executeButton(interaction) {
        await this.promptForData(interaction, await MemberWrapper.getMemberFromCustomId(interaction));
    }

    async executeUserMenu(interaction) {
        const member = new MemberWrapper(interaction.targetUser, interaction.guild);
        await this.promptForData(interaction, member);
    }

    /**
     * prompt user for ban reason, duration and more
     * @param {import('discord.js').Interaction} interaction
     * @param {MemberWrapper} member
     * @return {Promise<void>}
     */
    async promptForData(interaction, member) {
        await interaction.showModal(new ModalBuilder()
            .setTitle(`Ban ${member.user.tag}`)
            .setCustomId('ban')
            .addComponents(
                /** @type {*} */
                new ActionRowBuilder()
                    .addComponents(/** @type {*} */ new TextInputBuilder()
                        .setRequired(false)
                        .setLabel('Reason')
                        .setCustomId('reason')
                        .setStyle(TextInputStyle.Paragraph)
                        .setPlaceholder('No reason provided')),
                /** @type {*} */
                new ActionRowBuilder()
                    .addComponents(/** @type {*} */ new TextInputBuilder()
                        .setRequired(false)
                        .setLabel('Duration')
                        .setCustomId('duration')
                        .setStyle(TextInputStyle.Short)),
                /** @type {*} */
                new ActionRowBuilder()
                    .addComponents(/** @type {*} */ new TextInputBuilder()
                        .setRequired(false)
                        .setLabel('Delete message history')
                        .setCustomId('delete')
                        .setStyle(TextInputStyle.Short)
                        .setValue('1 hour')),
            ));
    }

    async executeModal(interaction) {
        let reason, duration, deleteMessageTime;
        for (const row of interaction.components) {
            for (const component of row.components) {
                if (component.customId === 'reason') {
                    reason = component.value || 'No reason provided';
                }
                else if (component.customId === 'duration') {
                    duration = parseTime(component.value);
                }
                else if (component.customId === 'delete') {
                    deleteMessageTime = parseTime(component.value);
                }
            }
        }

        await this.ban(
            interaction,
            await MemberWrapper.getMemberFromCustomId(interaction),
            reason, interaction.user,
            duration,
            deleteMessageTime
        );
    }

    getDescription() {
        return 'Ban a user';
    }

    getName() {
        return 'ban';
    }
}