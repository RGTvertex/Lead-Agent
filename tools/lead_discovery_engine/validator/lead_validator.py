from tools.lead_discovery_engine.schemas.lead_schema import Lead


class LeadValidator:
    """
    Cleans and validates extracted lead information.
    """

    def clean_contacts(
        self,
        lead: Lead,
    ) -> Lead:

        unique_contacts = {}

        for contact in lead.contacts:

            key = (
                contact.email
                or contact.phone
                or contact.name
            )

            if not key:
                continue

            if key not in unique_contacts:

                unique_contacts[key] = contact
                continue

            existing = unique_contacts[key]

            # Merge missing fields
            if not existing.name and contact.name:
                existing.name = contact.name

            if not existing.designation and contact.designation:
                existing.designation = contact.designation

            if not existing.email and contact.email:
                existing.email = contact.email

            if not existing.phone and contact.phone:
                existing.phone = contact.phone

        lead.contacts = list(unique_contacts.values())

        return lead

    def validate(
        self,
        lead: Lead,
        source_text: str,
    ) -> Lead:
        """
        Runs all validation and cleanup steps.

        Parameters
        ----------
        lead : Lead
            Extracted lead object.

        source_text : str
            Cleaned website content.
            (Reserved for future validation rules.)
        """

        lead = self.clean_contacts(lead)

        # Reserved for future validations:
        # - Social links validation
        # - Address validation
        # - Contact validation
        # - Company name validation

        return lead