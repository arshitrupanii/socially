"use server"

import prisma from "@/lib/prisma";
import { getDbUser } from "./user.action";
import { revalidatePath } from "next/cache";


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


export async function getPosts() {

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
        console.log("error in get posts : ", e);
    }
}


export async function createComment(postId: string, content: string) {
    try {
        const userid = await getDbUser();

        if (!userid) return;
        if (!content) return;

        const post = await prisma.post.findUnique({
            where: { id: postId },
            select: { authorId: true }
        })

        if (!post) throw new Error("post not found!!!")

        const [comment] = await prisma.$transaction(async (tx) => {
            // create comment first
            const newComment = await tx.comment.create({
                data: {
                    content,
                    authorId: userid,
                    postId: postId
                }
            })

            if (post.authorId !== userid) {
                await tx.notification.create({
                    data: {
                        type: "COMMENT",
                        userId: post.authorId,
                        creatorId: userid,
                        postId: postId,
                        commentId: newComment.id
                    }
                })
            }

            return [newComment];
        })

        revalidatePath(`/posts/${postId}`);
        return { success: true, comment }

    } catch (error) {
        console.log("Failed to create new comment ", error)
        return { success: false, error: "failed to create new comment!" }
    }
}


export async function deletePost(postId: string) {
    try {
        const userid = await getDbUser();

        const post = await prisma.post.findUnique({
            where: { id: postId },
            select: { authorId: true }
        })

        if (!post) throw new Error("post not found")
        if (post.authorId != userid) throw new Error("You are unauthorized user!!")

        await prisma.post.delete({
            where: { id: postId }
        })

        revalidatePath("/");
        return { success: true }
    }
    catch (error) {
        console.log("Failed to delete post ", error)
        return { success: false, error: "failed to delete post!" }
    }
}

export async function toggleLike(postId: string) {
    try {
        const userId = await getDbUser();
        if (!userId) return;

        // check if like exists
        const existingLike = await prisma.like.findUnique({
            where: {
                userId_postId: {
                    userId,
                    postId,
                },
            },
        });

        const post = await prisma.post.findUnique({
            where: { id: postId },
            select: { authorId: true },
        });


        if (!post) throw new Error("Post not found");

        if (existingLike) {
            // unlike
            await prisma.like.delete({
                where: {
                    userId_postId: {
                        userId,
                        postId,
                    },
                },
            });
        } else {
            // like and create notification (only if liking someone else's post)
            await prisma.$transaction([
                prisma.like.create({
                    data: {
                        userId,
                        postId,
                    },
                }),
                ...(post.authorId !== userId
                    ? [
                        prisma.notification.create({
                            data: {
                                type: "LIKE",
                                userId: post.authorId, // recipient (post author)
                                creatorId: userId, // person who liked
                                postId,
                            },
                        }),
                    ]
                    : []),
            ]);
        }
        revalidatePath("/");
        return { success: true };

    } catch (error) {
        console.error("Failed to toggle like:", error);
        return { success: false, error: "Failed to toggle like" };
    }
}