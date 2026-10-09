import logging
from fastapi import FastAPI, HTTPException, Query, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.data.sample_scenario import get_sample_scenario
from backend.models.analysis import ShortageAnalysisReport
from backend.models.decisions import (
    CurrentDecisionResponse,
    DecisionApprovalRequest,
    DecisionOptionsResponse,
    DecisionRecord,
    RecommendationExplanationResponse,
    ScoringWeights,
)
from backend.models.scenario import PlanningScenario
from backend.services.approval_service import approval_store
from backend.services.decision_engine import evaluate_all_decisions
from backend.services.explanation_service import generate_recommendation_explanation
from backend.services.shortage_engine import analyze_scenario_shortage

logger = logging.getLogger("one_missing_part_api")

app = FastAPI(
    title="One Missing Part API",
    description="Manufacturing shortage decision-support backend API.",
    version="0.1.0",
)

# Allowed origins for frontend local development
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Basic global exception handler for unexpected server errors."""
    logger.error("Unhandled error for %s %s: %s", request.method, request.url.path, exc, exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"},
    )

@app.get("/api/health", tags=["Health"])
async def health_check() -> dict[str, str]:
    """Health check endpoint returning service status."""
    return {"status": "healthy"}


@app.get(
    "/api/scenario",
    response_model=PlanningScenario,
    tags=["Scenario"],
    summary="Get baseline manufacturing planning scenario",
    description="Returns the deterministic two-week planning scenario for the single assembly line.",
)
async def get_scenario() -> PlanningScenario:
    """Retrieve the active two-week manufacturing scenario."""
    return get_sample_scenario()


@app.get(
    "/api/shortage",
    response_model=ShortageAnalysisReport,
    tags=["Shortage Analysis"],
    summary="Analyze component shortages and affected customer orders",
    description=(
        "Executes deterministic shortage analysis for the current scenario. Identifies deficit components, "
        "allocates stock to customer orders by priority/due date, and calculates feasible production."
    ),
)
async def get_shortage_analysis() -> ShortageAnalysisReport:
    """Perform deterministic shortage analysis and return detailed impact report."""
    scenario = get_sample_scenario()
    return analyze_scenario_shortage(scenario)


@app.get(
    "/api/decisions/options",
    response_model=DecisionOptionsResponse,
    tags=["Decision Support"],
    summary="Evaluate and rank mitigation decision strategies",
    description=(
        "Evaluates four deterministic shortage response options (Partial Production, Schedule Swap, "
        "Approved Substitution, Expedited Supply). Scores options across delivery, cost, and operational "
        "feasibility with configurable weights, and recommends the top-ranked feasible strategy."
    ),
)
async def get_decision_options(
    weight_delivery: float = Query(
        default=0.50, ge=0.0, le=1.0, description="Relative weight for customer delivery fulfillment"
    ),
    weight_cost: float = Query(
        default=0.30, ge=0.0, le=1.0, description="Relative weight for incremental cost efficiency"
    ),
    weight_ops: float = Query(
        default=0.20, ge=0.0, le=1.0, description="Relative weight for operational feasibility"
    ),
) -> DecisionOptionsResponse:
    """Evaluate and rank all four candidate mitigation strategies."""
    try:
        weights = ScoringWeights(
            weight_delivery=weight_delivery,
            weight_cost=weight_cost,
            weight_ops=weight_ops,
        )
        scenario = get_sample_scenario()
        return evaluate_all_decisions(scenario, weights)
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(err),
        ) from err


@app.get(
    "/api/decisions/explanation",
    response_model=RecommendationExplanationResponse,
    tags=["Decision Support"],
    summary="Retrieve structured explanation for decision recommendation",
    description=(
        "Returns a detailed, evidence-based narrative explaining why the top strategy was selected, "
        "its supporting metrics, cost/delivery impact, risks, assumptions, data limitations, "
        "and comparative justification against lower-ranked options."
    ),
)
async def get_recommendation_explanation(
    weight_delivery: float = Query(
        default=0.50, ge=0.0, le=1.0, description="Relative weight for customer delivery fulfillment"
    ),
    weight_cost: float = Query(
        default=0.30, ge=0.0, le=1.0, description="Relative weight for incremental cost efficiency"
    ),
    weight_ops: float = Query(
        default=0.20, ge=0.0, le=1.0, description="Relative weight for operational feasibility"
    ),
) -> RecommendationExplanationResponse:
    """Generate structured recommendation narrative based on decision engine output."""
    try:
        weights = ScoringWeights(
            weight_delivery=weight_delivery,
            weight_cost=weight_cost,
            weight_ops=weight_ops,
        )
        scenario = get_sample_scenario()
        return generate_recommendation_explanation(scenario, weights)
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(err),
        ) from err


@app.post(
    "/api/decisions/approve",
    response_model=DecisionRecord,
    status_code=status.HTTP_200_OK,
    tags=["Decision Support"],
    summary="Record simulated approval or rejection of a decision strategy",
    description=(
        "Validates and records an approval or rejection for a specific mitigation strategy. "
        "Rejects unknown strategy IDs and forbids approving operationally infeasible options. "
        "Applies documented repeated-action audit policies."
    ),
)
async def approve_decision_strategy(payload: DecisionApprovalRequest) -> DecisionRecord:
    """Record simulated reviewer action on candidate decision strategy."""
    scenario = get_sample_scenario()
    try:
        return approval_store.record_decision(payload, scenario)
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(err),
        ) from err


@app.get(
    "/api/decisions/current",
    response_model=CurrentDecisionResponse,
    tags=["Decision Support"],
    summary="Retrieve current decision approval status",
    description=(
        "Returns the active decision audit record and status. "
        "If no approval action has been submitted yet, returns a clear pending response."
    ),
)
async def get_current_decision() -> CurrentDecisionResponse:
    """Retrieve active decision status or pending state."""
    return approval_store.get_current_decision()




