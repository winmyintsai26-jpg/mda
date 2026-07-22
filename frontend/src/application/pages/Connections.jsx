import AppIcon from "../components/AppIcon";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import { useDatabaseConnection } from "../../context/DatabaseConnectionContext";

function Connections() {
    const {
        connectionName,
        setConnectionName,
        connection,
        handleConnectionFieldChange,
        isConnecting,
        isConnected,
        connectionMessage,
        connectionError,
        databases,
        tables,
        selectedDatabase,
        selectedTable,
        testConnection,
        selectDatabase,
        selectTable
    } = useDatabaseConnection();

    return (
        <section className="mda-app-page mda-workspace-page">
            <PageHeader
                eyebrow="Connections"
                title="Database Connections"
                description="Configure the database once, test it, and reuse the selected destination during import."
            />

            <div className="mda-connection-summary">
                <span className={isConnected ? "is-connected" : "is-disconnected"}><i /> {isConnected ? "Connected" : "Not connected"}</span>
                <span>{selectedDatabase && selectedTable ? `${connectionName} → ${selectedTable}` : "No destination selected"}</span>
            </div>

            <article className="mda-connection-editor">
                <header>
                    <span className="mda-connection-mark is-mysql"><AppIcon name="connection" size={23} /></span>
                    <div>
                        <h2>{connectionName || "Database Connection"}</h2>
                        <p>Connection configuration and destination</p>
                    </div>
                    <div className="mda-connection-status">
                        <span>Connection status</span>
                        <StatusBadge status={isConnected ? "Connected" : "Disconnected"}>{isConnected ? "Connected" : "Disconnected"}</StatusBadge>
                    </div>
                </header>

                <div className="mda-connection-form">
                    <label>
                        <span>Connection name</span>
                        <input value={connectionName} onChange={(event) => setConnectionName(event.target.value)} placeholder="Production Database" />
                    </label>
                    <label>
                        <span>Host</span>
                        <input value={connection.host} onChange={(event) => handleConnectionFieldChange("host", event.target.value)} placeholder="localhost" />
                    </label>
                    <label>
                        <span>Username</span>
                        <input value={connection.username} onChange={(event) => handleConnectionFieldChange("username", event.target.value)} autoComplete="username" />
                    </label>

                    <details className="mda-connection-advanced">
                        <summary>Advanced connection settings</summary>
                        <div>
                            <label>
                                <span>Port</span>
                                <input value={connection.port} onChange={(event) => handleConnectionFieldChange("port", event.target.value)} inputMode="numeric" />
                            </label>
                            <label>
                                <span>Password</span>
                                <input type="password" value={connection.password} onChange={(event) => handleConnectionFieldChange("password", event.target.value)} autoComplete="current-password" />
                            </label>
                        </div>
                    </details>
                </div>

                <div className="mda-connection-test-row">
                    <button className="mda-workspace-primary-button" type="button" onClick={testConnection} disabled={isConnecting}>
                        <AppIcon name="test" size={17} /> {isConnecting ? "Testing..." : "Test Connection"}
                    </button>
                    {connectionMessage && <p className="is-success">{connectionMessage}</p>}
                    {connectionError && <p className="is-error">{connectionError}</p>}
                </div>

                {isConnected && (
                    <section className="mda-connection-destination" aria-labelledby="connection-destination-title">
                        <div>
                            <p>Reusable destination</p>
                            <h3 id="connection-destination-title">Choose where imported data will go</h3>
                        </div>
                        <div className="mda-connection-destination-fields">
                            <label>
                                <span>Database name</span>
                                <select value={selectedDatabase} onChange={(event) => selectDatabase(event.target.value)}>
                                    <option value="">Select database</option>
                                    {databases.map((database) => <option key={database} value={database}>{database}</option>)}
                                </select>
                            </label>
                            <label>
                                <span>Destination table</span>
                                <select value={selectedTable} onChange={(event) => selectTable(event.target.value)} disabled={!selectedDatabase}>
                                    <option value="">Select table</option>
                                    {tables.map((table) => <option key={table} value={table}>{table}</option>)}
                                </select>
                            </label>
                        </div>
                        {selectedDatabase && selectedTable && (
                            <p className="mda-connection-selected-destination"><strong>{connectionName || "Database Connection"}</strong><span aria-hidden="true">→</span><strong>{selectedTable}</strong></p>
                        )}
                    </section>
                )}
            </article>
        </section>
    );
}

export default Connections;
