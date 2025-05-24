"use server";

import prisma from "@/lib/prisma";
import { getDbUser } from "./user.action";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";


export async function getProfileByUsername(username: string) {
    try {
        const user = await prisma.user.findUnique({
            where: {
                username: username
            },
            select: {
                id: true,
                name: true,
                username: true,
                bio: true,
                image: true,
                location: true,
                website: true,
                createdAt: true,
                _count: {
                    select: {
                        followers: true,
                        following: true,
                        posts: true
                    }
                }
            }
        })

        return user;

    } catch (error) {
        console.log("Failed to show profile", error)
        throw new Error("failed to show profile")

    }

}

export async function getUserPosts(userId: string) {
    try {
        const posts = await prisma.post.findMany({
            where: {
                authorId: userId
            },

            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        image: true,
                        name: true,
                    }
                },
                comments: {
                    include: {
                        author: {
                            select: {
                                id: true,
                                name: true,
                                username: true,
                                image: true,
                            }
                        }
                    },
                    orderBy: {
                        createdAt: "asc"
                    }
                },
                likes: {
                    select: {
                        userId: true,
                    }
                },

                _count: {
                    select: {
                        likes: true,
                        comments: true,
                    }
                }
            },
            orderBy: {
                createdAt: "desc"
            }
        })

        return posts

    } catch (error) {
        console.log("Failed to get user posts", error)
        throw new Error("failed to get user posts")
    }
}


export async function getUserLikedPosts(userId: string) {
    try {


        const likedPost = await prisma.post.findMany({
            where: {
                likes: {
                    some: {
                        userId
                    }
                }
            },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        image: true,
                        name: true,
                    }
                },
                comments: {
                    include: {
                        author: {
                            select: {
                                id: true,
                                name: true,
                                username: true,
                                image: true,
                            }
                        }
                    },
                    orderBy: {
                        createdAt: "asc"
                    }
                },
                likes: {
                    select: {
                        userId: true,
                    }
                },

                _count: {
                    select: {
                        likes: true,
                        comments: true,
                    }
                }
            },
            orderBy: {
                createdAt: "desc"
            }
        })

        return likedPost;

    } catch (error) {
        console.log("Failed to get user liked posts", error)
        throw new Error("failed to get user liked posts")
    }
}

export async function updateProfile(formData:FormData) {
    try {
        const {userId:clerkId} = await auth();
        if(!clerkId) throw new Error("unauthorized");

        const name = formData.get("name") as string;
        const bio = formData.get("bio") as string;
        const location = formData.get("location") as string;
        const website = formData.get("website") as string;

        const user = await prisma.user.update({
            where:{clerkId},
            data:{
                name,bio,location,website
            }
        })

        revalidatePath("/profile")
        return {success :true, user}

    } catch (error) {
        console.log("Failed to update profile", error)
        return { success: false, error: "Failed to update profile" };
    }
}

export async function isFollowing(userId:string) {
    const currentUserId  = await getDbUser();
    if(!currentUserId) return false;
    
    try {
        const follow = await prisma.follows.findUnique({
            where:{
                followerId_followingId:{
                    followerId: currentUserId,
                    followingId: userId
                }
            }
        })

        // that convert {} into true or false !!{} => true
        return !!follow;

    } catch (error) {
        console.log("Failed to isfollowing function", error)
        return false; 
    }
    
}