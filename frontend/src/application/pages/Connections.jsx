import AppIcon from "../components/AppIcon";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";

const connections = [
    { name: "Production MySQL", type: "MySQL", status: "Connected", host: "operations-db · 3306", tone: "mysql" },
    { name: "Oracle ERP", type: "Oracle", status: "Connected", host: "erp-oracle · 1521", tone: "oracle" },
    { name: "Planning SQL Server", type: "SQL Server", status: "Disconnected", host: "planning-sql · 1433", tone: "sqlserver" },
    { name: "Quality PostgreSQL", type: "PostgreSQL", status: "Connected", host: "quality-db · 5432", tone: "postgres" }
];

function Connections() {
    return (
        <section className="mda-app-page mda-workspace-page">
            <PageHeader
                eyebrow="Connections"
                title="Database Connections"
                description="Manage where validated workbook data is imported."
                action={<button className="mda-workspace-primary-button" type="button"><AppIcon name="plus" size={18} /> New Connection</button>}
            />
            <div className="mda-connection-summary"><span><i /> 3 connected</span><span>4 configured destinations</span><small>Placeholder connection data</small></div>
            <div className="mda-connection-grid">
                {connections.map((connection) => (
                    <article className="mda-connection-card" key={connection.name}>
                        <header>
                            <span className={`mda-connection-mark is-${connection.tone}`}><AppIcon name="connection" size={23} /></span>
                            <StatusBadge status={connection.status}>{connection.status}</StatusBadge>
                        </header>
                        <div className="mda-connection-name"><h2>{connection.name}</h2><p>{connection.type}</p></div>
                        <dl><div><dt>Endpoint</dt><dd>{connection.host}</dd></div><div><dt>Usage</dt><dd>Workbook destinations</dd></div></dl>
                        <footer>
                            <button type="button"><AppIcon name="test" size={16} /> Test Connection</button>
                            <div><button type="button" aria-label={`Edit ${connection.name}`}><AppIcon name="edit" size={16} /></button><button className="is-danger" type="button" aria-label={`Delete ${connection.name}`}><AppIcon name="trash" size={16} /></button></div>
                        </footer>
                    </article>
                ))}
            </div>
        </section>
    );
}

export default Connections;
