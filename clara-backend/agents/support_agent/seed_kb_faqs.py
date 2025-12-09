"""
Seed Knowledge Base FAQs into Supabase (Phase 2B.1)

This script:
- Connects to your Supabase project using SERVICE_ROLE key
- Inserts ~50 FAQ-style articles into the `kb_articles` table

Run from clara-backend folder:
    python -m agents.support_agent.seed_kb_faqs

You can run it multiple times; it will not create duplicate titles.
"""

import os
from typing import List, Dict

from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("Supabase credentials not found in environment")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def build_faq_articles() -> List[Dict]:
    """Return a list of FAQ articles (title, content, summary, category, tags).

    These are generic customer-support style FAQs. You can later
    edit or delete them directly from Supabase if needed.
    """

    faqs: List[Dict] = []

    def add(title: str, category: str, summary: str, body: str, tags=None):
        faqs.append(
            {
                "title": title,
                "category": category,
                "summary": summary,
                "content": body,
                "tags": tags or [category],
                "state": "published",
            }
        )

    # Account / Login
    add(
        "How to reset your password",
        "account",
        "Steps to reset a forgotten password.",
        """# How to Reset Your Password\n\n1. Go to the login page.\n2. Click **Forgot password?**.\n3. Enter the email address linked to your account.\n4. Check your inbox and open the reset link.\n5. Choose a new secure password and confirm.\n\nIf you do not receive the email within a few minutes, check your spam folder or contact support.""",
    )

    add(
        "I did not receive the password reset email",
        "account",
        "What to do when the reset email does not arrive.",
        """# Missing Password Reset Email\n\nIf you requested a password reset but did not receive an email:\n\n- Confirm that you typed the correct email address.\n- Check your spam or promotions folders.\n- Add our domain to your safe-sender list.\n- Wait at least 5 minutes; some providers delay emails.\n- If you still do not receive it, contact support with your registered email address.""",
    )

    add(
        "How to change your account email",
        "account",
        "Update the primary email address on your profile.",
        """# Change Your Account Email\n\nYou can update your account email from **Profile > Account Settings**:\n\n1. Open your profile menu.\n2. Click **Account Settings**.\n3. Under **Email**, type your new email address.\n4. Confirm the change with the verification link we send.\n\nIf you no longer have access to the old email, contact support with proof of ownership.""",
    )

    add(
        "Account locked after too many login attempts",
        "account",
        "Why your account may be locked and how to unlock it.",
        """# Account Locked\n\nFor security reasons we temporarily lock accounts after several failed login attempts.\n\nTo unlock your account:\n\n- Wait 15 minutes and try again, OR\n- Use the **Forgot password** flow to reset your password.\n\nIf you believe someone else tried to access your account, change your password and enable two-factor authentication.""",
    )

    # Billing / Payments
    add(
        "Why was I charged twice?",
        "billing",
        "Common reasons for duplicate charges and what to do.",
        """# Duplicate Charges\n\nIf you see what looks like a double charge:\n\n- Check if one of the payments is a **pending authorization** that will disappear.\n- Make sure you do not have multiple subscriptions under different accounts.\n- Verify the billing period (monthly vs yearly).\n\nIf the charge does not correct itself within 48 hours, contact billing support with a screenshot of the statement.""",
    )

    add(
        "How to download invoices",
        "billing",
        "Download past invoices from the billing portal.",
        """# Download Invoices\n\nTo download invoices:\n\n1. Go to **Settings > Billing**.\n2. Scroll to the **Invoices** section.\n3. Click **Download PDF** next to the invoice you need.\n\nIf an invoice is missing, contact billing support with the approximate date and amount.""",
    )

    add(
        "Refund policy",
        "billing",
        "Overview of our standard refund rules.",
        """# Refund Policy\n\n- New subscriptions have a 14-day money-back guarantee.\n- After 14 days, refunds are handled case-by-case.\n- Refunds are returned to the original payment method only.\n- Processing can take 5–10 business days, depending on your bank.\n\nIf you believe you are eligible for a refund, open a billing ticket with your account email and invoice ID.""",
    )

    add(
        "Changing your payment method",
        "billing",
        "Switch your card or payment method.",
        """# Change Payment Method\n\n1. Go to **Settings > Billing**.\n2. Under **Payment Method**, click **Update**.\n3. Enter your new card or payment details.\n4. Save the changes.\n\nChanges apply to the next renewal. Existing invoices keep the original method.""",
    )

    # Technical / App use
    add(
        "App crashes when I click save",
        "technical",
        "Steps to troubleshoot app crashes on save.",
        """# App Crashes on Save\n\nTry the following steps:\n\n1. Refresh the page or restart the app.\n2. Clear browser cache or app data.\n3. Make sure you are using the latest version.\n4. Try a different browser or device.\n\nIf the crash continues, capture a screenshot and approximate time, then contact support so we can investigate logs.""",
    )

    add(
        "Page is very slow or timing out",
        "technical",
        "Improve performance when the app is slow.",
        """# Slow Performance or Timeouts\n\n- Check your internet connection stability.\n- Close unused browser tabs or heavy applications.\n- Reduce the size of the data you load at once (filters, date ranges).\n- Try again outside of known peak hours.\n\nIf the issue persists, report your region, browser, approximate time, and the page URL to support.""",
    )

    add(
        "I see a 500 internal server error",
        "technical",
        "What to do when the server returns 500 errors.",
        """# 500 Internal Server Error\n\nA 500 error means something went wrong on our side.\n\n- Wait a few minutes and refresh the page.\n- Check the status page if available.\n- If it affects critical work, contact support with the full error message, time, and action you were performing.""",
    )

    add(
        "Emails are not being sent",
        "technical",
        "Troubleshooting missing notification emails.",
        """# Notification Emails Not Being Sent\n\n- Make sure email notifications are enabled in **Settings > Notifications**.\n- Check your spam folder.\n- Confirm that the email address on file is correct.\n- For bulk or automated emails, verify sending limits and quotas.\n\nIf the problem continues, share specific examples (recipient, time, type of email) with support.""",
    )

    # Product / Plans
    add(
        "Which plan is right for me?",
        "product",
        "Guidance on choosing a subscription plan.",
        """# Choosing a Plan\n\n- **Starter**: for individuals and very small teams.\n- **Growth**: for teams that need collaboration and automation.\n- **Enterprise**: for larger organizations with security and compliance needs.\n\nConsider your team size, data volume, and required integrations. You can upgrade or downgrade at any time from the billing page.""",
    )

    add(
        "How to upgrade or downgrade your plan",
        "product",
        "Steps to change your subscription level.",
        """# Change Your Plan\n\n1. Go to **Settings > Billing**.\n2. Under **Plan**, click **Change plan**.\n3. Select the new plan and confirm.\n\nUpgrades apply immediately and are prorated. Downgrades take effect on the next billing cycle.""",
    )

    add(
        "Do you offer a free trial?",
        "product",
        "Information about trial availability.",
        """# Free Trial\n\nWe offer a time-limited free trial on selected plans. During the trial you have access to most features.\n\n- You can cancel any time during the trial.\n- If you keep using the product, your card will be charged at the end of the trial.\n\nCheck our pricing page for current trial options.""",
    )

    # General / Onboarding / Security (add many small variations)
    general_pairs = [
        ("Getting started with the dashboard", "general", "First steps after creating an account."),
        ("How to invite team members", "general", "Add more users to your workspace."),
        ("Managing notification preferences", "general", "Control which emails and alerts you receive."),
        ("Supported browsers and devices", "general", "Which platforms we officially support."),
        ("Data backup and retention", "general", "How long we keep your data and how it is backed up."),
        ("How we protect your data", "general", "Overview of security practices."),
        ("Single sign-on (SSO) options", "general", "SSO availability and configuration.")
    ]

    for title, category, summary in general_pairs:
        body = f"# {title}\n\nThis article explains: {summary} Use the settings page to review options and contact support if you need help applying them to your account."
        add(title, category, summary, body)

    # Add extra variations so we reach roughly 50 articles
    extra_topics = [
        ("Set up two-factor authentication", "account"),
        ("Change your profile picture", "account"),
        ("Understand usage limits", "product"),
        ("Export your data", "product"),
        ("API access and tokens", "technical"),
        ("Webhooks overview", "technical"),
        ("Integrating with CRM systems", "product"),
        ("Timezone and locale settings", "general"),
        ("Language support", "general"),
        ("Deactivating a user", "account"),
        ("Reactivating a suspended account", "account"),
        ("Handling bounced emails", "technical"),
        ("Password strength recommendations", "account"),
        ("Contacting support", "general"),
        ("Escalation procedures", "general"),
        ("Service uptime and status page", "general"),
        ("Supported file types for uploads", "technical"),
        ("Maximum file size limits", "technical"),
        ("Setting business hours", "product"),
        ("Configuring working days and holidays", "product"),
    ]

    for title, category in extra_topics:
        summary = f"FAQ: {title}."
        body = f"# {title}\n\nThis article answers common questions about: {title}. For detailed steps, follow the on-screen instructions in the app and contact support if you need help."
        add(title, category, summary, body)

    print(f"Prepared {len(faqs)} FAQ articles.")
    return faqs


def main() -> None:
    articles = build_faq_articles()

    inserted = 0
    for art in articles:
        # Avoid duplicates by title
        existing = supabase.table("kb_articles").select("id").eq("title", art["title"]).execute()
        if existing.data:
            continue

        payload = {
            "title": art["title"],
            "content": art["content"],
            "summary": art["summary"],
            "category": art["category"],
            "tags": art["tags"],
            "state": art.get("state", "published"),
        }

        res = supabase.table("kb_articles").insert(payload).execute()
        if res.data:
            inserted += 1

    print(f"Inserted {inserted} new kb_articles (others already existed).")


if __name__ == "__main__":
    main()
