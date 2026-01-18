export default function StatusBadge({ status, dict }) {
    if (!status || !dict || !dict.badges) return null;

    const statusStyles = {
        [dict.badges.concluded]: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        [dict.badges.developing]: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        [dict.badges.updating]: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        [dict.badges.archived]: "bg-neutral-500/10 text-neutral-400 border-neutral-500/20"
    };

    //Fallback
    const badgeStyle = statusStyles[status] || "bg-neutral-500/10 text-neutral-400 border-neutral-500/20";

    return (
        <span className={`text-[10px] font-mono uppercase tracking-wider font-semibold px-2.5 py-1 rounded-full border ${badgeStyle}`}>
            {status}
        </span>
    );
}