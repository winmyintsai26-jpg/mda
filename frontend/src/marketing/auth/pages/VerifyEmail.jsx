import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { verifyEmail } from "../../../auth/authClient.js";
import AuthLayout from "../components/AuthLayout";

const states = {
    checking: { symbol: "…", title: "Verifying your email", message: "Please wait while MDA checks your verification link." },
    success: { symbol: "✓", title: "Verification successful", message: "Your email is verified. You can now sign in to MDA." },
    expired_token: { symbol: "!", title: "Expired link", message: "This verification link has expired. Return to login to request another email." },
    used_token: { symbol: "!", title: "Link already used", message: "This verification link has already been used. Try signing in." },
    invalid_token: { symbol: "×", title: "Invalid link", message: "This verification link is invalid or incomplete." },
    error: { symbol: "×", title: "Unable to verify", message: "MDA could not verify this link. Please try again." }
};

function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const [result, setResult] = useState(token ? "checking" : "invalid_token");

    useEffect(() => {
        let active = true;
        if (!token) return () => { active = false; };
        verifyEmail(token)
            .then(() => { if (active) setResult("success"); })
            .catch((error) => { if (active) setResult(states[error.code] ? error.code : "error"); });
        return () => { active = false; };
    }, [token]);

    const view = states[result];
    return (
        <AuthLayout
            eyebrow="Email verification"
            title={view.title}
            description={view.message}
            alternateText="Return to"
            alternateLabel="Log in"
            alternateTo="/login"
        >
            <div className={`mda-auth-verification-result is-${result}`} role="status">
                <span aria-hidden="true">{view.symbol}</span>
                {result === "checking" ? <p>Checking link…</p> : <Link className="mda-auth-submit" to="/login">Go to Login</Link>}
            </div>
        </AuthLayout>
    );
}

export default VerifyEmail;
