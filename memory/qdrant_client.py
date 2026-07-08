import os
import uuid
from typing import List, Dict, Any

from qdrant_client import QdrantClient
from qdrant_client.http import models

from config.env_loader import _is_placeholder, load_project_env

load_project_env()

# Try to import Google GenAI for primary embeddings
try:
    from google import genai
    HAS_GEMINI = True
except ImportError:
    HAS_GEMINI = False

# Try to import SentenceTransformers for fallback embeddings
try:
    from sentence_transformers import SentenceTransformer
    HAS_FALLBACK = True
except ImportError:
    HAS_FALLBACK = False

COLLECTION_NAME = "outreach_templates"

class QdrantMemoryClient:
    def __init__(self):
        self.url = os.getenv("QDRANT_URL")
        self.api_key = os.getenv("QDRANT_API_KEY")
        self.gemini_api_key = os.getenv("GEMINI_API_KEY")
        
        self.configured = self.is_configured()
                
        # Setup Embedder FIRST so self.vector_size is known before creating the collection
        self.fallback_model = None
        if HAS_GEMINI and self.gemini_api_key and not _is_placeholder(self.gemini_api_key):
            self.gemini_client = genai.Client(api_key=self.gemini_api_key)
            self.use_gemini = True
            self.vector_size = 768 # Gemini embedding-001 size
        elif HAS_FALLBACK:
            print("[Qdrant] Gemini not available or API key missing. Falling back to local SentenceTransformers.")
            self.use_gemini = False
            self.fallback_model = SentenceTransformer('all-MiniLM-L6-v2')
            self.vector_size = 384
        else:
            self.use_gemini = False
            self.vector_size = 384
            print("[Qdrant] WARNING: No embedding models available. RAG will not work.")

        # Now connect to Qdrant and ensure collection exists with the correct vector size
        if self.configured:
            try:
                self.client = QdrantClient(url=self.url, api_key=self.api_key)
                self._ensure_collection()
            except Exception as e:
                print(f"[Qdrant] Connection Error: {e}")
                self.configured = False

    def is_configured(self) -> bool:
        return bool(
            self.url
            and self.api_key
            and not _is_placeholder(self.url)
            and not _is_placeholder(self.api_key)
        )

    def _ensure_collection(self):
        """Creates the collection if it doesn't exist, using the correct vector size."""
        try:
            collections = self.client.get_collections().collections
            if not any(c.name == COLLECTION_NAME for c in collections):
                self.client.create_collection(
                    collection_name=COLLECTION_NAME,
                    vectors_config=models.VectorParams(
                        size=self.vector_size, 
                        distance=models.Distance.COSINE
                    )
                )
                print(f"[Qdrant] Created collection '{COLLECTION_NAME}' with vector size {self.vector_size}")
        except Exception as e:
            print(f"[Qdrant] Error ensuring collection: {e}")

    def _get_embedding(self, text: str) -> List[float]:
        """Gets the vector embedding for a piece of text."""
        if self.use_gemini:
            try:
                result = self.gemini_client.models.embed_content(
                    model="text-embedding-004",
                    contents=text,
                )
                return result.embeddings[0].values
            except Exception as e:
                print(f"[Qdrant] Gemini Embedding failed, falling back to local: {e}")
                if self.fallback_model:
                    return self.fallback_model.encode(text).tolist()
                return []
        elif self.fallback_model:
            return self.fallback_model.encode(text).tolist()
        return []

    def store_template(self, industry: str, subject: str, body: str):
        """Stores a successful email template as memory."""
        if not self.configured:
            return
            
        text = f"Industry: {industry}\nSubject: {subject}\nBody: {body}"
        vector = self._get_embedding(text)
        
        if not vector:
            return
            
        self.client.upsert(
            collection_name=COLLECTION_NAME,
            points=[
                models.PointStruct(
                    id=str(uuid.uuid4()),
                    vector=vector,
                    payload={"industry": industry, "subject": subject, "body": body}
                )
            ]
        )

    def retrieve_successful_templates(self, industry: str) -> str:
        """Retrieves semantically similar successful templates for a given industry."""
        if not self.configured:
            # Fallback to hardcoded mock if Qdrant isn't working
            return self._mock_template(industry)
            
        vector = self._get_embedding(industry)
        if not vector:
            return self._mock_template(industry)
            
        try:
            results = self.client.search(
                collection_name=COLLECTION_NAME,
                query_vector=vector,
                limit=2
            )
            
            if not results:
                return self._mock_template(industry)
                
            formatted_results = []
            for hit in results:
                payload = hit.payload
                formatted_results.append(
                    f"[PAST SUCCESSFUL EMAIL]\n"
                    f"Subject: {payload.get('subject', '')}\n"
                    f"Body: {payload.get('body', '')}"
                )
            return "\n\n".join(formatted_results)
            
        except Exception as e:
            print(f"[Qdrant] Search error: {e}")
            return self._mock_template(industry)

    def _mock_template(self, industry: str) -> str:
        print(f"[Qdrant] Using Mock Template for industry: {industry}")
        return (
            "[PAST SUCCESSFUL EMAIL]\n"
            "Subject: Quick question about your team\n"
            "Body: Hi [Name], I noticed your team at [Company] is growing in "
            f"{industry}. We recently helped a similar company improve response rates and outbound efficiency. "
            "Would a short call next week be useful?"
        )
