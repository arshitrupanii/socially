"use server";

import prisma from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";

export async function SyncUser() {
    try {
        
        const {userId} = await auth();
        const user = await currentUser();

        if(!user || !userId) return;

        const existingUser = await prisma.user.findUnique({
            where:{
                clerkId : userId,
            },
        })

        if(existingUser) return existingUser;

        const dbUser = await prisma.user.create({
            data:{
                clerkId: userId,
                name: `${user.firstName || ""} ${user.lastName || ""}`,
                username : user.username ?? user.emailAddresses[0].emailAddress.split("@")[0],
                email: user.emailAddresses[0].emailAddress,
                image : user.imageUrl
            }
        })

        return dbUser;

    } catch (error) {
        console.log("error in sync user : " , error)
    }
}

export async function Getuser(clerkId : string) {
    try {
        return prisma.user.findUnique({
            where:{
                clerkId
            },
            include:{
                _count:{
                    select:{
                        followers:true,
                        following:true,
                        post:true
                    }
                }
            }
        })

    } catch (error) {
        console.log("error in get user : ",error);
    }
}

export async function getDbUser() {
    const {userId:clerkId} = await auth();
    if(!clerkId) throw new Error("unauthorized")

    const user = await Getuser(clerkId);

    if(!user) throw new Error("user is not found!");

    return user;
    
}