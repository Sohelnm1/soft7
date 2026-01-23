"use client";
import Image from "next/image";
import { RiCheckLine, RiCheckDoubleLine } from "@remixicon/react";
import { Tooltip } from 'react-tooltip'
import { useState } from "react";

type NotificationItemProps = {
    name: string,
    datetime: string | null | undefined,
    message: string,
    image?: string | null,
} 


export default function NotificationsItem({name, datetime, message, image}: NotificationItemProps) {
    const date  = datetime ? new Date(datetime) : null;
    const isValidDate = date && !isNaN(date.getTime())
    const altName = name || "User";
    const imageUrl = image || "https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png";
    const readNotifications = false
    const [read, setRead] = useState(readNotifications) // Placeholder for read status
    return (
        <div className="message-grid">
            <div className="pfp message-grid-1">
                <Image
                src={imageUrl}
                alt={altName}
                width={100}
                height={100}
                >

                </Image>
            </div>
            <div className="name message-grid-2">{name}</div>
            {isValidDate && (
                <div className="datetime message-grid-3">{date.toDateString()}</div>
            )}
            <div className="message-grid-4">
                <Tooltip anchorSelect=".my-anchor-element" place="top">
                    Mark as read
                </Tooltip>  
                {read ? (
                    <RiCheckDoubleLine 
                             className="my-tooltip text-blue-500 h-4 w-4" />
                ): (
                    <a 
                    onClick={() => setRead(true)}
                    className="my-anchor-element">
                        <RiCheckLine className="text-gray-400 h-4 w-4" />  
                    </a>
                )}
            </div>
            <div className="msg-content message-grid-5">
                <div>
                      {message}
                </div>
            </div>  
        </div>
    )
}