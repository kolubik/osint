"""
================================================================================
SPIDERFOOT & MALTEGO MODULAR TRANSFORM ARCHITECTURE
Base Entities and Abstract Plugin Specifications
Zero AI Generation / Strict Truthfulness & Cryptographic Attribution
================================================================================
"""

from abc import ABC, abstractmethod
from enum import Enum
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone

try:
    from pydantic import BaseModel, Field
except ImportError:
    class BaseModel:
        def __init__(self, **kwargs):
            for k, v in kwargs.items():
                setattr(self, k, v)
        def dict(self):
            res = {}
            for k, v in self.__dict__.items():
                if k.startswith('_'): continue
                if isinstance(v, BaseModel):
                    res[k] = v.dict()
                elif isinstance(v, list):
                    res[k] = [x.dict() if isinstance(x, BaseModel) else x for x in v]
                elif hasattr(v, 'value'):
                    res[k] = v.value
                else:
                    res[k] = v
            return res

    def Field(default=None, default_factory=None, description=""):
        if default_factory:
            return default_factory()
        return default


class EntityType(str, Enum):
    PHONE = "PHONE"
    EMAIL = "EMAIL"
    USERNAME = "USERNAME"
    PROFILE = "PROFILE"
    DOMAIN = "DOMAIN"
    IP = "IP"
    ASN = "ASN"
    BREACH = "BREACH"
    CARRIER = "CARRIER"
    MESSENGER = "MESSENGER"
    PORT = "PORT"
    LOCATION = "LOCATION"
    METADATA = "METADATA"
    TELEGRAM_CHAT = "TELEGRAM_CHAT"
    TELEGRAM_MESSAGE = "TELEGRAM_MESSAGE"
    TELEGRAM_MEDIA = "TELEGRAM_MEDIA"


class VerificationStatus(str, Enum):
    VERIFIED_REAL = "VERIFIED_REAL"
    API_VERIFIED = "API_VERIFIED"
    CLARIFIED_VIA_API = "CLARIFIED_VIA_API"
    NOT_FOUND = "NOT_FOUND"
    API_LIMIT_EXCEEDED = "API_LIMIT_EXCEEDED"
    UNREACHABLE = "UNREACHABLE"
    INVALID_TARGET = "INVALID_TARGET"


class Entity(BaseModel):
    id: str = Field(description="Unique entity identifier (e.g. phone:+14155552671)")
    type: EntityType = Field(description="Normalized entity type")
    value: str = Field(description="Normalized textual value of entity")
    label: str = Field(description="Human readable display label")
    source: str = Field(description="Originating API or transform plugin name")
    verification_status: VerificationStatus = Field(default=VerificationStatus.VERIFIED_REAL)
    attributes: Dict[str, Any] = Field(default_factory=dict, description="Forensic attributes and metadata")
    parent_id: Optional[str] = Field(default=None, description="Source entity ID that yielded this entity")
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class TransformEdge(BaseModel):
    source: str
    target: str
    label: str
    transform_name: str


class TransformResult(BaseModel):
    transform_name: str
    source_entity: Entity
    produced_entities: List[Entity]
    edges: List[TransformEdge]
    execution_time_ms: int
    status: str
    notes: Optional[str] = None


class BaseTransform(ABC):
    """
    Abstract SpiderFoot-like plugin transform.
    Accepts a single Entity and returns an array of new correlated Entities and Edges.
    """
    name: str
    description: str
    input_types: List[EntityType]
    output_types: List[EntityType]

    @abstractmethod
    async def execute(self, entity: Entity) -> TransformResult:
        """Execute transform against target entity using real public APIs only."""
        pass
