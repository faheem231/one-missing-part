"""Supplier availability and procurement option models."""

from typing import Optional
from pydantic import BaseModel, Field, model_validator


class SupplierAvailability(BaseModel):
    """External vendor availability, lead times, and pricing."""

    supplier_id: str = Field(..., description="Unique supplier identifier", min_length=1)
    name: str = Field(..., description="Supplier company name", min_length=1)
    component_id: str = Field(..., description="Component available from this supplier", min_length=1)
    available_quantity: int = Field(
        ..., ge=0, description="Available stock quantity offered by the supplier"
    )
    standard_lead_time_days: int = Field(
        ..., ge=0, description="Standard delivery lead time in calendar days"
    )
    expedited_lead_time_days: Optional[int] = Field(
        default=None, ge=0, description="Expedited delivery lead time in calendar days, if offered"
    )
    standard_unit_cost: float = Field(
        ..., ge=0.0, description="Standard purchase price per unit in USD"
    )
    expedited_unit_cost: Optional[float] = Field(
        default=None, ge=0.0, description="Expedited purchase price per unit in USD, if offered"
    )
    is_guaranteed: bool = Field(
        default=False,
        description="Whether supplier stock and delivery window are contractually guaranteed",
    )

    @model_validator(mode="after")
    def validate_lead_times_and_costs(self) -> "SupplierAvailability":
        if self.expedited_lead_time_days is not None:
            if self.expedited_lead_time_days > self.standard_lead_time_days:
                raise ValueError(
                    f"Expedited lead time ({self.expedited_lead_time_days} days) cannot be greater than standard lead time ({self.standard_lead_time_days} days)"
                )
        if self.expedited_unit_cost is not None:
            if self.expedited_unit_cost < self.standard_unit_cost:
                raise ValueError(
                    f"Expedited unit cost (${self.expedited_unit_cost}) cannot be less than standard unit cost (${self.standard_unit_cost})"
                )
        return self
