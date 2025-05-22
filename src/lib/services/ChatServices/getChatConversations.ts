import {fetcher} from "@/lib/axios/config";

export async function getChatConversation(threadId: string) {
    try {
        const response = await fetcher.get(`${process.env.NEXT_PUBLIC_API_DEV}/chat/conversation?threadId=${threadId}`);
        console.log("Fetched conversation data:", response);
        return response;
    } catch (error: any) {
        console.error("Error fetching conversation:", error.message);
        throw error;
    }
}