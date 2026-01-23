"user client"
import { useState } from "react"

export default function Userlogo({ name, photo }: { name: string; photo?: string }) {
    const [imgError, setImgError] = useState(false);
    const initial = name.charAt(0).toUpperCase();

    return (
        <div className="flex items-center space-x-4">
            {photo && !imgError ? (
                <img
                    src={photo}
                    alt={name}
                    onError={() => setImgError(true)}
                    className="h-8 w-8 rounded-full object-cover"
                />
            ) : (
        <div className="h-8 w-8 rounded-full bg-blue-500 text-white flex items-center justify-center">
                    {initial}
                </div>
            )}
            <span className="hidden md:inline text-gray-700 font-medium">{name}</span>
        </div>
    );
}
