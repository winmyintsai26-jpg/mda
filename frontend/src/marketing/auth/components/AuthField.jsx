import { useState } from "react";

function AuthField({ label, name, type = "text", value, onChange, onBlur, error, hint, ...inputProps }) {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const isPassword = type === "password";
    const inputType = isPassword && isPasswordVisible ? "text" : type;
    const messageId = `${name}-${error ? "error" : "hint"}`;

    return (
        <div className={`mda-auth-field ${error ? "has-error" : ""}`}>
            <label htmlFor={name}>{label}</label>
            <div className="mda-auth-input-wrap">
                <input
                    id={name}
                    name={name}
                    type={inputType}
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    aria-invalid={Boolean(error)}
                    aria-describedby={(error || hint) ? messageId : undefined}
                    {...inputProps}
                />
                {isPassword && (
                    <button
                        className="mda-auth-password-toggle"
                        type="button"
                        onClick={() => setIsPasswordVisible((current) => !current)}
                        aria-label={isPasswordVisible ? "Hide password" : "Show password"}
                    >
                        {isPasswordVisible ? "Hide" : "Show"}
                    </button>
                )}
            </div>
            {error ? (
                <p className="mda-auth-field-message mda-auth-field-error" id={messageId} role="alert">{error}</p>
            ) : hint ? (
                <p className="mda-auth-field-message" id={messageId}>{hint}</p>
            ) : null}
        </div>
    );
}

export default AuthField;
