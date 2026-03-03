export const metadata = {
  title: "Privacy Policy — Spara",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-2xl font-semibold tracking-tight mb-2">
          Privacy Policy
        </h1>
        <p className="text-sm text-muted-foreground mb-10">
          Last updated: March 2, 2026
        </p>

        <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-base font-medium text-foreground mb-2">
              What Spara does
            </h2>
            <p>
              Spara is a link-saving service. You can save URLs, organize them
              with tags, and access them from any device. Spara is available as a
              web app and a Chrome extension.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-foreground mb-2">
              Data we collect
            </h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong className="text-foreground">Account information</strong>{" "}
                — your email address, used for authentication.
              </li>
              <li>
                <strong className="text-foreground">Saved links</strong> — the
                URLs, titles, tags, and thumbnail images associated with links
                you save.
              </li>
              <li>
                <strong className="text-foreground">
                  Authentication tokens
                </strong>{" "}
                — stored locally in your browser to keep you signed in.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-medium text-foreground mb-2">
              How we store your data
            </h2>
            <p>
              Your data is stored securely using Supabase, a hosted database
              platform. Authentication tokens are stored locally in your browser
              and are never shared with third parties.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-foreground mb-2">
              Google OAuth
            </h2>
            <p>
              If you sign in with Google, we receive your email address and
              basic profile information from Google. We do not access your
              Google contacts, files, or any other Google services.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-foreground mb-2">
              Chrome extension
            </h2>
            <p>The Spara Chrome extension requests the following permissions:</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>
                <strong className="text-foreground">activeTab</strong> — to read
                the URL and title of the page you are saving.
              </li>
              <li>
                <strong className="text-foreground">storage</strong> — to store
                your authentication session locally.
              </li>
              <li>
                <strong className="text-foreground">identity</strong> — to
                support Google sign-in within the extension.
              </li>
            </ul>
            <p className="mt-2">
              The extension only accesses page information when you actively
              click the Spara icon to save a link. It does not run in the
              background or track your browsing activity.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-foreground mb-2">
              Third parties
            </h2>
            <p>
              We do not sell, share, or transfer your personal data to third
              parties. Your saved links and account information are only
              accessible to you.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-foreground mb-2">
              Data deletion
            </h2>
            <p>
              You can delete your saved links at any time from the Spara app. To
              delete your account and all associated data, contact us through the
              Spara website.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-foreground mb-2">
              Changes to this policy
            </h2>
            <p>
              We may update this privacy policy from time to time. Any changes
              will be reflected on this page with an updated date.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
