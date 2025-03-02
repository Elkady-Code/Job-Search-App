import { asyncHandler } from "../../utils/index.js";
import chatModel from "../../DB/models/chat.schema.js";
import { UserRole } from "../../utils/enums/index.js";

// --------- Get Chat History ---------
export const getChatHistory = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;

  if (!userId) {
    return next(new Error("User ID is required", { cause: 400 }));
  }

  const chat = await chatModel
    .findOne({
      $or: [
        { senderId: req.user._id, receiverId: userId },
        { senderId: userId, receiverId: req.user._id },
      ],
    })
    .populate({
      path: "messages.senderId",
      select: "firstName lastName role",
    })
    .populate({
      path: "senderId receiverId",
      select: "firstName lastName email role",
    });

  if (!chat) {
    return next(new Error("Chat not found", { cause: 404 }));
  }

  res.status(200).json({
    success: true,
    chat,
    messages: chat.messages,
  });
});

// --------- Send Message ---------
export const initializeChat = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  const { message } = req.body;

  if (!userId || !message) {
    return next(new Error("User ID and message are required", { cause: 400 }));
  }

  if (req.user.role === UserRole.USER) {
    return next(
      new Error("Only HR or company owner can initiate chat", { cause: 403 })
    );
  }

  let chat = await chatModel.findOne({
    senderId: req.user._id,
    receiverId: userId,
  });

  if (!chat) {
    chat = await chatModel.create({
      senderId: req.user._id,
      receiverId: userId,
      messages: [
        {
          senderId: req.user._id,
          message: message,
          timestamp: new Date(),
        },
      ],
    });
  }

  return res.status(201).json({
    message: "Chat initialized successfully",
    chat: await chat.populate([
      {
        path: "senderId",
        select: "firstName lastName email",
      },
      {
        path: "receiverId",
        select: "firstName lastName email",
      },
    ]),
  });
});
