import chatModel from "../../DB/models/chat.schema.js";

export const handleChatEvents = (io, socket) => {
  socket.on("joinChat", (chatId) => {
    socket.join(chatId);
  });

  socket.on("sendMessage", async ({ chatId, content, recipientId }) => {
    const chat = await chatModel.findById(chatId);

    if (!chat) {
      socket.emit("error", "Chat not found");
      return;
    }

    chat.messages.push({
      sender: socket.user._id,
      content,
    });
    chat.lastMessage = new Date();
    await chat.save();

    io.to(chatId).emit("newMessage", {
      chatId,
      message: {
        sender: socket.user._id,
        content,
        timestamp: new Date(),
      },
    });
  });
};
