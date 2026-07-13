import { useState } from "react";

import AuthField from "../components/AuthField";
import AuthLayout from "../components/AuthLayout";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

const validateRegistration = (form) => {
    const errors = {};

    if (!form.firstName.trim()) errors.firstName = "First name is required.";
    if (!form.lastName.trim()) errors.lastName = "Last name is required.";

    if (!form.email.trim()) {
        errors.email = "Email is required.";
    } else if (!emailPattern.test(form.email.trim())) {
        errors.email = "Enter a valid email address.";
    }

    if (!form.password) {
        errors.password = "Password is required.";
    } else if (!passwordPattern.test(form.password)) {
        errors.password = "Use at least 8 characters with a letter and a number.";
    }

    if (!form.confirmPassword) {
        errors.confirmPassword = "Confirm your password.";
    } else if (form.confirmPassword !== form.password) {
        errors.confirmPassword = "Passwords do not match.";
    }

    if (!form.acceptTerms) {
        errors.acceptTerms = "You must accept the terms to continue.";
    }

    return errors;
};

function Register() {
    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
        acceptTerms: false
    });
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [status, setStatus] = useState("");

    const handleChange = (event) => {
        const { name, type, checked, value } = event.target;
        const nextForm = { ...form, [name]: type === "checkbox" ? checked : value };
        setForm(nextForm);
        setStatus("");

        if (touched[name] || (name === "password" && touched.confirmPassword)) {
            setErrors(validateRegistration(nextForm));
        }
    };

    const handleBlur = (event) => {
        setTouched((current) => ({ ...current, [event.target.name]: true }));
        setErrors(validateRegistration(form));
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        const validationErrors = validateRegistration(form);
        setErrors(validationErrors);
        setTouched({
            firstName: true,
            lastName: true,
            email: true,
            password: true,
            confirmPassword: true,
            acceptTerms: true
        });

        if (Object.keys(validationErrors).length > 0) {
            setStatus("");
            return;
        }

        setStatus("Registration UI is ready. Account creation will be connected in a future task.");
    };

    return (
        <AuthLayout
            eyebrow="Create your workspace"
            title="Get started with MDA"
            description="Set up your profile for the future MDA workspace."
            alternateText="Already have an account?"
            alternateLabel="Log in"
            alternateTo="/login"
        >
            <form className="mda-auth-form" onSubmit={handleSubmit} noValidate>
                <div className="mda-auth-field-row">
                    <AuthField
                        label="First name"
                        name="firstName"
                        value={form.firstName}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.firstName}
                        placeholder="First name"
                        autoComplete="given-name"
                    />
                    <AuthField
                        label="Last name"
                        name="lastName"
                        value={form.lastName}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.lastName}
                        placeholder="Last name"
                        autoComplete="family-name"
                    />
                </div>

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
                    hint="At least 8 characters with a letter and a number."
                    placeholder="Create a password"
                    autoComplete="new-password"
                />

                <AuthField
                    label="Confirm password"
                    name="confirmPassword"
                    type="password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.confirmPassword}
                    placeholder="Repeat your password"
                    autoComplete="new-password"
                />

                <div className={`mda-auth-terms ${errors.acceptTerms ? "has-error" : ""}`}>
                    <label className="mda-auth-checkbox">
                        <input name="acceptTerms" type="checkbox" checked={form.acceptTerms} onChange={handleChange} />
                        <span>I agree to the future MDA Terms of Service and Privacy Policy.</span>
                    </label>
                    {errors.acceptTerms && <p role="alert">{errors.acceptTerms}</p>}
                </div>

                <button className="mda-auth-submit" type="submit">Create account</button>

                {status && <p className="mda-auth-status" role="status">{status}</p>}
            </form>
        </AuthLayout>
    );
}

export default Register;
