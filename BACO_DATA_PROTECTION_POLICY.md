# BACO Data Protection & Privacy Policy (Internal)

_This internal policy supports compliance with the Data Protection (Privacy of Personal Information) Act, 2003 of The Bahamas and applies to all BACO officers and administrators who use the BACO Portal or related systems._

## 1. Roles and responsibilities

- **Data Controller**: Bahamas Association of Compliance Officers (BACO).
- **Data Protection Lead**: A designated BACO officer responsible for oversight of data protection practices, responding to requests, and liaising with the Data Protection Commissioner when needed.
- **System Administrators**: Individuals with administrative access to the Portal and related systems, responsible for secure configuration and access control.
- **BACO Officers / Committee Members**: May access member and event data strictly on a need-to-know basis for association purposes.

All personnel with access to personal data must:

- Read and understand this policy and the public Privacy Notice.
- Complete basic data protection awareness training.
- Report any suspected data breach or misdirected communication immediately.

## 2. Data categories and purposes

The Portal processes:

- Member identity and contact data.
- Professional and membership data.
- Event registrations, attendance and certificates.
- Payments, invoices and related financial records.
- Uploaded documents (certificates, IDs, receipts, etc.).
- Messages between members and administrators.
- Limited, sensitive background information for membership vetting.

Each processing activity must have a documented purpose (see `DATA_INVENTORY.md`). Personnel must not repurpose data for unrelated activities without appropriate assessment and approval.

## 3. Collection, fairness and consent

- Collection must be transparent: members must receive clear information via the Privacy Notice and on key forms.
- Additional or sensitive data (e.g. misconduct, criminal convictions) must only be requested where objectively necessary for membership evaluation or compliance obligations.
- Marketing communications require a clear opt-in and an easy opt-out mechanism.

## 4. Access control and confidentiality

- Access is role-based:
  - Members see only their own data and self-service information.
  - Admins see member data required for membership administration, events, documents, invoices and messaging.
  - Only a small group of authorised officers may see sensitive background information or disciplinary records (if any).
- Member data may not be exported, copied or shared onto personal devices or consumer messaging apps without written justification and approval.
- When sharing data with third parties (e.g. auditor, trainer), a written agreement must be in place defining permitted use and retention.

## 5. Accuracy and updates

- Members can update their profile information through the Portal.
- Admins must:
  - Promptly correct information when made aware of inaccuracies.
  - Record the source of important changes (e.g. email confirmation, supporting documents).
  - Avoid free-text fields for highly sensitive information where structured options exist.

## 6. Data retention and deletion

Retention rules (baseline, subject to legal advice):

- Member account records: active membership + up to 6 years after last interaction.
- Event registrations and attendance: at least 6 years for audit and CPD history.
- Certificates and training records: retained for the duration of professional relevance, unless the member exercises their rights and no legal basis requires longer retention.
- Invoices and financial records: at least 7 years or as required under applicable financial and tax law.
- Logs and technical records: kept for operational and security needs, generally 6–24 months.

Operational rules:

- Accounts are first **deactivated** on request; associated data is flagged for deletion/anonymisation according to the schedule above.
- Hard deletion or anonymisation scripts must run regularly (see retention scripts in the codebase) and be reviewed annually.
- Where law or regulation requires longer retention (e.g. financial records), data is restricted rather than erased and the rationale is recorded.

## 7. Data subject rights handling

The Portal supports:

- Access to core account, event and invoice data.
- Profile editing by members.
- Requests for corrections to non-editable fields (via messaging or a dedicated form).
- Requests for account deactivation/deletion.

Internal handling:

1. **Access request** (copy of data):
   - Verify identity.
   - Use admin tools to generate an export, review for third-party data and sensitive notes.
   - Respond within 40 days as required by the Act.

2. **Correction request**:
   - Verify identity.
   - Update records in the admin interface and, where relevant, in external systems.
   - Send a short confirmation to the member.

3. **Deletion / restriction request**:
   - Verify identity.
   - Identify data that must be kept for legal or regulatory reasons (e.g. invoices).
   - Deactivate the account and mark data for deletion/anonymisation per retention rules.
   - Explain to the member what will be deleted and what must be retained, and why.

All such requests must be logged (ticket, email or internal register) and retained as part of compliance evidence.

## 8. Security measures

Key technical and organisational measures include:

- HTTPS-only access to the Portal in production.
- Strong session management and password hashing.
- Restricted admin access and least privilege for staff accounts.
- Access logging for key actions (login, exports, admin edits).
- Secure file storage with private access controls and short-lived links.
- Regular review of third-party processors (hosting, storage, email, payments) to ensure they provide appropriate safeguards.

Administrators must avoid:

- Storing exports or backups on unencrypted personal devices.
- Forwarding member data to personal email accounts.
- Sharing admin credentials or using shared accounts.

## 9. Incident and breach management

All suspected personal data breaches (e.g. lost device, misdirected email, unauthorised access, accidental disclosure) must be reported immediately to the Data Protection Lead.

The Lead will:

1. Contain and assess the incident (what happened, what data, how many people, likely impact).
2. Decide whether notification to affected individuals and/or the Data Protection Commissioner is required under Bahamian law.
3. Coordinate remediation steps (password resets, revoking access, updating procedures).
4. Record the incident, decisions taken and follow-up actions.

## 10. Training, review and updates

- All admins and officers with access to the Portal must receive an induction on this policy and basic data protection principles.
- This policy, the public Privacy Notice and the data inventory must be reviewed at least annually, or sooner if:
  - New high-risk processing is introduced (e.g. new types of sensitive data, new integrations).
  - There is a significant incident or regulatory change.

Updates to this policy must be approved by the BACO Executive or other delegated governance body and communicated to relevant staff.

