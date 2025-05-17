"use server"

import prisma from "@/lib/prisma";
import { getDbUser } from "./user.action";


export async function createPost(content:string, imageUrl:string) {

    try {
        const userId =  String(await getDbUser());

        const post = await prisma.post.create({
            data:{
                content : content,
                image : imageUrl,
                autherId : userId
            }
        })

        // revalidatePath("/")
        // return{success : true,post}

    } catch (error) {
        console.log("error in post action : ", error);
    }


}