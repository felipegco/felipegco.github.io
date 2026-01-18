export default function TechBadge({ name }) {
    return (
        <span
            className="rounded-md border border-transparent px-3 py-1.5 font-mono text-xs transition-all duration-300 hover:border-blue-500 hover:text-blue-500 cursor-default"
            style={{
                backgroundColor: 'var(--card-bg-secondary)',
                color: 'var(--text-secondary)'
            }}
        >
            {name}
        </span>
    );
}