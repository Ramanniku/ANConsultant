GULFBRIDGE RESOURCES — WEBSITE DEMO
===================================

PAGES
- index.html: Home page
- about.html: About the company
- careers.html: Sample job listings with expandable contact details
- pcc.html: PCC enquiry form
- admin-login.html: Admin demo login
- admin-dashboard.html: Admin dashboard with PCC Enquiries and Agent Enquiries tabs
- agent-login.html: Agent demo login
- agent-dashboard.html: Candidate referral form with automatic age calculation
- Admin can add job profiles (salary, education, benefits, responsibilities) that appear on careers.html in the same browser demo

RUN LOCALLY
1. Extract this ZIP archive.
2. Open the extracted folder in VS Code.
3. Start the site using the Live Server extension, or use another local static web server.
4. Use the Agent Login link in the public navigation to submit a candidate referral.
5. Use the Admin link in the footer to view PCC enquiries, Agent Enquiries, and add/manage job profiles. Added job profiles appear on the public Careers page in the same browser profile.

DEMO LOGIN CREDENTIALS
Admin: username admin / password demo123
Agent: username agent / password demo123
These credentials are only for preview purposes.

DEMO STORAGE LIMITATIONS AND PRIVACY
This is a static front-end demonstration. PCC enquiries, agent referrals, and job profiles are saved in browser localStorage. Admin and agent login checks are client-side only. Records and added job profiles are available only in the same browser profile and are not shared between devices or different users. Anyone with access to the browser storage may be able to inspect the saved records.

The referral form includes passport number and family passport availability, which are sensitive personal details. DO NOT use this static demo to collect real candidate passport information. Before production, implement a secure backend/database, server-side authentication and authorization, HTTPS, audit logging, data minimization, retention/deletion controls, and appropriate consent/privacy notices. Never rely on client-side credentials or localStorage for sensitive personal data.

Replace sample contact details and sample job listings with verified company information before publishing.
Latest update:
- Careers page includes a job-title search field that filters sample and admin-published job cards.
- Added contact-us.html with a general enquiry form (name, phone, email, enquiry type and message).
- Contact Us appears in the main navigation and footer.
- Contact form submissions are saved in localStorage under gulfbridge_demo_contact_enquiries in the same browser only. Connect a secure backend or email service before publishing to receive enquiries centrally.
