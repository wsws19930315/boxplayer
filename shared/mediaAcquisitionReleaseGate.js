function beijingCalendarDate(now) {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
    const value = (type) => parts.find(part => part.type === type)?.value || '';
    return `${value('year')}-${value('month')}-${value('day')}`;
}
function validReleaseDate(releaseDate) {
    const date = releaseDate?.slice(0, 10);
    return date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined;
}
export function isMediaAcquisitionMovieUnreleased(releaseDate, now = new Date()) {
    const date = validReleaseDate(releaseDate);
    return !!date && date > beijingCalendarDate(now);
}
export function mediaAcquisitionReleaseAt(releaseDate) {
    const date = validReleaseDate(releaseDate);
    return date ? Date.parse(`${date}T00:00:00+08:00`) : undefined;
}
