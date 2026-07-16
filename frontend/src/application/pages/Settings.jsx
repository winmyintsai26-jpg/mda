import AppIcon from "../components/AppIcon";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";

function Toggle({ defaultChecked = false, description, label }) {
    return (
        <label className="mda-settings-toggle-row">
            <span><strong>{label}</strong><small>{description}</small></span>
            <input type="checkbox" defaultChecked={defaultChecked} />
        </label>
    );
}

function Settings() {
    return (
        <section className="mda-app-page mda-workspace-page">
            <PageHeader eyebrow="Workspace preferences" title="Settings" description="Prepare account and workspace preferences for future backend integration." />
            <div className="mda-settings-layout">
                <nav aria-label="Settings sections">
                    <a href="#profile"><AppIcon name="user" size={17} /> Profile</a>
                    <a href="#security"><AppIcon name="security" size={17} /> Security</a>
                    <a href="#appearance"><AppIcon name="appearance" size={17} /> Appearance</a>
                    <a href="#notifications"><AppIcon name="bell" size={17} /> Notifications</a>
                    <a href="#about"><AppIcon name="about" size={17} /> About</a>
                </nav>
                <div className="mda-settings-sections">
                    <SectionCard className="mda-settings-card" icon="user" title="Profile" description="Personal details shown in the workspace" >
                        <div className="mda-settings-form-grid" id="profile"><label><span>Display name</span><input defaultValue="MDA Workspace" /></label><label><span>Work email</span><input defaultValue="workspace@example.com" type="email" /></label><label className="is-wide"><span>Organization</span><input defaultValue="Manufacturing Operations" /></label></div>
                    </SectionCard>
                    <SectionCard className="mda-settings-card" icon="security" title="Security" description="Future sign-in and session preferences">
                        <div id="security"><Toggle defaultChecked label="Email verification" description="Require verification for future account changes" /><Toggle label="Two-factor authentication" description="Add an extra security step after backend integration" /></div>
                    </SectionCard>
                    <SectionCard className="mda-settings-card" icon="appearance" title="Appearance" description="Choose how your data workspace looks">
                        <div className="mda-settings-appearance" id="appearance"><button className="is-selected" type="button"><span className="is-light" />Light<small>Current MDA workspace</small></button><button type="button"><span className="is-system" />System<small>Follow device preference</small></button></div>
                    </SectionCard>
                    <SectionCard className="mda-settings-card" icon="bell" title="Notifications" description="Choose which future workspace events matter">
                        <div id="notifications"><Toggle defaultChecked label="Import completed" description="Notify when a workbook import finishes" /><Toggle defaultChecked label="Validation requires review" description="Notify when workbook data needs attention" /><Toggle label="Connection status changed" description="Notify when a destination becomes unavailable" /></div>
                    </SectionCard>
                    <SectionCard className="mda-settings-card" icon="about" title="About" description="Manufacturing Data Platform workspace information">
                        <div className="mda-settings-about" id="about"><span className="mda-app-logo" aria-hidden="true"><span /><span /><span /></span><div><strong>MDA Frontend Foundation</strong><p>Workbook-centered workspace · UI preview</p></div><b>Version 0.1</b></div>
                    </SectionCard>
                </div>
            </div>
        </section>
    );
}

export default Settings;
