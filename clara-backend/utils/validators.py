"""
Validation utilities
"""

import re
import phonenumbers
from email_validator import validate_email as email_validate, EmailNotValidError
from typing import Optional, Tuple


def validate_email(email: str) -> Tuple[bool, Optional[str]]:
    """
    Validate email address
    
    Args:
        email: Email address to validate
        
    Returns:
        Tuple of (is_valid, normalized_email)
    """
    if not email:
        return False, None
        
    try:
        # Validate and normalize email
        valid = email_validate(email)
        return True, valid.email
    except EmailNotValidError as e:
        return False, None


def validate_phone(phone: str, region: str = "US") -> Tuple[bool, Optional[str]]:
    """
    Validate and format phone number
    
    Args:
        phone: Phone number to validate
        region: Default region code (e.g., 'US', 'PK')
        
    Returns:
        Tuple of (is_valid, formatted_phone)
    """
    if not phone:
        return False, None
        
    try:
        # Parse phone number
        parsed = phonenumbers.parse(phone, region)
        
        # Check if valid
        if phonenumbers.is_valid_number(parsed):
            # Format in international format
            formatted = phonenumbers.format_number(
                parsed, phonenumbers.PhoneNumberFormat.E164
            )
            return True, formatted
        else:
            return False, None
            
    except phonenumbers.NumberParseException:
        return False, None


def validate_url(url: str) -> bool:
    """
    Validate URL format
    
    Args:
        url: URL to validate
        
    Returns:
        True if valid URL, False otherwise
    """
    if not url:
        return False
        
    # Simple URL validation regex
    url_pattern = re.compile(
        r'^https?://'  # http:// or https://
        r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|'  # domain...
        r'localhost|'  # localhost...
        r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'  # ...or ip
        r'(?::\d+)?'  # optional port
        r'(?:/?|[/?]\S+)$', re.IGNORECASE)
    
    return url_pattern.match(url) is not None


def validate_company_name(company: str) -> bool:
    """
    Validate company name (basic validation)
    
    Args:
        company: Company name to validate
        
    Returns:
        True if valid, False otherwise
    """
    if not company or len(company.strip()) < 2:
        return False
    
    # Check if company name has at least some alphabetic characters
    if not any(c.isalpha() for c in company):
        return False
        
    return True


def sanitize_text(text: str, max_length: int = 1000) -> str:
    """
    Sanitize text input by removing potentially harmful content
    
    Args:
        text: Text to sanitize
        max_length: Maximum allowed length
        
    Returns:
        Sanitized text
    """
    if not text:
        return ""
        
    # Remove control characters
    sanitized = ''.join(char for char in text if ord(char) >= 32 or char in '\n\r\t')
    
    # Truncate if too long
    if len(sanitized) > max_length:
        sanitized = sanitized[:max_length]
        
    return sanitized.strip()


def extract_numbers(text: str) -> list:
    """
    Extract all numbers from text
    
    Args:
        text: Text to extract numbers from
        
    Returns:
        List of numbers found
    """
    if not text:
        return []
        
    # Find all numbers (integers and decimals)
    pattern = r'\d+\.?\d*'
    numbers = re.findall(pattern, text)
    
    return [float(n) if '.' in n else int(n) for n in numbers]


def extract_email_from_text(text: str) -> Optional[str]:
    """
    Extract email address from text
    
    Args:
        text: Text to extract email from
        
    Returns:
        First email found or None
    """
    if not text:
        return None
        
    # Email regex pattern
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    matches = re.findall(email_pattern, text)
    
    if matches:
        # Validate and return first match
        is_valid, normalized = validate_email(matches[0])
        return normalized if is_valid else None
        
    return None

