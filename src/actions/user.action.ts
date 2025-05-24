"use server";

import prisma from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";


export async function SyncUser() {
    try {

        const { userId } = await auth();
        const user = await currentUser();

        if (!user || !userId) return;

        const existingUser = await prisma.user.findUnique({
            where: {
                clerkId: userId,
            },
        })

        if (existingUser) return existingUser;

        const dbUser = await prisma.user.create({
            data: {
                clerkId: userId,
                name: `${user.firstName || ""} ${user.lastName || ""}`,
                username: user.username ?? user.emailAddresses[0].emailAddress.split("@")[0],
                email: user.emailAddresses[0].emailAddress,
                image: user.imageUrl
            }
        })

        return dbUser;

    } catch (error) {
        console.log("error in sync user : ", error)
    }
}

export async function Getuser(clerkId: string) {
    try {
        return prisma.user.findUnique({
            where: {
                clerkId
            },
            include: {
                _count: {
                    select: {
                        followers: true,
                        following: true,
                        posts: true
                    }
                }
            }
        })

    } catch (error) {
        console.log("error in get user : ", error);
    }
}

export async function getDbUser() {
    const { userId: clerkId } = await auth();
    if (!clerkId) throw new Error("unauthorized")

    const user = await Getuser(clerkId);

    if (!user) throw new Error("user is not found!");
    return user.id;
}


export async function getRandomUser() {
    try {
        const userId = await getDbUser();

        const randomUser = await prisma.user.findMany({
            where: {
                AND: [
                    { NOT: { id: userId } },
                    {
                        NOT: {
                            followers: {
                                some: {
                                    followerId: userId
                                }
                            }
                        }
                    }
                ]
            },
            select: {
                id: true,
                name: true,
                username: true,
                image: true,
                _count: {
                    select: {
                        followers: true
                    }
                }
            },
            take: 3
        })

        return randomUser;

    } catch (error) {
        console.log("error in fetching random User : ", error);
        return [];
    }
}


export async function toggleFollow(targetId: String) {

    try {
        const userId = await getDbUser();
        if(!userId) return;

        if (targetId === userId) throw new Error("you can't follow yourself..")

        const existingFollow = await prisma.follows.findUnique({
            where: {
                followerId_followingId: {
                    followerId: userId,
                    followingId: String(targetId)
                }
            }
        })

        if (existingFollow) {
            // unfollow
            await prisma.follows.delete({
                where: {
                    followerId_followingId: {
                        followerId: userId,
                        followingId: String(targetId)
                    }
                }
            })
        }
        else {
            await prisma.$transaction([
                prisma.follows.create({
                    data: {
                        followerId: userId,
                        followingId: String(targetId)
                    }
                }),

                prisma.notification.create({
                    data: {
                        type: "FOLLOW",
                        creatorId: userId,
                        userId: String(targetId)
                    }
                })
            ])
        }

        revalidatePath("/")
        return { success: true }

    } catch (error) {
        console.log("error in toggle follow : ",error);
    }



}