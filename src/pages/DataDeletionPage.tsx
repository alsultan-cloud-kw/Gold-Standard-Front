export default function DataDeletionPage() {
  return (
    <div className="min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="gold-card space-y-6">
          <header className="space-y-2">
            <h1 className="text-3xl font-bold gold-gradient-text">Data Deletion Instructions</h1>
            <p className="text-sm text-gold-100/60">
              Effective date: April 8, 2026
            </p>
          </header>

          <section className="space-y-2 text-gold-100/85">
            <h2 className="text-lg font-semibold text-gold-100">1. How to Request Data Deletion</h2>
            <p>
              To request deletion of your account data, including WhatsApp-related communication records,
              send an email to <span className="text-gold-300">infosultangold@gmail.com</span> with the
              subject line <span className="text-gold-300">"Data Deletion Request"</span>.
            </p>
            <p>Please include the following in your request:</p>
            <ul className="list-disc ps-5 space-y-1">
              <li>your full name,</li>
              <li>registered email and/or phone number,</li>
              <li>details needed to verify account ownership.</li>
            </ul>
          </section>

          <section className="space-y-2 text-gold-100/85">
            <h2 className="text-lg font-semibold text-gold-100">2. Verification Process</h2>
            <p>
              For security and fraud prevention, we may request additional verification before processing
              deletion. If we cannot verify ownership, we may not be able to complete the request.
            </p>
          </section>

          <section className="space-y-2 text-gold-100/85">
            <h2 className="text-lg font-semibold text-gold-100">3. Deletion Timeline</h2>
            <p>
              Once verification is complete, we process deletion requests within a reasonable period,
              typically within 30 days, unless a longer retention period is required by law.
            </p>
          </section>

          <section className="space-y-2 text-gold-100/85">
            <h2 className="text-lg font-semibold text-gold-100">4. What Gets Deleted</h2>
            <ul className="list-disc ps-5 space-y-1">
              <li>account profile details maintained in this application,</li>
              <li>non-essential communication records linked to your account,</li>
              <li>other personal data that is not legally required to be retained.</li>
            </ul>
          </section>

          <section className="space-y-2 text-gold-100/85">
            <h2 className="text-lg font-semibold text-gold-100">5. Data That May Be Retained</h2>
            <p>
              We may retain certain records where required for legal, tax, accounting, security,
              fraud prevention, dispute resolution, or regulatory compliance.
            </p>
          </section>

          <section className="space-y-2 text-gold-100/85">
            <h2 className="text-lg font-semibold text-gold-100">6. Meta and WhatsApp Data</h2>
            <p>
              If your request relates to WhatsApp or Meta platform data, we will process the deletion
              request for data controlled by our application. Data controlled directly by Meta may also
              be subject to Meta&apos;s own data management and deletion processes.
            </p>
          </section>

          <section className="space-y-2 text-gold-100/85">
            <h2 className="text-lg font-semibold text-gold-100">7. Contact</h2>
            <p>
              For all deletion-related requests, contact:
              <span className="text-gold-300"> infosultangold@gmail.com</span>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
