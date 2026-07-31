import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { apiFetch, loginAccount, registerAccount, resendVerification, verifyEmail } from "../src/auth/authClient.js";

function jsonResponse(payload, status = 200) {
    return new Response(JSON.stringify(payload), {
        status,
        headers: { "Content-Type": "application/json" }
    });
}

test("authenticated API requests attach JWTs and retry once after automatic refresh", async () => {
    const originalFetch = globalThis.fetch;
    const requests = [];
    const sessions = [
        { accessToken: "access-one", user: { id: "user-1", email: "sai@example.com", displayName: "Sai" } },
        { accessToken: "access-two", user: { id: "user-1", email: "sai@example.com", displayName: "Sai" } }
    ];

    globalThis.fetch = async (url, options = {}) => {
        requests.push({ url: String(url), options });
        if (String(url).endsWith("/auth/login")) return jsonResponse(sessions[0]);
        if (String(url).endsWith("/auth/refresh")) return jsonResponse(sessions[1]);
        const authorization = new Headers(options.headers).get("Authorization");
        if (authorization === "Bearer access-one") return jsonResponse({ message: "Expired" }, 401);
        return jsonResponse({ ok: true });
    };

    try {
        await loginAccount({ email: "sai@example.com", password: "Password1" });
        const response = await apiFetch("/analyze", { method: "POST" });
        assert.equal(response.status, 200);
        assert.equal(new Headers(requests[1].options.headers).get("Authorization"), "Bearer access-one");
        assert.match(requests[2].url, /\/auth\/refresh$/);
        assert.equal(requests[2].options.credentials, "include");
        assert.equal(new Headers(requests[3].options.headers).get("Authorization"), "Bearer access-two");
    } finally {
        globalThis.fetch = originalFetch;
    }
});

test("authentication uses guarded routes, HttpOnly refresh cookies, and ASP.NET password hashing", async () => {
    const [app, authClient, program, controller, authService, model, project] = await Promise.all([
        readFile(new URL("../src/App.jsx", import.meta.url), "utf8"),
        readFile(new URL("../src/auth/authClient.js", import.meta.url), "utf8"),
        readFile(new URL("../../backend/MDA.API/Program.cs", import.meta.url), "utf8"),
        readFile(new URL("../../backend/MDA.API/Authentication/Controllers/AuthController.cs", import.meta.url), "utf8"),
        readFile(new URL("../../backend/MDA.API/Authentication/Services/AuthService.cs", import.meta.url), "utf8"),
        readFile(new URL("../../backend/MDA.API/Authentication/Models/RefreshToken.cs", import.meta.url), "utf8"),
        readFile(new URL("../../backend/MDA.API/MDA.API.csproj", import.meta.url), "utf8")
    ]);

    assert.match(app, /ProtectedRoute/);
    assert.match(app, /PublicOnlyRoute/);
    assert.match(program, /AddAuthentication\(JwtBearerDefaults\.AuthenticationScheme\)/);
    assert.match(program, /RequireAuthorization\(\)/);
    assert.match(program, /Database\.MigrateAsync\(\)/);
    assert.match(controller, /HttpOnly = true/);
    assert.match(controller, /HttpPost\("refresh"\)/);
    assert.match(controller, /HttpGet\("me"\)/);
    assert.match(authService, /IPasswordHasher<User>/);
    assert.match(authService, /VerifyHashedPassword/);
    assert.match(model, /TokenHash/);
    assert.match(project, /Microsoft\.EntityFrameworkCore\.Sqlite/);
    assert.doesNotMatch(authClient, /localStorage|sessionStorage/);
    assert.doesNotMatch(authService, /MD5|SHA256.*Password|plaintext/i);
});

test("registration requires email verification and never creates a browser session", async () => {
    const originalFetch = globalThis.fetch;
    const requests = [];
    globalThis.fetch = async (url, options = {}) => {
        requests.push({ url: String(url), options });
        if (String(url).includes("verify-email?")) return jsonResponse({ message: "Email verified." });
        if (String(url).endsWith("/auth/resend-verification")) return jsonResponse({ message: "If an account exists, an email was sent." }, 202);
        return jsonResponse({ email: "sai@example.com", message: "Check your email." }, 202);
    };

    try {
        const registration = await registerAccount({ displayName: "Sai", email: "sai@example.com", password: "Password1" });
        assert.equal(registration.email, "sai@example.com");
        await resendVerification("sai@example.com");
        await verifyEmail("raw-verification-token");
        assert.match(requests[0].url, /\/auth\/register$/);
        assert.match(requests[1].url, /\/auth\/resend-verification$/);
        assert.match(requests[2].url, /\/auth\/verify-email\?token=raw-verification-token$/);
        assert.equal(new Headers(requests[0].options.headers).get("Authorization"), null);
    } finally {
        globalThis.fetch = originalFetch;
    }
});

test("email verification is hashed, one-time, expiring, non-enumerating, and provider-isolated", async () => {
    const [service, tokenService, controller, model, emailSender, options, template, app] = await Promise.all([
        readFile(new URL("../../backend/MDA.API/Authentication/Services/AuthService.cs", import.meta.url), "utf8"),
        readFile(new URL("../../backend/MDA.API/Authentication/Services/EmailVerificationTokenService.cs", import.meta.url), "utf8"),
        readFile(new URL("../../backend/MDA.API/Authentication/Controllers/AuthController.cs", import.meta.url), "utf8"),
        readFile(new URL("../../backend/MDA.API/Authentication/Models/EmailVerificationToken.cs", import.meta.url), "utf8"),
        readFile(new URL("../../backend/MDA.API/Authentication/Services/IEmailSender.cs", import.meta.url), "utf8"),
        readFile(new URL("../../backend/MDA.API/appsettings.json", import.meta.url), "utf8"),
        readFile(new URL("../../backend/MDA.API/Authentication/Templates/VerifyEmail.html", import.meta.url), "utf8"),
        readFile(new URL("../src/App.jsx", import.meta.url), "utf8")
    ]);

    assert.match(tokenService, /RandomNumberGenerator\.GetBytes\(64\)/);
    assert.match(tokenService, /SHA256\.HashData/);
    assert.match(model, /UsedAt/);
    assert.match(service, /EmailVerificationRequired/);
    assert.match(service, /AddHours\(emailOptions\.Value\.VerificationTokenHours\)/);
    assert.match(controller, /HttpPost\("resend-verification"\)/);
    assert.match(controller, /HttpGet\("verify-email"\)/);
    assert.match(controller, /HttpGet\("verification-status"\)/);
    assert.match(controller, /If an unverified account exists/);
    assert.match(emailSender, /interface IEmailSender/);
    assert.doesNotMatch(options, /re_[A-Za-z0-9]/);
    assert.match(template, /Verify Email/);
    assert.match(template, /\{\{VERIFY_URL\}\}/);
    assert.match(app, /path="\/check-email"/);
    assert.match(app, /path="\/verify-email"/);
});

test("browser-owned MDA metadata is explicitly scoped by authenticated user id", async () => {
    const [workbooks, layouts, preferences, ownership] = await Promise.all([
        readFile(new URL("../src/workbooks/WorkbookContext.jsx", import.meta.url), "utf8"),
        readFile(new URL("../src/saved-layouts/services/savedLayoutService.js", import.meta.url), "utf8"),
        readFile(new URL("../src/preferences/PreferencesContext.jsx", import.meta.url), "utf8"),
        readFile(new URL("../../backend/MDA.API/Authentication/Models/IUserOwnedEntity.cs", import.meta.url), "utf8")
    ]);

    assert.match(workbooks, /userId/);
    assert.match(layouts, /requireCurrentUserId/);
    assert.match(preferences, /ownerId/);
    assert.match(ownership, /Guid UserId/);
});
