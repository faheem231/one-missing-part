"""Production orders and assembly line models."""

from datetime import date as dt_date
from enum import Enum
from pydantic import BaseModel, Field, model_validator


class OrderPriority(str, Enum):
    """Priority classifications for production orders."""

    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class ProductionOrder(BaseModel):
    """Manufacturing work order for a customer."""

    order_id: str = Field(..., description="Unique order identifier", min_length=1)
    customer_name: str = Field(..., description="Customer or client organization", min_length=1)
    product_id: str = Field(..., description="Target finished product ID", min_length=1)
    quantity: int = Field(..., gt=0, description="Order quantity units (must be strictly positive)")
    priority: OrderPriority = Field(..., description="Order priority level")
    created_date: dt_date = Field(..., description="Date the order was placed or logged")
    scheduled_date: dt_date = Field(..., description="Current scheduled production run date")
    due_date: dt_date = Field(..., description="Contractual or expected delivery due date")

    @model_validator(mode="after")
    def validate_dates(self) -> "ProductionOrder":
        if self.created_date > self.scheduled_date:
            raise ValueError(
                f"Order {self.order_id}: Created date ({self.created_date}) cannot be after scheduled date ({self.scheduled_date})"
            )
        if self.scheduled_date > self.due_date:
            raise ValueError(
                f"Order {self.order_id}: Scheduled date ({self.scheduled_date}) cannot exceed due date ({self.due_date})"
            )
        return self


class DailyProductionSchedule(BaseModel):
    """Daily allocation on the assembly line."""

    model_config = {"populate_by_name": True}

    schedule_date: dt_date = Field(..., description="Scheduled calendar date", alias="date")
    planned_quantity: int = Field(..., ge=0, description="Units planned for production on this date")



class AssemblyLine(BaseModel):
    """Production assembly line with capacity and operating constraints."""

    line_id: str = Field(..., description="Unique line identifier", min_length=1)
    name: str = Field(..., description="Assembly line name or station", min_length=1)
    daily_capacity: int = Field(..., gt=0, description="Maximum units producible per calendar day")
    scheduled_production: list[DailyProductionSchedule] = Field(
        default_factory=list, description="Day-by-day scheduled output"
    )
    operating_constraints: list[str] = Field(
        default_factory=list, description="Operational limits, shift constraints, changeover rules"
    )

    @model_validator(mode="after")
    def validate_capacity_not_exceeded(self) -> "AssemblyLine":
        for schedule in self.scheduled_production:
            if schedule.planned_quantity > self.daily_capacity:
                raise ValueError(
                    f"Line {self.line_id}: Planned quantity {schedule.planned_quantity} on {schedule.schedule_date} exceeds daily capacity of {self.daily_capacity}"
                )
        return self
