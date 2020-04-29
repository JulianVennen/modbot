//removes messages with(out) IPs in specific channels
exports.message = (message, channels) => {
  if(!message.guild || message.author.bot || message.member.hasPermission('MANAGE_MESSAGES'))
    return;

  if(channels.get(message.channel.id)&&channels.get(message.channel.id).mode){
    let mode = channels.get(message.channel.id).mode;
    if(mode === 1 && !message.content.toLowerCase().includes('.aternos.me')){
      //delete non IP messages in IP only channels
      message.channel.send(`**:no_entry: <@${message.author.id}> your message to this channel must include a valid Aternos IP! :no_entry:**`)
      .then(response =>
        response.delete({timeout: 5000}).catch(error => console.error("Failed to delete a Message! ",error))
      );
      message.delete().catch(error => console.error("Failed to delete a Message! ",error));
      return;
    }
    if(mode === 2 && message.content.toLowerCase().includes('.aternos.me')){
      //Delete IPs in no IP channels
      message.channel.send(`**:no_entry: <@${message.author.id}> don't advertise your server here! :no_entry:**`)
      .then(response =>
        response.delete({timeout: 5000}).catch(error => console.error("Failed to delete a Message! ",error))
      );
      message.delete().catch(error => console.error("Failed to delete a Message! ",error));
      return;
    }
  }
}
