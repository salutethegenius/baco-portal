import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Privacy() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Privacy Notice – BACO Portal
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Last updated: January 2026
            </p>
          </div>
          <Link href="/">
            <Button variant="outline" size="sm" className="text-xs">
              Back to homepage
            </Button>
          </Link>
        </div>

        <div className="space-y-6 text-sm text-gray-800 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold mb-2">1. Who we are</h2>
            <p>
              The BACO Portal is operated by the Bahamas Association of
              Compliance Officers (&quot;BACO&quot;, &quot;we&quot;, &quot;us&quot;,
              &quot;our&quot;). For the purposes of the Data Protection (Privacy of
              Personal Information) Act, 2003 of The Bahamas, BACO is the{" "}
              <strong>data controller</strong> for the personal data processed
              through this portal.
            </p>
            <p className="mt-2">
              Contact for privacy matters (Data Protection Contact):
            </p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Email: bacobahamas@gmail.com</li>
              <li>Subject line: &quot;BACO Portal – Data Protection&quot;</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">
              2. What personal data we collect
            </h2>
            <p>We collect and process the following categories of data:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>
                <strong>Identification and contact data</strong> – name, email
                address, phone numbers, postal addresses.
              </li>
              <li>
                <strong>Professional and membership data</strong> – job title,
                employer, years of experience, qualifications, professional
                memberships, membership type and status, membership number.
              </li>
              <li>
                <strong>Account and usage data</strong> – login details (email,
                hashed password), profile preferences, events you view or
                register for, messages exchanged with administrators, documents
                you upload.
              </li>
              <li>
                <strong>Payment and billing data</strong> – amounts paid,
                payment status, invoice details, and high-level payment method
                information. We do <strong>not</strong> store full card
                numbers; card data is processed by our payment providers.
              </li>
              <li>
                <strong>Documents and uploads</strong> – copies of certificates,
                identification documents, receipts and other professional or
                supporting documents you choose to upload.
              </li>
              <li>
                <strong>Potentially sensitive data</strong> – in limited
                circumstances, information about professional misconduct,
                criminal convictions or regulatory matters provided as part of
                membership applications or compliance processes. This
                information is handled as{" "}
                <strong>sensitive personal data</strong> and is accessed only
                by authorised BACO officers on a strict need-to-know basis.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">
              3. Why we use your data (purposes)
            </h2>
            <p>We process your personal data for the following purposes:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>To create and manage your BACO member account.</li>
              <li>
                To administer membership, including approvals, renewals and
                updates.
              </li>
              <li>
                To organise and manage events, trainings and conferences
                (including registrations, attendance and certificates).
              </li>
              <li>
                To issue invoices, record payments and maintain financial
                records required by law.
              </li>
              <li>
                To receive and respond to your messages and support requests.
              </li>
              <li>
                To verify documents and qualifications you submit for
                membership, CPD or accreditation purposes.
              </li>
              <li>
                To maintain appropriate records of BACO&apos;s activities as a
                professional association.
              </li>
              <li>
                To comply with legal and regulatory obligations applicable in
                The Bahamas.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">
              4. Legal basis and fair processing
            </h2>
            <p>
              We will collect and process your personal data only by means which
              are <strong>lawful and fair</strong>, in line with the Bahamian
              Data Protection Act. Depending on the context, processing is based
              on one or more of the following:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>
                Your <strong>consent</strong> – for example, when you apply for
                membership, submit sensitive information voluntarily, or opt in
                to receive marketing communications.
              </li>
              <li>
                <strong>Performance of a contract</strong> – to provide member
                services, events and benefits you have requested as part of your
                relationship with BACO.
              </li>
              <li>
                <strong>Legal obligations</strong> – to meet statutory record
                keeping or reporting requirements in The Bahamas.
              </li>
              <li>
                <strong>Legitimate interests</strong> – for example, to operate
                and improve the BACO Portal, maintain security, and manage the
                association, provided such interests are not overridden by your
                rights and freedoms.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">
              5. How we share your data
            </h2>
            <p>
              We do not sell your personal data. We may share it only with:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>
                <strong>Service providers / data processors</strong> who host
                the portal, store files, process payments or send emails on our
                behalf (for example, cloud hosting providers, email services and
                payment processors). They may only process your data according
                to our instructions and under appropriate safeguards.
              </li>
              <li>
                <strong>BACO officers and authorised committee members</strong>{" "}
                who require access to fulfil their roles (e.g. membership
                approvals, event administration, document verification and
                complaints handling).
              </li>
              <li>
                <strong>Regulators or public authorities</strong> where we are
                legally required to do so, or where this is necessary for the
                administration of justice or the performance of a public
                function.
              </li>
            </ul>
            <p className="mt-2">
              Any disclosures will be compatible with the purposes for which
              your data was originally collected.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">
              6. International transfers
            </h2>
            <p>
              The BACO Portal may use cloud infrastructure or service providers
              located outside The Bahamas (for example, in the United States,
              Canada or the European Economic Area). Where this results in the
              transfer of personal data abroad, we will ensure that such
              transfers comply with the Data Protection (Privacy of Personal
              Information) Act, including using appropriate contractual
              safeguards, ensuring adequate protection in the recipient country,
              or relying on another permitted condition under the Act.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">
              7. Data retention – how long we keep your data
            </h2>
            <p>
              We keep personal data only for as long as is{" "}
              <strong>necessary</strong> for the purposes described above, or as
              required by law. In general:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>
                Member account records are kept while you are a member and for a
                limited period afterwards (for example, 6 years) to handle
                queries, financial records and audit requirements.
              </li>
              <li>
                Event registration records and certificates are retained as part
                of your professional history with BACO.
              </li>
              <li>
                Financial records and invoices are retained in line with
                applicable financial and tax retention requirements.
              </li>
              <li>
                Logs and backups are retained for security and operational
                continuity for limited periods.
              </li>
            </ul>
            <p className="mt-2">
              When data is no longer required, it will be deleted or
              anonymised. Certain information may be kept for historical,
              statistical or research purposes in line with the Act.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">
              8. Security and confidentiality
            </h2>
            <p>
              We take appropriate technical and organisational measures to
              protect personal data against unauthorised or unlawful use,
              accidental loss, destruction or damage. These measures include:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Use of HTTPS for access to the BACO Portal.</li>
              <li>
                Password-based authentication and restricted administrative
                access.
              </li>
              <li>
                Role-based access to member data for BACO officers on a
                need-to-know basis.
              </li>
              <li>
                Secure storage for documents and certificates, with access
                logged where appropriate.
              </li>
              <li>
                Staff guidance and internal policies regarding the handling and
                sharing of personal data.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">
              9. Your rights under Bahamian law
            </h2>
            <p>
              Under the Data Protection (Privacy of Personal Information) Act,
              you have rights in relation to your personal data, including:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>
                The right to request a copy of the personal data we hold about
                you.
              </li>
              <li>
                The right to request correction or deletion of inaccurate or
                incomplete data.
              </li>
              <li>
                The right to object to the use of your data for direct marketing
                purposes.
              </li>
              <li>
                The right to complain to the Office of the Data Protection
                Commissioner if you believe your rights have been infringed.
              </li>
            </ul>
            <p className="mt-2">
              To exercise any of these rights in relation to the BACO Portal,
              please contact us using the details in section 1. We may need to
              verify your identity before acting on your request.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">
              10. Direct marketing
            </h2>
            <p>
              From time to time, BACO may send you information about events,
              trainings or updates which we consider relevant to you as a member
              or prospective member. You may opt out of receiving marketing
              communications at any time by using the unsubscribe options
              provided or by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">
              11. Changes to this notice
            </h2>
            <p>
              We may update this Privacy Notice from time to time to reflect
              changes in our practices or legal requirements. The latest version
              will always be available in the BACO Portal at this page.
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
}

