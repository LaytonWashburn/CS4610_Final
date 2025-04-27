import { EndpointBuilder, controller } from "./controller";
import { PrismaClient } from "@prisma/client";
import { getOllama } from "../ollama/ollama";


export const chat: EndpointBuilder = (db: PrismaClient) => async (req, res) => {
    const { message } = req.body;
    const ollama = getOllama();
    const response = await ollama.chat({
        model: 'qwen2.5-coder',
        messages: [{ role: 'user', content: message }],
    });
    res.json({ response });
}

export const AiController =  controller([
    { method: "post", path: "/chat", builder: chat }
  ]);