import { buildIcsCalendar } from "@/lib/calendar-feed";
import { Event } from "@/types/database";

function formatDate(date: Date): string {
    return date.toISOString().replace(/-|:|\.\d\d\d/g, "");
}

export function getGoogleCalendarUrl(event: Event) {
    const start = new Date(event.start_time);
    const end = event.end_time
        ? new Date(event.end_time)
        : new Date(start.getTime() + 60 * 60 * 1000); // Default 1 hour

    const params = new URLSearchParams({
        action: "TEMPLATE",
        text: event.title,
        details: event.description || "",
        location: event.location || event.meeting_link || "Online",
        dates: `${formatDate(start)}/${formatDate(end)}`,
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function getOutlookCalendarUrl(event: Event) {
    const start = new Date(event.start_time);
    const end = event.end_time
        ? new Date(event.end_time)
        : new Date(start.getTime() + 60 * 60 * 1000);

    const params = new URLSearchParams({
        path: "/calendar/action/compose",
        rru: "addevent",
        startdt: start.toISOString(),
        enddt: end.toISOString(),
        subject: event.title,
        body: event.description || "",
        location: event.location || event.meeting_link || "Online",
    });

    return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

export function downloadIcsFile(event: Event) {
    const start = new Date(event.start_time);
    const end = event.end_time
        ? new Date(event.end_time)
        : new Date(start.getTime() + 60 * 60 * 1000);

    const icsContent = buildIcsCalendar({
        name: event.title,
        prodId: "-//SAPIHUM//Single Event//ES",
        events: [
            {
                uid: `${event.id}@comunidadpsicologia.com`,
                title: event.title,
                start,
                end,
                description: event.description || "",
                location: event.location || event.meeting_link || "Online",
                url: event.meeting_link || undefined,
            },
        ],
    });

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${event.title.replace(/\s+/g, "_")}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
