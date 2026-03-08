/**
 * Shared tools and state for both Gemini Agent and MCP Server
 */



export const toolHandlers = {
    get_weather: async ({ location }: { location: string }) => {
        console.log(`[Tools] Calling get_weather tool for: ${location}`);
        return {
            location,
            temperature: "22°C",
            condition: "Partly Cloudy",
            humidity: "65%",
        };
    },
    get_user_info: async ({ userId }: { userId: string }) => {
        console.log(`[Tools] Calling get_user_info tool for: ${userId}`);
        const users: Record<string, any> = {
            "user-1": { name: "John Doe", role: "Developer", tenure: "3 years" },
            "user-2": { name: "Jane Smith", role: "Product Manager", tenure: "5 years" },
        };
        return users[userId] || { error: "User not found" };
    },

    get_current_time: async () => {
        console.log(`[Tools] Getting current time`);
        return {
            time: new Date().toLocaleTimeString(),
            date: new Date().toLocaleDateString(),
            day: new Date().toLocaleDateString('en-US', { weekday: 'long' })
        };
    },
};
