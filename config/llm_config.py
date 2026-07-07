import os

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_groq import ChatGroq

from config.env_loader import load_project_env

load_project_env()


def get_llm(temperature: float = 0.1):
    """Returns a configured LLM with NVIDIA Llama-3.1-70B and robust API key fallbacks."""
    from langchain_openai import ChatOpenAI

    base_url = "https://integrate.api.nvidia.com/v1"
    model_name = "meta/llama-3.1-70b-instruct"

    # Fetch all NVIDIA keys from environment
    nvidia_keys = []
    for key_name in ["NVIDIA_API_KEY", "NVIDIA_API_KEY_2", "NVIDIA_API_KEY_3", "NVIDIA_API_KEY_4"]:
        api_key = os.getenv(key_name)
        if api_key:
            nvidia_keys.append(api_key)

    if not nvidia_keys:
        # Fallback to Gemini if no NVIDIA keys are found (should not happen based on .env)
        from langchain_google_genai import ChatGoogleGenerativeAI
        return ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            temperature=temperature,
            max_retries=0,
        )

    # Use the first available key as primary
    primary_llm = ChatOpenAI(
        model=model_name,
        openai_api_key=nvidia_keys[0],
        openai_api_base=base_url,
        temperature=temperature,
        max_retries=0,
        timeout=30,
    )

    # Set up fallbacks for the remaining NVIDIA keys
    fallback_llms = []
    for api_key in nvidia_keys[1:]:
        fallback_llms.append(
            ChatOpenAI(
                model=model_name,
                openai_api_key=api_key,
                openai_api_base=base_url,
                temperature=temperature,
                max_retries=0,
                timeout=30,
            )
        )
        
    # Add OpenRouter Fallback
    if os.getenv("OPENROUTER_API_KEY") and not os.getenv("OPENROUTER_API_KEY").startswith("your_"):
        fallback_llms.append(
            ChatOpenAI(
                model="meta-llama/llama-3.1-70b-instruct",
                openai_api_key=os.getenv("OPENROUTER_API_KEY"),
                openai_api_base="https://openrouter.ai/api/v1",
                temperature=temperature,
                max_tokens=4096,
                timeout=30,
            )
        )
        
    # Add Groq Fallback
    if os.getenv("GROQ_API_KEY") and not os.getenv("GROQ_API_KEY").startswith("your_"):
        from langchain_groq import ChatGroq
        fallback_llms.append(
            ChatGroq(model="llama-3.1-70b-versatile", temperature=temperature)
        )
        
    # Add Gemini Fallback
    if os.getenv("GEMINI_API_KEY") and not os.getenv("GEMINI_API_KEY").startswith("your_"):
        from langchain_google_genai import ChatGoogleGenerativeAI
        fallback_llms.append(
            ChatGoogleGenerativeAI(
                model="gemini-2.5-flash",
                temperature=temperature,
                max_retries=0,
            )
        )

    if fallback_llms:
        return primary_llm.with_fallbacks(fallback_llms)

    return primary_llm
