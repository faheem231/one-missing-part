"""Planning scenario composite model and integrity validations."""

from datetime import date
from pydantic import BaseModel, Field, computed_field, model_validator

from backend.models.inventory import ComponentInventory
from backend.models.bom import BillOfMaterials
from backend.models.production import AssemblyLine, ProductionOrder
from backend.models.supplier import SupplierAvailability
from backend.models.substitute import ComponentSubstitute


class PlanningScenario(BaseModel):
    """Manufacturing planning scenario over a two-week horizon on one assembly line."""

    scenario_id: str = Field(..., description="Unique scenario identifier", min_length=1)
    name: str = Field(..., description="Scenario display title", min_length=1)
    start_date: date = Field(..., description="Planning horizon start date")
    end_date: date = Field(..., description="Planning horizon end date")
    assembly_lines: list[AssemblyLine] = Field(
        ...,
        min_length=1,
        max_length=1,
        description="Assembly lines in the scenario (strictly one assembly line in current scope)",
    )
    inventory: list[ComponentInventory] = Field(
        ..., min_length=1, description="Component inventory records"
    )
    boms: list[BillOfMaterials] = Field(
        ..., min_length=1, description="Single-level Bill of Materials for finished goods"
    )
    production_orders: list[ProductionOrder] = Field(
        ..., min_length=1, description="Production customer work orders"
    )
    supplier_options: list[SupplierAvailability] = Field(
        default_factory=list, description="Supplier availability and lead times"
    )
    substitutes: list[ComponentSubstitute] = Field(
        default_factory=list, description="Component substitute records with explicit approval states"
    )

    @computed_field(return_type=int)
    @property
    def horizon_days(self) -> int:
        """Total inclusive calendar days spanned by the planning horizon."""
        return (self.end_date - self.start_date).days + 1

    @model_validator(mode="after")
    def validate_scenario_constraints(self) -> "PlanningScenario":
        # 1. Single assembly line constraint
        if len(self.assembly_lines) != 1:
            raise ValueError(
                f"Scenario must contain exactly one assembly line, found {len(self.assembly_lines)}"
            )

        # 2. Planning horizon constraint (must cover two weeks / 14 calendar days)
        if self.end_date <= self.start_date:
            raise ValueError(
                f"Invalid date range: start_date ({self.start_date}) must be before end_date ({self.end_date})"
            )

        inclusive_days = (self.end_date - self.start_date).days + 1
        if inclusive_days not in (14, 15):
            raise ValueError(
                f"Planning horizon must cover exactly two weeks (14 days), but covers {inclusive_days} days ({self.start_date} to {self.end_date})"
            )

        # 3. Component referential integrity in BOM
        inventory_comp_ids = {item.component_id for item in self.inventory}
        for bom in self.boms:
            for item in bom.items:
                if item.component_id not in inventory_comp_ids:
                    raise ValueError(
                        f"BOM for product '{bom.product_id}' references unknown component '{item.component_id}'"
                    )

        # 4. Product referential integrity in Production Orders
        bom_product_ids = {bom.product_id for bom in self.boms}
        for order in self.production_orders:
            if order.product_id not in bom_product_ids:
                raise ValueError(
                    f"Production order '{order.order_id}' references unknown product '{order.product_id}'"
                )

            # Order scheduled date must fall within planning horizon
            if not (self.start_date <= order.scheduled_date <= self.end_date):
                raise ValueError(
                    f"Production order '{order.order_id}' scheduled date {order.scheduled_date} outside scenario horizon [{self.start_date}, {self.end_date}]"
                )

        # 5. Substitute original component reference
        for sub in self.substitutes:
            if sub.original_component_id not in inventory_comp_ids:
                raise ValueError(
                    f"Substitute record references unknown original component '{sub.original_component_id}'"
                )

        # 6. Supplier option component reference
        for supp in self.supplier_options:
            if supp.component_id not in inventory_comp_ids:
                raise ValueError(
                    f"Supplier option '{supp.supplier_id}' references unknown component '{supp.component_id}'"
                )

        return self
