import { createContext, useContext, useMemo, useState } from "react";
import { API_BASE_URL } from "../config/api";

/* eslint-disable react-refresh/only-export-components */

const DatabaseConnectionContext = createContext();

export function DatabaseConnectionProvider({ children }) {
    const [connectionName, setConnectionName] = useState("Production Database");
    const [connection, setConnection] = useState({
        host: "localhost",
        port: "3306",
        username: "",
        password: ""
    });
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectionMessage, setConnectionMessage] = useState("");
    const [connectionError, setConnectionError] = useState("");
    const [isConnected, setIsConnected] = useState(false);
    const [databases, setDatabases] = useState([]);
    const [tables, setTables] = useState([]);
    const [schema, setSchema] = useState([]);
    const [selectedDatabase, setSelectedDatabase] = useState("");
    const [selectedTable, setSelectedTable] = useState("");

    const requestBody = useMemo(() => ({
        host: connection.host,
        port: Number(connection.port || 3306),
        username: connection.username,
        password: connection.password
    }), [connection.host, connection.password, connection.port, connection.username]);

    const handleConnectionFieldChange = (field, value) => {
        setConnection((current) => ({ ...current, [field]: value }));
        setIsConnected(false);
        setConnectionMessage("");
        setConnectionError("");
        setSelectedDatabase("");
        setSelectedTable("");
        setDatabases([]);
        setTables([]);
        setSchema([]);
    };

    const testConnection = async () => {
        if (isConnecting) return;

        setIsConnecting(true);
        setConnectionError("");
        setConnectionMessage("");
        setIsConnected(false);
        setSelectedDatabase("");
        setSelectedTable("");
        setDatabases([]);
        setTables([]);
        setSchema([]);

        try {
            const connectionResponse = await fetch(`${API_BASE_URL}/database/mysql/test-connection`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody)
            });
            const connectionPayload = await connectionResponse.json();
            if (!connectionResponse.ok) {
                throw new Error(connectionPayload.message || connectionPayload.Message || "Unable to connect to MySQL.");
            }

            const databasesResponse = await fetch(`${API_BASE_URL}/database/mysql/databases`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody)
            });
            const databasesPayload = await databasesResponse.json();
            if (!databasesResponse.ok) {
                throw new Error(databasesPayload.message || "Unable to load databases.");
            }

            setDatabases(databasesPayload);
            setIsConnected(true);
            setConnectionMessage(connectionPayload.message || connectionPayload.Message || "Connection successful.");
        } catch (error) {
            setConnectionError(error.message || "Unable to connect to MySQL.");
        } finally {
            setIsConnecting(false);
        }
    };

    const selectDatabase = async (database) => {
        setSelectedDatabase(database);
        setSelectedTable("");
        setTables([]);
        setSchema([]);
        setConnectionError("");

        if (!database) return;

        try {
            const response = await fetch(`${API_BASE_URL}/database/mysql/tables`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...requestBody, database })
            });
            const payload = await response.json();
            if (!response.ok) throw new Error(payload.message || "Unable to load tables.");
            setTables(payload);
        } catch (error) {
            setConnectionError(error.message || "Unable to load tables.");
        }
    };

    const selectTable = async (table) => {
        setSelectedTable(table);
        setSchema([]);
        setConnectionError("");

        if (!table || !selectedDatabase) return;

        try {
            const response = await fetch(`${API_BASE_URL}/database/mysql/schema`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...requestBody, database: selectedDatabase, table })
            });
            const payload = await response.json();
            if (!response.ok) throw new Error(payload.message || "Unable to load schema.");
            setSchema(payload);
        } catch (error) {
            setConnectionError(error.message || "Unable to load schema.");
        }
    };

    const value = {
        connectionName,
        setConnectionName,
        connection,
        handleConnectionFieldChange,
        requestBody,
        isConnecting,
        isConnected,
        connectionMessage,
        connectionError,
        databases,
        tables,
        schema,
        selectedDatabase,
        selectedTable,
        testConnection,
        selectDatabase,
        selectTable
    };

    return <DatabaseConnectionContext.Provider value={value}>{children}</DatabaseConnectionContext.Provider>;
}

export function useDatabaseConnection() {
    return useContext(DatabaseConnectionContext);
}
