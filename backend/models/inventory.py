"""Inventory and component models."""

from pydantic import BaseModel, Field, computed_field, model_validator


class ComponentInventory(BaseModel):
    """Component inventory record tracking physical and reserved stock."""

    component_id: str = Field(..., description="Unique component identifier", min_length=1)
    name: str = Field(..., description="Component commercial or technical name", min_length=1)
    description: str = Field(default="", description="Detailed specification or notes")
    quantity_on_hand: int = Field(
        ..., ge=0, description="Total physical stock in warehouse"
    )
    reserved_quantity: int = Field(
        ..., ge=0, description="Stock already committed to previous operations"
    )
    unit_cost: float = Field(
        ..., ge=0.0, description="Standard cost per unit in USD"
    )

    @computed_field(return_type=int)
    @property
    def usable_quantity(self) -> int:
        """Available stock ready for new production allocation."""
        return self.quantity_on_hand - self.reserved_quantity

    @model_validator(mode="after")
    def validate_inventory_consistency(self) -> "ComponentInventory":
        if self.reserved_quantity > self.quantity_on_hand:
            raise ValueError(
                f"Reserved quantity ({self.reserved_quantity}) cannot exceed quantity on hand ({self.quantity_on_hand})"
            )
        return self
