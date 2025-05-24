"use server"

import prisma from "@/lib/prisma";
import { getDbUser } from "./user.action";

export async function getNotifications() {
    try {
        const userId = await getDbUser();
        if(!userId) return [];
    
        const notifications = await prisma.notification.findMany({
            where:{
                userId
            },
            include:{
                creator:{
                    select:{
                        id : true,
                        name : true,
                        username : true,
                        image : true
                    }
                },
                post:{
                    select:{
                        id: true,
                        image:true,
                        content:true
                    }
                },
                comment: {
                    select: {
                      id: true,
                      content: true,
                      createdAt: true,
                    },
                  },
            }, 
            orderBy:{
                createdAt:"desc"
            }
        })
    
        return notifications;
        
    } catch (error) {
        console.error("Failed to get all notifications:", error);
        throw new Error("Failed to fetch notifications");
    }
}

export async function markNotificationsAsRead(notificationId:string[]) {
    try {
        await prisma.notification.updateMany({
            where:{
                id:{
                    in:notificationId
                },
            },
            data:{
                read: true
            }
        })

        return {success : true}

    } catch (error) {
        console.error("Failed to markNotificationsAsRead:", error);
        return { success: false, error: "Failed to markNotificationsAsRead" };
    }
}