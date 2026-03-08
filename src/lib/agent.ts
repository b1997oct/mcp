import { GoogleGenerativeAI, SchemaType, type Tool } from "@google/generative-ai";

/**
 * 1. Define the Tools
 * These are functions the AI agent can choose to call to get real-world data.
 */
const tools: Tool[] = [
    {
        functionDeclarations: [
            {
                name: "get_weather",
                description: "Get the current weather for a specific location",
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                        location: {
                            type: SchemaType.STRING,
                            description: "The city and state, e.g. San Francisco, CA",
                        },
                    },
                    required: ["location"],
                },
            },
            {
                name: "get_user_info",
                description: "Get information about a specific user by their ID",
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                        userId: {
                            type: SchemaType.STRING,
                            description: "The unique identifier for the user",
                        },
                    },
                    required: ["userId"],
                },
            },

            {
                name: "get_current_time",
                description: "Get the current day and time",
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {},
                },
            }
        ],
    },
];

import { toolHandlers } from "./tools";

/**
 * 3. The Agent Builder
 */
export class GoogleAgent {
    private model: any;
    private chat: any;

    constructor(apiKey: string) {
        if (!apiKey) throw new Error("Google AI API Key is required.");

        const genAI = new GoogleGenerativeAI(apiKey);

        // Initialize the model with the tools
        this.model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash-lite",
            tools: tools
        });

        // Start a chat session to maintain context
        this.chat = this.model.startChat();
    }

    async run(prompt: string): Promise<string> {
        // Send the user prompt
        let result = await this.chat.sendMessage(prompt);
        let response = result.response;

        // Process potential function calls (can be multiple)
        let functionCalls = response.candidates[0].content.parts.filter(
            (part: any) => part.functionCall
        );

        // If the model wants to call tools, we execute them and send results back
        while (functionCalls.length > 0) {
            console.log(`[Agent] Model requested ${functionCalls.length} function calls.`);

            const functionResponses = await Promise.all(
                functionCalls.map(async (part: any) => {
                    const call = part.functionCall;
                    const handler = (toolHandlers as any)[call.name];

                    if (!handler) {
                        return {
                            functionResponse: {
                                name: call.name,
                                response: { error: `Tool ${call.name} not found` },
                            },
                        };
                    }

                    const toolResult = await handler(call.args);
                    return {
                        functionResponse: {
                            name: call.name,
                            response: toolResult,
                        },
                    };
                })
            );

            // Send the tool results back to the model to get the final natural language answer
            result = await this.chat.sendMessage(functionResponses);
            response = result.response;

            // Check if the model needs to call more tools (rare but possible in complex workflows)
            functionCalls = response.candidates[0].content.parts.filter(
                (part: any) => part.functionCall
            );
        }

        return response.text();
    }
}
