from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field, HttpUrl


class Address(BaseModel):
    country: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    full_address: Optional[str] = None


class Contact(BaseModel):
    name: Optional[str] = None
    designation: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None


class SocialLinks(BaseModel):
    linkedin: Optional[HttpUrl] = None
    twitter: Optional[HttpUrl] = None
    facebook: Optional[HttpUrl] = None
    youtube: Optional[HttpUrl] = None


class Metadata(BaseModel):
    source: Optional[str] = None
    scraped_at: Optional[str] = None
    confidence_score: Optional[float] = None


class Validation(BaseModel):
    website_valid: bool = False
    email_valid: bool = False
    phone_valid: bool = False


class Lead(BaseModel):
    # Basic Company Information
    company_name: Optional[str] = None
    website: Optional[HttpUrl] = None
    industry: Optional[str] = None

    # Company Details
    description: Optional[str] = None
    

    # Address Information
    address: Optional[Address] = None

    # Contact Information
    contacts: List[Contact] = Field(default_factory=list)

    # Social Media
    social: Optional[SocialLinks] = None

    # Metadata
    metadata: Optional[Metadata] = None

    # Validation Results
    validation: Optional[Validation] = None