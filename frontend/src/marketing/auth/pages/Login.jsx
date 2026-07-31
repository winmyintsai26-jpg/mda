import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../../../auth/AuthContext.jsx";
import AuthField from "../components/AuthField";
import AuthLayout from "../components/AuthLayout";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateLogin = ({ email, password }) => {
    const errors = {};

    if (!email.trim()) {
        errors.email = "Email is required.";
    } else if (!emailPattern.test(email.trim())) {
        errors.email = "Enter a valid email address.";
    }

    if (!password) {
        errors.password = "Password is required.";
    }

    return errors;
};

function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    const [form, setForm] = useState({ email: "", password: "" });
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [status, setStatus] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (event) => {
        const { name, type, checked, value } = event.target;
        const nextForm = { ...form, [name]: type === "checkbox" ? checked : value };
        setForm(nextForm);
        setStatus("");
        if (touched[name]) {
            setErrors(validateLogin(nextForm));
        }
    };

    const handleBlur = (event) => {
        setTouched((current) => ({ ...current, [event.target.name]: true }));
        setErrors(validateLogin(form));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const validationErrors = validateLogin(form);
        setErrors(validationErrors);
        setTouched({ email: true, password: true });

        if (Object.keys(validationErrors).length > 0) {
            return;
        }

        setIsSubmitting(true);
        setStatus("");
        try {
            await login({ email: form.email.trim(), password: form.password });
            navigate(location.state?.from || "/dashboard", { replace: true });
        } catch (error) {
            if (error.code === "email_verification_required") {
                navigate("/check-email", { state: { email: form.email.trim() } });
                return;
            }
            setStatus(error.message || "Unable to log in. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AuthLayout
            eyebrow="Welcome back"
            title="Log in to MDA"
            description="Continue to your manufacturing data workspace."
            alternateText="New to MDA?"
            alternateLabel="Create an account"
            alternateTo="/register"
        >
            <form className="mda-auth-form" onSubmit={handleSubmit} noValidate>
                <AuthField
                    label="Work email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.email}
                    placeholder="you@company.com"
                    autoComplete="email"
                />

                <AuthField
                    label="Password"
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.password}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                />

                <div className="mda-auth-form-options">
                    <span />
                    <Link className="mda-auth-text-button" to="/forgot-password">Forgot password?</Link>
                </div>

                <button className="mda-auth-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? "Logging in…" : "Log in"}</button>

                {status && <p className="mda-auth-status is-error" role="alert">{status}</p>}
            </form>
        </AuthLayout>
    );
}

export default Login;
