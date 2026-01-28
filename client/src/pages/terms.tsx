import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Terms() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Terms of Use – BACO Portal
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
            <h2 className="text-xl font-semibold mb-2">1. About these terms</h2>
            <p>
              These Terms of Use (&quot;Terms&quot;) govern your access to and use of
              the BACO Portal (the &quot;Portal&quot;), operated by the Bahamas
              Association of Compliance Officers (&quot;BACO&quot;, &quot;we&quot;, &quot;us&quot;,
              &quot;our&quot;). By creating an account or using the Portal, you agree to
              be bound by these Terms and by our{" "}
              <a
                href="/privacy"
                className="text-baco-primary hover:text-baco-secondary underline"
              >
                Privacy Notice
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">
              2. Eligibility and account responsibilities
            </h2>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>
                You must be a BACO member, applicant, invited guest, or
                authorised representative to use the Portal.
              </li>
              <li>
                You are responsible for ensuring that all information you
                provide is accurate, complete and kept up to date.
              </li>
              <li>
                You must keep your login credentials confidential and must not
                share your account with any other person.
              </li>
              <li>
                You must notify BACO immediately if you suspect any
                unauthorised use of your account or any other breach of
                security.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">
              3. Acceptable use and content
            </h2>
            <p>
              You agree to use the Portal only for legitimate professional and
              membership-related purposes. In particular, you must not:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>
                Upload or share content that is unlawful, defamatory,
                discriminatory, obscene or otherwise inappropriate.
              </li>
              <li>
                Upload documents or personal data about other individuals unless
                you have a proper basis and authority to do so and such uploads
                are consistent with applicable data protection laws.
              </li>
              <li>
                Attempt to gain unauthorised access to any part of the Portal or
                any other accounts, systems or networks.
              </li>
              <li>
                Use the Portal in a way that could damage, disable, overburden
                or impair its operation or interfere with any other user’s use.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">
              4. Data protection and confidentiality
            </h2>
            <p>
              Your use of the Portal is subject to our{" "}
              <a
                href="/privacy"
                className="text-baco-primary hover:text-baco-secondary underline"
              >
                Privacy Notice
              </a>{" "}
              and the Bahamian Data Protection (Privacy of Personal
              Information) Act, 2003. Without limiting that:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>
                You must treat information accessible through the Portal,
                including member lists, documents, messages and event records,
                as confidential and use it only for legitimate BACO-related
                purposes.
              </li>
              <li>
                You must not extract, export or share personal data obtained
                through the Portal with third parties except as permitted by
                BACO and applicable law.
              </li>
              <li>
                If you act as an employer representative or administrator, you
                are responsible for ensuring that your organisation complies
                with the Data Protection Act in relation to any data accessed
                via the Portal.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">
              5. Membership, events and payments
            </h2>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>
                Membership applications and renewals submitted through the
                Portal are subject to review and approval under BACO’s
                constitution and membership rules.
              </li>
              <li>
                Event registrations made through the Portal may be subject to
                specific terms (including cancellation and refund policies)
                communicated in the event description or by BACO.
              </li>
              <li>
                Payments are processed via third-party payment processors. BACO
                does not store your full payment card details within the Portal.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">
              6. Suspension and termination
            </h2>
            <p>
              BACO may suspend or terminate your access to the Portal if, in our
              reasonable opinion:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>You breach these Terms or any applicable law.</li>
              <li>
                Your membership lapses, is terminated or is otherwise no longer
                in good standing.
              </li>
              <li>
                Continued access presents a security or confidentiality risk.
              </li>
            </ul>
            <p className="mt-2">
              Where appropriate, we will give you notice of any suspension or
              termination, except where immediate action is required to protect
              the Portal, BACO or other users.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">
              7. Intellectual property
            </h2>
            <p>
              The Portal, its design, content and underlying software are owned
              by BACO or its licensors and are protected by copyright and other
              intellectual property rights. You are granted a limited,
              non-exclusive, non-transferable licence to use the Portal for
              lawful BACO-related purposes only. You may not copy, modify,
              distribute or create derivative works from the Portal except as
              expressly permitted by BACO.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">
              8. Availability and changes to the Portal
            </h2>
            <p>
              We aim to keep the Portal available and up to date, but we do not
              guarantee uninterrupted or error-free operation. BACO may modify,
              suspend or discontinue any part of the Portal for maintenance,
              security, legal or operational reasons. Where feasible, we will
              provide notice of significant changes that affect members.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">
              9. Limitation of liability
            </h2>
            <p>
              Nothing in these Terms excludes or limits any liability that cannot
              be excluded under the laws of The Bahamas. Subject to that, and to
              the extent permitted by law, BACO will not be liable for:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>
                Any indirect or consequential loss arising out of your use of or
                inability to use the Portal.
              </li>
              <li>
                Loss of profits, business, opportunity, goodwill or data arising
                from use of the Portal.
              </li>
              <li>
                Any loss resulting from unauthorised access to your account
                where you have failed to keep your credentials secure.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">
              10. Complaints and contact
            </h2>
            <p>
              If you have any concerns about the Portal, these Terms or our
              handling of your personal data, please contact BACO using the
              details provided in the Portal or in the{" "}
              <a
                href="/privacy"
                className="text-baco-primary hover:text-baco-secondary underline"
              >
                Privacy Notice
              </a>
              . You also have the right to raise concerns with the Office of the
              Data Protection Commissioner in The Bahamas.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">
              11. Governing law and jurisdiction
            </h2>
            <p>
              These Terms and any dispute arising out of or in connection with
              them are governed by the laws of the Commonwealth of The Bahamas.
              The courts of The Bahamas will have jurisdiction over any such
              disputes.
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
}

