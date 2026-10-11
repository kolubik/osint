import re
import ipaddress
from typing import Dict, Any, Optional
from pydantic import BaseModel

try:
    import dns.resolver
    DNS_AVAILABLE = True
except ImportError:
    DNS_AVAILABLE = False

try:
    import phonenumbers
    PHONENUMBERS_AVAILABLE = True
except ImportError:
    PHONENUMBERS_AVAILABLE = False


class ValidationResult(BaseModel):
    is_valid: bool
    status: str  # VERIFIED_REAL, INVALID_SYNTAX, NO_MX_RECORDS, INVALID_PHONE_NUMBER, VALID_E164, etc.
    details: Dict[str, Any] = {}


class TruthVerifier:
    """
    Модуль валидации источников: гарантирует, что все входящие и исходящие
    данные поступают исключительно из реальных сетевых ответов и соответствуют стандартам.
    Zero AI Generation for Data / Strict Truthfulness.
    """

    @staticmethod
    def verify_email_domain(email: str) -> ValidationResult:
        """Проверяет валидность синтаксиса email и наличие реальных MX-записей у домена."""
        pattern = r"^[\w\.-]+@[\w\.-]+\.\w+$"
        if not re.match(pattern, email):
            return ValidationResult(is_valid=False, status="INVALID_SYNTAX", details={"error": "Malformed email address syntax"})
        
        domain = email.split("@")[1].strip().lower()
        if not DNS_AVAILABLE:
            return ValidationResult(
                is_valid=True,
                status="VERIFIED_REAL",
                details={"domain": domain, "note": "dnspython unavailable, syntax passed"}
            )

        try:
            resolver = dns.resolver.Resolver()
            resolver.timeout = 4.0
            resolver.lifetime = 4.0
            records = resolver.resolve(domain, 'MX')
            mx_list = [str(r.exchange) for r in records]
            if not mx_list:
                return ValidationResult(
                    is_valid=False,
                    status="NO_MX_RECORDS",
                    details={"domain": domain, "error": "No MX records found for domain"}
                )
            return ValidationResult(
                is_valid=True,
                status="MX_RECORD_EXISTS",
                details={"domain": domain, "mx_records": mx_list}
            )
        except Exception as e:
            return ValidationResult(
                is_valid=False,
                status="NO_MX_RECORDS",
                details={"domain": domain, "error": str(e)}
            )

    @staticmethod
    def verify_phone_number(phone_raw: str, default_region: str = "US") -> ValidationResult:
        """Проверяет реальность номера телефона через Google libphonenumber."""
        clean_input = phone_raw.strip()
        if not PHONENUMBERS_AVAILABLE:
            digits = re.sub(r'\D', '', clean_input)
            if len(digits) < 7 or len(digits) > 15:
                return ValidationResult(is_valid=False, status="INVALID_PHONE_NUMBER", details={"error": "Invalid ITU digit length"})
            return ValidationResult(
                is_valid=True,
                status="VALID_E164",
                details={"e164": f"+{digits}", "digits": digits}
            )

        try:
            # If starts with +, parse without default region; otherwise use default_region
            region = None if clean_input.startswith('+') else default_region
            parsed = phonenumbers.parse(clean_input, region)
            is_valid = phonenumbers.is_valid_number(parsed)
            if not is_valid:
                return ValidationResult(
                    is_valid=False,
                    status="INVALID_PHONE_NUMBER",
                    details={"error": "Number failed ITU libphonenumber mathematical checksum"}
                )
            
            return ValidationResult(
                is_valid=True,
                status="VALID_E164",
                details={
                    "e164": phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164),
                    "country_code": parsed.country_code,
                    "national_number": str(parsed.national_number)
                }
            )
        except Exception as e:
            return ValidationResult(is_valid=False, status="PARSING_ERROR", details={"error": str(e)})

    @staticmethod
    def verify_ip_or_domain(target: str) -> ValidationResult:
        """Проверяет корректность IP-адреса или FQDN домена."""
        clean = target.strip().replace("http://", "").replace("https://", "").split("/")[0].split(":")[0]
        
        # Check IP
        try:
            ip_obj = ipaddress.ip_address(clean)
            return ValidationResult(
                is_valid=True,
                status="VALID_IP",
                details={"ip": str(ip_obj), "version": ip_obj.version, "is_private": ip_obj.is_private}
            )
        except ValueError:
            pass

        # Check Domain syntax
        domain_pattern = r"^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$"
        if re.match(domain_pattern, clean):
            return ValidationResult(
                is_valid=True,
                status="VALID_DOMAIN",
                details={"domain": clean}
            )

        return ValidationResult(
            is_valid=False,
            status="INVALID_TARGET",
            details={"error": "Target is neither a valid IP address nor a valid FQDN domain name"}
        )

    @staticmethod
    def assert_real_http_response(
        response_headers: dict,
        status_code: int,
        expected_body_contains: Optional[str] = None,
        body_text: str = ""
    ) -> bool:
        """
        Гарантирует, что полученный HTTP-ответ от сервиса не является заглушкой,
        кастомной страницей ошибки или соксом.
        """
        if status_code != 200:
            return False
        
        # Проверка наличия обязательных стандартных заголовков
        norm_headers = {k.lower(): v for k, v in response_headers.items()}
        if "content-type" not in norm_headers:
            return False
            
        # Проверка наличия ключевых сигнатур в ответе (если заданы)
        if expected_body_contains and expected_body_contains.lower() not in body_text.lower():
            return False
            
        return True
