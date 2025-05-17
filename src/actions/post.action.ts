"use server"

import prisma from "@/lib/prisma";
import { getDbUser } from "./user.action";
import { revalidatePath } from "next/cache";


export async function createPost(content:string, imageUrl:string) {

    try {
        const userId =  await getDbUser();
        console.log(userId)

        const post = await prisma.post.create({
            data:{
                authorId : userId.clerkId,
                content : content,
                image : imageUrl
            }
        })

        revalidatePath("/")
        return{success : true,post}

    } catch (error) {
        console.log("error in post action : ", error);
    }

}