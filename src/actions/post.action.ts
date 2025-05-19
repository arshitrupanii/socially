"use server"

import prisma from "@/lib/prisma";
import { getDbUser } from "./user.action";
import { revalidatePath } from "next/cache";
import { error } from "console";


export async function createPost(content: string, imageUrl: string) {

    try {
        const userId = await getDbUser();
        if (!userId) return;

        const post = await prisma.post.create({
            data: {
                authorId: userId,
                content: content,
                image: imageUrl
            }
        })

        revalidatePath("/")
        return { success: true, post }

    } catch (error) {
        console.log("error in post action : ", error);
        return { success: false, message: "Error in posting.." }
    }

}


export async function getPost() {

    try {

        const userId = await getDbUser();
        if (!userId) return;

        const posts = await prisma.post.findMany({
            orderBy: {
                createdAt: "desc"
            },
            include: {
                author: {
                    select: {
                        name: true,
                        image: true,
                        username: true
                    }
                },
                comments: {
                    include: {
                        author: {
                            select: {
                                name: true,
                                id: true,
                                image: true,
                                username: true
                            }
                        }
                    },
                    orderBy: {
                        createdAt: "asc"
                    }
                },
                likes: {
                    select: {
                        userId: true
                    }
                },
                _count: {
                    select: {
                        likes: true,
                        comments: true
                    }
                }
            }
        })

        return posts;

    } catch (e) {
        console.log("error in get posts : ", error);
    }
}


export async function createComment() {
    
}


export async function deletePost() {
    
}

export async function getPosts() {
    
}

export async function toggleLike() {
    
}