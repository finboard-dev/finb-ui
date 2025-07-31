import { fetcher } from "../axios/config";

export const sendMagicLink = async (link: string) => {
  try {
    const response = await fetcher.get(`${process.env.NEXT_PUBLIC_API_DEV}/auth/magiclink?token=${link}`);
    return response
  } catch (error) {
    console.error(error);
    throw error;
  }
};