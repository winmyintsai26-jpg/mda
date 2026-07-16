import { Link } from "react-router-dom";

import AuthField from "../components/AuthField";
import AuthLayout from "../components/AuthLayout";

function ForgotPassword() {
    return (
        <AuthLayout
            eyebrow="Account recovery"
            title="Reset your password"
            description="Enter your work email. Password recovery will connect to the authentication backend in a future task."
            alternateText="Remember your password?"
            alternateLabel="Return to login"
            alternateTo="/login"
        >
            <form className="mda-auth-form" onSubmit={(event) => event.preventDefault()}>
                <AuthField label="Work email" name="email" type="email" placeholder="you@company.com" autoComplete="email" />
                <button className="mda-auth-submit" type="submit">Send reset instructions</button>
                <div className="mda-auth-form-note"><span aria-hidden="true">i</span><p>This is a frontend preview. No email will be sent yet.</p></div>
                <Link className="mda-auth-back-link" to="/login">← Back to login</Link>
            </form>
        </AuthLayout>
    );
}

export default ForgotPassword;
