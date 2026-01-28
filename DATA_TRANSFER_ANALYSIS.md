# BACO Portal – Data Transfer and Hosting Analysis

_This document identifies where personal data is stored and processed, and assesses international transfer implications under the Bahamas Data Protection (Privacy of Personal Information) Act, 2003._

## 1. Infrastructure and hosting

### Database (PostgreSQL)

- **Provider**: Railway, Supabase, Neon, or other PostgreSQL hosting (as configured via `DATABASE_URL`)
- **Typical regions**: United States (us-east-1, us-west-2), Canada, or EU regions depending on provider
- **Data stored**: All personal data (members, events, documents, messages, payments, invoices)
- **Transfer status**: Likely outside The Bahamas unless specifically configured for a Bahamas-based provider
- **Safeguards**:
  - Database access restricted via connection string credentials
  - HTTPS/TLS encryption in transit
  - Provider terms of service and data processing agreements (DPAs) should be reviewed
  - Consider requesting explicit DPA from provider confirming compliance with Bahamian law

### Application hosting

- **Providers**: Railway, Vercel, or other Node.js hosting platforms
- **Typical regions**: United States, EU, or global CDN
- **Data processed**: Application logic runs on these servers; sessions and temporary data may be stored
- **Transfer status**: Likely outside The Bahamas
- **Safeguards**:
  - Application code and configuration should not expose credentials
  - Session data stored in PostgreSQL (see Database section above)
  - HTTPS enforced in production

### Object storage (documents, certificates, invoices)

- **Provider**: Supabase Storage (S3-compatible API)
- **Region**: `us-west-2` (as configured in `SUPABASE_STORAGE_REGION`)
- **Data stored**: Uploaded documents (certificates, IDs, receipts), generated PDFs (certificates, invoices)
- **Transfer status**: Data stored in United States (us-west-2)
- **Safeguards**:
  - Private bucket access (no public URLs for personal data)
  - Short-lived signed URLs for downloads (default: 1 hour expiry)
  - Access controlled via Supabase credentials
  - Review Supabase DPA and terms for compliance with Bahamian law

### Email service

- **Provider**: AWS SES (Simple Email Service)
- **Region**: `us-east-1` (as configured in `AWS_SES_REGION`)
- **Data processed**: Recipient email addresses, message content (registration confirmations, password resets, notifications)
- **Transfer status**: Email routing and processing occurs in United States
- **Safeguards**:
  - AWS SES processes emails but does not store them long-term
  - Email content is transient
  - Review AWS DPA and ensure it covers Bahamian data protection requirements
  - Consider using AWS regions closer to The Bahamas if available

### Payment processing

- **Provider**: Stripe
- **Region**: Global (Stripe processes payments worldwide)
- **Data processed**: Payment metadata (amounts, status, reference IDs); card numbers are NOT stored in BACO Portal
- **Transfer status**: Stripe infrastructure is global; payment data may transit through various regions
- **Safeguards**:
  - BACO Portal does not store full card numbers (PCI-DSS compliance handled by Stripe)
  - Only payment metadata (amounts, status) stored in BACO database
  - Stripe has its own compliance certifications (PCI-DSS, SOC 2)
  - Review Stripe DPA for international transfers

## 2. Legal basis for international transfers

Under the Bahamas Data Protection Act, transfers of personal data outside The Bahamas are permitted if at least one of the following conditions is met:

1. **Consent of the data subject** – Members consent to the use of cloud services when they register and use the Portal (implied consent via Terms of Use and Privacy Notice).
2. **Necessary for performance of contract** – Hosting, storage and email services are necessary to provide the membership portal services that members have requested.
3. **Contractual safeguards** – Data processing agreements (DPAs) with providers should include:
   - Commitments to process data only per BACO’s instructions
   - Security and confidentiality obligations
   - Restrictions on further transfers
   - Rights for data subjects
   - Compliance with applicable data protection laws

## 3. Recommendations

### Immediate actions

1. **Review provider agreements**:
   - Confirm that Railway/Supabase/Neon, Supabase Storage, AWS SES, and Stripe have DPAs available
   - Ensure DPAs explicitly reference compliance with Bahamian law or provide equivalent protections
   - Document where each provider stores/processes data (regions)

2. **Update Privacy Notice**:
   - Explicitly state that data may be stored/processed outside The Bahamas
   - List the main providers and their general locations (e.g., "United States", "Global")
   - Reference the legal basis for transfers (consent, contract performance, contractual safeguards)

3. **Internal documentation**:
   - Maintain a register of all data processors and their locations
   - Keep copies of DPAs or provider terms that address data protection
   - Review annually or when providers change

### Medium-term improvements

1. **Consider regional options**:
   - Evaluate if any providers offer hosting/storage in regions closer to The Bahamas
   - Balance cost, performance and compliance requirements

2. **Enhanced contractual safeguards**:
   - Where possible, negotiate explicit clauses in provider agreements confirming compliance with Bahamian Data Protection Act
   - Consider using EU Standard Contractual Clauses (SCCs) or similar frameworks if providers offer them

3. **Monitoring and audit**:
   - Regularly review provider security and compliance certifications
   - Monitor for data breaches or security incidents at provider level
   - Document any changes to provider infrastructure or data locations

## 4. Current configuration summary

| Service | Provider | Typical Region | Data Type | Transfer Status |
|---------|----------|----------------|-----------|-----------------|
| Database | Railway/Supabase/Neon | US/EU | All personal data | Outside Bahamas |
| Application | Railway/Vercel | US/EU/Global | Application logic | Outside Bahamas |
| Object Storage | Supabase Storage | us-west-2 (US) | Documents, PDFs | Outside Bahamas |
| Email | AWS SES | us-east-1 (US) | Email addresses, content | Outside Bahamas |
| Payments | Stripe | Global | Payment metadata only | Outside Bahamas |

## 5. Compliance checklist

- [ ] Privacy Notice updated to disclose international transfers
- [ ] Terms of Use reference data transfers
- [ ] DPAs or equivalent agreements reviewed/obtained from all major providers
- [ ] Internal register of processors maintained
- [ ] Annual review scheduled for provider agreements and locations
- [ ] Legal counsel consulted on transfer arrangements (if not already done)

---

**Last updated**: January 2026  
**Next review**: January 2027 (or sooner if infrastructure changes)
