'use client';

import { useState, useEffect, useRef } from 'react';
import '../../../styles/notifications.css';
import NotificationsItem from './NotificationsItem';
import { format } from 'date-fns';
import RiAddCircleFill from 'remixicon-react/AddCircleFillIcon';
import useSWR from 'swr';
import { isLabelContentAFunction } from 'recharts/types/component/Label';


interface User {
  image?: string;
}

interface NotificationItem {
  id: string; // required for stable keys
  title: string;
  message: string;
  createdAt: string; // ISO string
  user?: User;
}

interface NotificationsProps {
  cnt: React.Dispatch<React.SetStateAction<number>>;
}

const LOAD_MORE = 3;

const postNotification= async (e: React.FormEvent<HTMLFormElement>) =>{
  e.preventDefault();
  // all the form content is in e.currentTarget
  const formData = new FormData(e.currentTarget);
  const title = formData.get('title') as string;
  const message = formData.get('message') as string;

  try{
    const res = await fetch('/api/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({title, message}),
      credentials: 'include',
    })


      if(res.ok){
        const result = await res.json();
        console.log("User Created:", result);
      }
  } catch(err){
    console.error("Error creating notification:", err);
  }

}

const fetcher = (url: string) => fetch(url, {
  credentials: 'include',
}).then(res => res.json())
  .then(j => j.data as NotificationItem[])
;

const getNotifications = (cnt: React.Dispatch<React.SetStateAction<number>>)=>{
  const {data, error, isLoading} = useSWR<NotificationItem[]>("/api/notifications", fetcher)

  cnt(data ? data.length : 0)
  
  return {
    notifications: data || [],
    isLoading,
    isError: error,
  }
}

export default function Notifications({ cnt }: NotificationsProps) {
  const [visibleCount, setVisibleCount] = useState(LOAD_MORE);
  const [isFormOpen, setCreateFormOpen] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);
  const { notifications, isLoading, isError } =  getNotifications(cnt);

  // ---- Infinite scroll observer ----
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && visibleCount < notifications.length) {
          setVisibleCount((prev) =>
            Math.min(prev + LOAD_MORE, notifications.length)
          );
        }
      },
      { rootMargin: '100px' }
    );

    if (loaderRef.current) observer.observe(loaderRef.current);

    return () => observer.disconnect();
  }, [visibleCount, notifications.length]);

  const visible = notifications.slice(0, visibleCount);
  return (
    <div className="notifications-wrapper">
      {/* Header */}
      <div className="heading">
        <h1>Notifications</h1>
        <RiAddCircleFill
          color="#776AFF"
          style={{ cursor: 'pointer' }}
          onClick={() => setCreateFormOpen((v) => !v)}
        />
      </div>

      {/* Create Form */}
      {isFormOpen && (
        <div className="create-notification-form">
          <h2>Create New Notification</h2>
          <form
            onSubmit={(e) => {
              postNotification(e);
            }}
          >
            <div className="form-group">
              <label htmlFor="title">Title:</label>
              <input id="title" type="text" name="title" />
            </div>

            <div className="form-group">
              <label htmlFor="message">Message:</label>
              <textarea id="message" name="message" rows={3} />
            </div>

            <button type="submit">Create</button>
          </form>
        </div>
      )}

      {/* Notifications List */}
      <div className="notifications-tabs">
        <div className="messages">
          {visible.length > 0 ? (
            <>
              {visible.map((msg : any) => (
                <NotificationsItem
                  key={msg.id} // stable key
                  name={msg.title}
                  datetime={msg.createdAt}
                  message={msg.message}
                  image={msg.user?.image}
                />
              ))}

              {visibleCount < notifications.length && (
                <div ref={loaderRef} className="loader">
                  Loading more…
                </div>
              )}
            </>
          ) : (
            <div className="no-notifications">
              No notifications available.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}