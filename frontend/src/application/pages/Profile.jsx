import { useMemo, useState } from "react";

import { usePreferences } from "../../preferences/PreferencesContext";
import AppIcon from "../components/AppIcon";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";

function Profile() {
    const { preferences, savePreferences } = usePreferences();
    const [draft, setDraft] = useState(preferences);
    const [saved, setSaved] = useState(false);
    const isDirty = useMemo(() => draft.displayName.trim() !== preferences.displayName || draft.theme !== preferences.theme, [draft, preferences]);

    const handleSave = () => {
        if (!isDirty || !draft.displayName.trim()) return;
        savePreferences({ displayName: draft.displayName.trim(), theme: draft.theme });
        setSaved(true);
        window.setTimeout(() => setSaved(false), 2400);
    };

    const saveButton = <button className="mda-workspace-primary-button" type="button" onClick={handleSave} disabled={!isDirty || !draft.displayName.trim()}><AppIcon name="check" size={17} /> Save Changes</button>;

    return (
        <section className="mda-app-page mda-workspace-page mda-profile-page">
            <PageHeader eyebrow="Profile" title="Profile" description="Manage your personal information and appearance." action={saveButton} />
            {saved && <div className="mda-profile-save-success" role="status"><AppIcon name="check" size={16} /> Changes saved successfully.</div>}
            <SectionCard eyebrow="Your details" title="Personal Information" description="The name displayed throughout your MDA workspace.">
                <div className="mda-profile-form">
                    <label><span>Display Name</span><input value={draft.displayName} onChange={(event) => { setSaved(false); setDraft((current) => ({ ...current, displayName: event.target.value })); }} /></label>
                    <label><span>Email</span><input value={draft.email} readOnly aria-readonly="true" /><small>Email editing will be available when authentication is connected.</small></label>
                </div>
            </SectionCard>
            <SectionCard eyebrow="Workspace comfort" title="Appearance" description="Choose a calm theme for long working sessions.">
                <fieldset className="mda-profile-theme-options"><legend>Theme</legend>
                    <label className={draft.theme === "soft-light" ? "is-selected" : ""}><input type="radio" name="theme" value="soft-light" checked={draft.theme === "soft-light"} onChange={(event) => { setSaved(false); setDraft((current) => ({ ...current, theme: event.target.value })); }} /><span className="mda-profile-theme-preview is-light"><i /><i /><i /></span><strong>☀️ Soft Light</strong><small>Warm, bright, and easy to scan.</small></label>
                    <label className={draft.theme === "soft-dark" ? "is-selected" : ""}><input type="radio" name="theme" value="soft-dark" checked={draft.theme === "soft-dark"} onChange={(event) => { setSaved(false); setDraft((current) => ({ ...current, theme: event.target.value })); }} /><span className="mda-profile-theme-preview is-dark"><i /><i /><i /></span><strong>🌙 Soft Dark</strong><small>Comfortable slate tones without pure black.</small></label>
                </fieldset>
            </SectionCard>
        </section>
    );
}

export default Profile;
