"""Single-level Bill of Materials (BOM) models."""

from pydantic import BaseModel, Field, model_validator


class BOMItem(BaseModel):
    """Component requirement per finished unit."""

    component_id: str = Field(..., description="Referenced component ID", min_length=1)
    quantity_per_unit: int = Field(
        ..., gt=0, description="Positive quantity required per unit of finished product"
    )


class BillOfMaterials(BaseModel):
    """Single-level Bill of Materials definition for an assembled product."""

    product_id: str = Field(..., description="Unique finished product ID", min_length=1)
    product_name: str = Field(..., description="Name of the finished product", min_length=1)
    items: list[BOMItem] = Field(
        ..., min_length=1, description="List of required components for single-level assembly"
    )

    @model_validator(mode="after")
    def validate_unique_components(self) -> "BillOfMaterials":
        seen_components: set[str] = set()
        for item in self.items:
            if item.component_id in seen_components:
                raise ValueError(
                    f"Duplicate component '{item.component_id}' in BOM for product '{self.product_id}'"
                )
            seen_components.add(item.component_id)
        return self
