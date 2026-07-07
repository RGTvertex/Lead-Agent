from tools.lead_discovery_engine.extractor.providers.gemini_extractor import GeminiExtractor
from tools.lead_discovery_engine.extractor.regex_extractor import RegexExtractor
from tools.lead_discovery_engine.schemas.lead_schema import Contact, Lead


class Extractor:
    """
    Combines Regex extraction and AI extraction
    into a single validated Lead object.
    """

    def __init__(self):

        self.regex = RegexExtractor()
        self.ai = GeminiExtractor()

    def extract(
        self,
        text: str,
        website: str,
    ) -> Lead:

        lead = self.ai.extract(
            text=text,
            website=website,
        )

        cleaned_contacts = []

        for contact in lead.contacts:

            if (
                contact.name
                or contact.designation
                or contact.email
                or contact.phone
            ):
                cleaned_contacts.append(contact)

        lead.contacts = cleaned_contacts

        emails = self.regex.extract_emails(text)[:5]
        phones = self.regex.extract_phones(text)[:5]

        for email in emails:
            lead.contacts.append(Contact(email=email))

        for phone in phones:
            lead.contacts.append(Contact(phone=phone))

        return lead
