/**
 * Shared tools and state for both Gemini Agent and MCP Server
 */

// Mock Database
export const todos: string[] = ["Buy groceries", "Finish agent build"];

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
    add_todo: async ({ task }: { task: string }) => {
        console.log(`[Tools] Adding todo: ${task}`);
        todos.push(task);
        return { success: true, message: `Added "${task}" to your list.` };
    },
    list_todos: async () => {
        console.log(`[Tools] Listing todos`);
        return { todos };
    },
    remove_todo: async ({ taskIdentifier }: { taskIdentifier: string }) => {
        console.log(`[Tools] Removing todo: ${taskIdentifier}`);
        const index = parseInt(taskIdentifier);
        if (!isNaN(index) && todos[index]) {
            const removed = todos.splice(index, 1);
            return { success: true, message: `Removed "${removed[0]}"` };
        }
        const foundIndex = todos.findIndex(t => t.toLowerCase().includes(taskIdentifier.toLowerCase()));
        if (foundIndex !== -1) {
            const removed = todos.splice(foundIndex, 1);
            return { success: true, message: `Removed "${removed[0]}"` };
        }
        return { success: false, message: "Task not found." };
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
