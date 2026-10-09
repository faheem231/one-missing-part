"""Component substitution models."""

from enum import Enum
from pydantic import BaseModel, Field, computed_field, model_validator


class ApprovalStatus(str, Enum):
    """Explicit qualification and engineering approval status."""

    APPROVED = "APPROVED"
    PENDING = "PENDING"
    REJECTED = "REJECTED"


class ComponentSubstitute(BaseModel):
    """Alternative component mapping with explicit engineering approval state."""

    original_component_id: str = Field(..., description="Original BOM component identifier", min_length=1)
    substitute_component_id: str = Field(..., description="Substitute component identifier", min_length=1)
    substitute_name: str = Field(..., description="Name or designation of the substitute component", min_length=1)
    approval_status: ApprovalStatus = Field(
        ...,
        description="Explicit approval status. Must be APPROVED to be eligible for production.",
    )
    available_quantity: int = Field(
        ..., ge=0, description="Available on-hand or allocatable substitute stock"
    )
    unit_cost: float = Field(..., ge=0.0, description="Unit cost in USD for the substitute")
    compatibility_notes: str = Field(
        ..., description="Engineering evaluation, pinout matching, or qualification notes"
    )

    @computed_field(return_type=bool)
    @property
    def is_approved(self) -> bool:
        """True if and only if the component has been explicitly approved for production."""
        return self.approval_status == ApprovalStatus.APPROVED

    @model_validator(mode="after")
    def validate_different_components(self) -> "ComponentSubstitute":
        if self.original_component_id == self.substitute_component_id:
            raise ValueError("Substitute component cannot be identical to the original component ID")
        return self
