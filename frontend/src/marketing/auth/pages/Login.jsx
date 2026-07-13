import { useState } from "react";
import { useNavigate } from "react-router-dom";

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
    const [form, setForm] = useState({ email: "", password: "", remember: false });
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [status, setStatus] = useState("");

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

    const handleSubmit = (event) => {
        event.preventDefault();
        const validationErrors = validateLogin(form);
        setErrors(validationErrors);
        setTouched({ email: true, password: true });

        if (Object.keys(validationErrors).length > 0) {
            setStatus("");
            return;
        }

        navigate("/dashboard");
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
                    <label className="mda-auth-checkbox">
                        <input name="remember" type="checkbox" checked={form.remember} onChange={handleChange} />
                        <span>Remember me</span>
                    </label>
                    <button className="mda-auth-text-button" type="button" onClick={() => setStatus("Password recovery will be implemented with authentication.")}>Forgot password?</button>
                </div>

                <button className="mda-auth-submit" type="submit">Log in</button>

                {status && <p className="mda-auth-status" role="status">{status}</p>}
            </form>
        </AuthLayout>
    );
}

export default Login;
