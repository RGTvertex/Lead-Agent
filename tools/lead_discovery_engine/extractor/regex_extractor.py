import re
from typing import List


class RegexExtractor:
    """
    Extracts structured information using regular expressions.
    """

    EMAIL_PATTERN = re.compile(
        r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}"
    )

    PHONE_PATTERN = re.compile(
        r"(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{2,5}\)?[-.\s]?)?\d{3,5}[-.\s]?\d{4,6}"
    )

    def extract_emails(self, text: str) -> List[str]:

        emails = self.EMAIL_PATTERN.findall(text)

        return list(dict.fromkeys(emails))

    def extract_phones(self, text: str) -> List[str]:

        phones = self.PHONE_PATTERN.findall(text)

        cleaned = []

        for phone in phones:

            phone = phone.strip()

            if len(phone) >= 8:

                cleaned.append(phone)

        return list(dict.fromkeys(cleaned))