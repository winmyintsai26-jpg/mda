import { useState } from "react";
import { useLocation } from "react-router-dom";

import { resendVerification } from "../../../auth/authClient.js";
import AuthLayout from "../components/AuthLayout";

function CheckEmail() {
    const location = useLocation();
    const email = location.state?.email || "your email address";
    const [status, setStatus] = useState(location.state?.deliveryFailed
        ? "The first email could not be delivered. Check the email service configuration, then resend."
        : "");
    const [isResending, setIsResending] = useState(false);

    const handleResend = async () => {
        if (!location.state?.email) {
            setStatus("Return to registration or login and enter your email again.");
            return;
        }
        setIsResending(true);
        setStatus("");
        try {
            const result = await resendVerification(location.state.email);
            setStatus(result.message);
        } catch (error) {
            setStatus(error.message || "Unable to request another email. Please try again.");
        } finally {
            setIsResending(false);
        }
    };

    return (
        <AuthLayout
            eyebrow="Email verification"
            title="Check your email"
            description="Verify your email before signing in to MDA."
            alternateText="Already verified?"
            alternateLabel="Log in"
            alternateTo="/login"
        >
            <div className="mda-auth-verification">
                <div className="mda-auth-verification-icon" aria-hidden="true">✉</div>
                <p>We&apos;ve sent a verification email to:</p>
                <strong>{email}</strong>
                <p className="mda-auth-verification-note">The link expires in 24 hours and can only be used once.</p>
                <button className="mda-auth-secondary" type="button" disabled={isResending} onClick={handleResend}>
                    {isResending ? "Sending…" : "Resend Email"}
                </button>
                {status && <p className="mda-auth-status" role="status">{status}</p>}
            </div>
        </AuthLayout>
    );
}

export default CheckEmail;
