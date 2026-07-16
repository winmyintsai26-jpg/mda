import AppIcon from "./AppIcon";

function OverviewCard({ detail, icon, label, tone = "blue", value }) {
    return (
        <article className={`mda-workspace-overview-card is-${tone}`}>
            <span><AppIcon name={icon} size={19} /></span>
            <small>{label}</small>
            <strong>{value}</strong>
            {detail && <p>{detail}</p>}
        </article>
    );
}

export default OverviewCard;
