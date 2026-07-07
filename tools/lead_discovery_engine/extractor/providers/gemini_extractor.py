import json

from config.llm_config import get_llm
from tools.lead_discovery_engine.extractor.ai_extractor import AIExtractor
from tools.lead_discovery_engine.prompts.lead_extraction_prompt import (
    build_lead_extraction_prompt,
)
from tools.lead_discovery_engine.schemas.lead_schema import Lead


class GeminiExtractor(AIExtractor):
    """
    LLM implementation of the AI-based lead extractor using the resilient fallback chain.
    """

    def __init__(self):
        self.llm = get_llm(temperature=0.1)

    def extract(
        self,
        text: str,
        website: str,
    ) -> Lead:

        # Add schema definition explicitly to the prompt for fallback models
        schema_prompt = (
            "\n\nReturn ONLY a JSON object matching the following schema. "
            "Do NOT include any markdown formatting, backticks, or explanation:\n"
            f"{Lead.model_json_schema()}"
        )
        prompt = build_lead_extraction_prompt(text) + schema_prompt

        try:
            # We use standard invoke to ensure compatibility with NVIDIA APIs
            response = self.llm.invoke(prompt)
            response_text = response.content.strip()

            # Remove Deepseek <think> tags using regex if they exist
            import re
            response_text = re.sub(r'<think>.*?</think>', '', response_text, flags=re.DOTALL).strip()

            # Clean markdown code blocks if the model ignores the instruction
            response_text = (
                response_text
                .replace("```json", "")
                .replace("```", "")
                .strip()
            )

            # Extract only the JSON block in case the LLM added conversational filler
            json_match = re.search(r'(\{.*\})', response_text, re.DOTALL)
            if json_match:
                response_text = json_match.group(1)
            
            # Fix 'Not Available' emails
            response_text = response_text.replace('"Not Available"', 'null').replace('"N/A"', 'null')

            # Fix trailing commas (e.g., {"a": 1,} -> {"a": 1}) which crash json.loads
            response_text = re.sub(r',\s*([\]}])', r'\1', response_text)

            try:
                data = json.loads(response_text)
                data["website"] = website
                
                # Fix: If LLM extracts multiple comma-separated emails, keep only the first one
                if "contacts" in data:
                    for contact in data["contacts"]:
                        if isinstance(contact, dict) and contact.get("email"):
                            if "," in contact["email"]:
                                contact["email"] = contact["email"].split(",")[0].strip()

                return Lead.model_validate(data)
            except json.JSONDecodeError as e:
                raise ValueError(
                    f"LLM returned invalid JSON.\n\n{response_text}"
                ) from e

        except Exception as e:
            raise RuntimeError(
                f"LLM extraction failed: {e}"
            ) from e