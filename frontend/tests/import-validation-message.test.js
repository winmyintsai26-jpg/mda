import assert from "node:assert/strict";
import test from "node:test";

import { COLUMN_NAMES_MUST_MATCH_MESSAGE, simplifyImportError } from "../src/utils/importValidationMessage.js";

test("column mapping failures use one simple import warning", () => {
    const technicalMessages = [
        "No preview columns match the selected MySQL table schema.",
        "Import cannot start because required destination columns are missing from the mapping: OrderNo.",
        "Import mapping is ambiguous because multiple preview headers normalize to the same key."
    ];

    technicalMessages.forEach((message) => {
        assert.equal(simplifyImportError(message), COLUMN_NAMES_MUST_MATCH_MESSAGE);
    });
});

test("unrelated import errors retain their useful message", () => {
    assert.equal(simplifyImportError("Unable to connect to MySQL."), "Unable to connect to MySQL.");
    assert.equal(simplifyImportError(""), "Import failed.");
});
