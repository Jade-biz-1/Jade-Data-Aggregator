import logging
from typing import Dict, Any, Optional
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.models.pipeline import Pipeline
from backend.models.pipeline_run import PipelineRun
from backend.models.schema_mapping import SchemaMappingDefinition
from backend.models.transformation import Transformation
from backend.models.pipeline_template import TransformationFunction
from backend.crud.pipeline_run import pipeline_run as crud_pipeline_run
from backend.crud.pipeline import pipeline as crud_pipeline
from backend.schemas.pipeline_run import PipelineRunCreate, PipelineRunUpdate

logger = logging.getLogger(__name__)


class PipelineExecutionError(Exception):
    """Custom exception for pipeline execution errors."""
    pass


def _safe_float(value: object) -> float:
    try:
        return float(value)  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return 0.0


def _typed_row(row: dict) -> dict:
    """Return a copy of the row with numeric strings auto-converted to int/float."""
    out = {}
    for k, v in row.items():
        try:
            out[k] = int(v)
            continue
        except (TypeError, ValueError):
            pass
        try:
            out[k] = float(v)
            continue
        except (TypeError, ValueError):
            pass
        out[k] = v
    return out


def _make_expr_builtins() -> dict:
    """Return the safe built-ins exposed to map expression eval."""
    import math as _math

    def _substr(s, start: int, length: int = None):  # type: ignore[assignment]
        s = str(s) if s is not None else ""
        return s[start: start + length] if length is not None else s[start:]

    def _coalesce(*args):
        for a in args:
            if a is not None and a != "":
                return a
        return ""

    def _if_null(val, default):
        return default if (val is None or val == "") else val

    def _split(s, sep, idx: int = None):  # type: ignore[assignment]
        parts = str(s).split(sep)
        return parts[idx] if idx is not None else parts

    def _concat(*args):
        return "".join("" if a is None else str(a) for a in args)

    def _pad_left(s, width: int, fill: str = " "):
        return str(s).rjust(width, fill)

    def _pad_right(s, width: int, fill: str = " "):
        return str(s).ljust(width, fill)

    return {
        # string
        "upper":      lambda s: str(s).upper() if s is not None else "",
        "lower":      lambda s: str(s).lower() if s is not None else "",
        "trim":       lambda s: str(s).strip() if s is not None else "",
        "ltrim":      lambda s: str(s).lstrip() if s is not None else "",
        "rtrim":      lambda s: str(s).rstrip() if s is not None else "",
        "length":     lambda s: len(str(s)) if s is not None else 0,
        "len":        lambda s: len(str(s)) if s is not None else 0,
        "substr":     _substr,
        "substring":  _substr,
        "concat":     _concat,
        "replace":    lambda s, old, new: str(s).replace(old, new) if s is not None else "",
        "title":      lambda s: str(s).title() if s is not None else "",
        "capitalize": lambda s: str(s).capitalize() if s is not None else "",
        "split":      _split,
        "pad_left":   _pad_left,
        "pad_right":  _pad_right,
        # math
        "abs":        abs,
        "round":      round,
        "floor":      _math.floor,
        "ceil":       _math.ceil,
        "sqrt":       _math.sqrt,
        "pow":        pow,
        "mod":        lambda a, b: a % b,
        # null / coerce
        "coalesce":   _coalesce,
        "if_null":    _if_null,
        # type casts
        "str":        str,
        "int":        int,
        "float":      float,
        "bool":       bool,
        # constants
        "None":       None,
        "True":       True,
        "False":      False,
    }


_EXPR_BUILTINS = _make_expr_builtins()


def _eval_expr(expr: str, row: dict, custom_fns: dict | None = None):
    """
    Evaluate a Python-like expression against a row dict.

    The evaluation context contains:
    - Built-in functions (upper, lower, concat, round, …)
    - Custom functions from the Function Library (called as fn(row) or fn(value))
    - Column values spread as bare names (e.g. price, name)
    - 'row' bound to the full typed row dict so Function Library callables
      (which use row.get("field")) can be invoked as fn(row) in expressions.

    Falls back to a plain column lookup if the expression is just a bare name.
    """
    typed = _typed_row(row)
    ctx = {**_EXPR_BUILTINS, **(custom_fns or {}), **typed, "row": typed}
    try:
        return eval(expr, {"__builtins__": {}}, ctx)  # noqa: S307
    except Exception:
        # bare column name that failed as an expression → direct lookup
        return row.get(expr, "")


def _apply_filter_condition(rows: list, condition: str, include: bool = True) -> list:
    """
    Evaluate a Python-like boolean expression against each row.
    Column names in the condition are replaced by their row values.
    Rows where the condition evaluates True are kept (include=True) or dropped (include=False).
    On any evaluation error the row is kept.
    """
    result = []
    for row in rows:
        typed = _typed_row(row)
        try:
            match = bool(eval(condition, {"__builtins__": {}}, typed))  # noqa: S307
        except Exception:
            match = True
        if match == include:
            result.append(row)
    return result


def _is_numeric_col(rows: list, col: str) -> bool:
    """Return True if the majority of non-empty values in a column look numeric."""
    samples = [r.get(col) for r in rows[:20] if r.get(col) not in (None, "")]
    if not samples:
        return False
    numeric = sum(1 for s in samples if _safe_float(s) != 0.0 or str(s) == "0")
    return numeric > len(samples) / 2


def _resolve_output_path(configured_path: str, pipeline_name: str) -> tuple[str, bool]:
    """
    Return (resolved_path, was_remapped).
    Paths accessible from Docker (under /app/ or /tmp/) are used as-is.
    macOS host paths (/Users/, /home/, etc.) are remapped to /app/uploads/.
    """
    import os
    if not configured_path:
        safe = "".join(c for c in pipeline_name if c.isalnum() or c in ("_", "-")).lower()
        return f"/app/uploads/{safe}_output.csv", False

    # Paths that Docker can write to
    docker_roots = ("/app/", "/tmp/")
    if any(configured_path.startswith(r) for r in docker_roots):
        return configured_path, False

    # Host path — remap to /app/uploads/ preserving just the filename
    filename = os.path.basename(configured_path) or (
        "".join(c for c in pipeline_name if c.isalnum() or c in ("_", "-")).lower() + "_output.csv"
    )
    return f"/app/uploads/{filename}", True


class PipelineExecutor:
    """Service for executing data pipelines."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def execute_pipeline(
        self,
        pipeline_id: int,
        execution_config: Optional[Dict[str, Any]] = None,
        triggered_by: str = "manual"
    ) -> PipelineRun:
        """
        Execute a pipeline and return the run record.

        Args:
            pipeline_id: ID of the pipeline to execute
            execution_config: Runtime configuration overrides
            triggered_by: How the pipeline was triggered (manual, scheduled, webhook)

        Returns:
            PipelineRun: The created pipeline run record

        Raises:
            PipelineExecutionError: If pipeline execution fails
        """
        # Get the pipeline
        pipeline = await crud_pipeline.get(self.db, id=pipeline_id)
        if not pipeline:
            raise PipelineExecutionError(f"Pipeline {pipeline_id} not found")

        if not pipeline.is_active:
            raise PipelineExecutionError(f"Pipeline {pipeline_id} is not active")

        # Create the run record
        run_create = PipelineRunCreate(
            pipeline_id=pipeline_id,
            status="running",
            execution_config=execution_config,
            triggered_by=triggered_by
        )

        run = await crud_pipeline_run.create(self.db, obj_in=run_create)
        await self.db.commit()

        try:
            # Execute the pipeline (this is where the actual data processing would happen)
            await self._execute_pipeline_logic(run, pipeline)

            # Update run as completed
            run_update = PipelineRunUpdate(
                status="completed",
                completed_at=datetime.utcnow()
            )
            run = await crud_pipeline_run.update(self.db, db_obj=run, obj_in=run_update)
            await self.db.commit()

        except Exception as e:
            logger.error(f"Pipeline {pipeline_id} execution failed: {str(e)}")

            # Update run as failed
            run_update = PipelineRunUpdate(
                status="failed",
                error_message=str(e),
                completed_at=datetime.utcnow()
            )
            run = await crud_pipeline_run.update(self.db, db_obj=run, obj_in=run_update)
            await self.db.commit()
            raise PipelineExecutionError(f"Pipeline execution failed: {str(e)}")

        return run

    async def _execute_pipeline_logic(self, run: PipelineRun, pipeline: Pipeline):
        """Execute pipeline: extract from source, transform, load to destination."""
        import csv
        import os

        source_config = pipeline.source_config or {}
        dest_config = pipeline.destination_config or {}
        transformation_config = pipeline.transformation_config or {}
        log_lines: list[str] = []

        def log(msg: str) -> None:
            log_lines.append(msg)
            logger.info("Pipeline %s: %s", pipeline.id, msg)

        # ── Load custom functions from Function Library ───────────────────────
        custom_fns: dict = {}
        try:
            fn_result = await self.db.execute(
                select(TransformationFunction).where(TransformationFunction.is_builtin == False)  # noqa: E712
            )
            _safe_fn_builtins = {
                "__builtins__": {
                    "len": len, "str": str, "int": int, "float": float,
                    "list": list, "dict": dict, "sum": sum, "min": min,
                    "max": max, "sorted": sorted, "enumerate": enumerate, "zip": zip,
                }
            }
            for fn in fn_result.scalars().all():
                try:
                    fn_globals = dict(_safe_fn_builtins)
                    exec(fn.function_code, fn_globals)  # noqa: S102
                    if fn.name in fn_globals and callable(fn_globals[fn.name]):
                        custom_fns[fn.name] = fn_globals[fn.name]
                except Exception as fn_err:
                    logger.warning("Could not load custom function '%s': %s", fn.name, fn_err)
            if custom_fns:
                log(f"Loaded {len(custom_fns)} custom function(s): {', '.join(custom_fns)}")
        except Exception as load_err:
            logger.warning("Could not load custom functions: %s", load_err)

        # ── 1. Extract ────────────────────────────────────────────────────────
        connector_id = source_config.get("config", {}).get("connector_id")
        if not connector_id:
            raise ValueError("No connector_id in source configuration")

        from backend.crud.connector import connector as crud_connector
        connector = await crud_connector.get(self.db, id=int(connector_id))
        if not connector:
            raise ValueError(f"Source connector {connector_id} not found")

        log(f"Source: {connector.name} ({connector.connector_type})")

        rows: list[dict] = []
        headers: list[str] = []

        if connector.connector_type == "csv_file":
            file_path: str = connector.config.get("file_path", "")
            if not os.path.exists(file_path):
                raise ValueError(f"Source file not found: {file_path}")

            encoding = connector.config.get("encoding", "utf-8")
            delimiter = connector.config.get("delimiter", ",")
            has_header = connector.config.get("has_header", True)
            skip_rows = int(connector.config.get("skip_rows", 0))

            with open(file_path, "r", encoding=encoding, newline="") as f:
                for _ in range(skip_rows):
                    next(f, None)
                if has_header:
                    reader = csv.DictReader(f, delimiter=delimiter)
                    rows = [dict(r) for r in reader]
                    headers = list(reader.fieldnames or [])
                else:
                    raw = list(csv.reader(f, delimiter=delimiter))
                    headers = [f"col_{i}" for i in range(len(raw[0]))] if raw else []
                    rows = [dict(zip(headers, r)) for r in raw]

            log(f"Read {len(rows)} rows from {file_path}")

        elif connector.connector_type == "postgresql":
            import asyncpg

            src_cfg = source_config.get("config", {})
            query_type = src_cfg.get("query_type", "table")

            if query_type == "query":
                sql = (src_cfg.get("query") or "").strip()
                if not sql:
                    raise ValueError("Database source: custom query is empty")
            else:
                table_name = (src_cfg.get("table_name") or "").strip()
                if not table_name:
                    raise ValueError("Database source: table name is not configured")
                schema = connector.config.get("schema", "public")
                sql = f'SELECT * FROM "{schema}"."{table_name}"'

            ssl_req = connector.config.get("ssl_mode", "disable") in (
                "require", "verify-ca", "verify-full"
            )
            pg_conn = await asyncpg.connect(
                host=connector.config.get("host", "db"),
                port=int(connector.config.get("port", 5432)),
                database=connector.config.get("database"),
                user=connector.config.get("username"),
                password=connector.config.get("password"),
                ssl=ssl_req,
                timeout=30,
            )
            try:
                records = await pg_conn.fetch(sql)
            except Exception as pg_err:
                await pg_conn.close()
                raise ValueError(f"PostgreSQL query failed: {pg_err}") from pg_err
            finally:
                try:
                    await pg_conn.close()
                except Exception:
                    pass

            if records:
                headers = list(records[0].keys())
                rows = [dict(r) for r in records]
            else:
                headers = []
                rows = []

            short_sql = sql[:80] + ("…" if len(sql) > 80 else "")
            log(f"Read {len(rows)} rows from PostgreSQL ({short_sql})")
            if not rows:
                log("Warning: query returned 0 rows — check that the table exists and contains data")

        elif connector.connector_type == "mysql":
            raise ValueError(
                "MySQL extraction is not yet implemented"
            )

        else:
            raise ValueError(
                f"Extraction not implemented for connector type: {connector.connector_type}"
            )

        # ── 2. Transform ──────────────────────────────────────────────────────
        processed_rows = rows

        # Collect transformation nodes from visual_definition (preferred) or
        # fall back to the legacy structured transformation_config.filters list.
        visual_def = pipeline.visual_definition or {}
        transform_nodes = [
            n for n in (visual_def.get("nodes") or [])
            if n.get("type") == "transformation"
        ]

        applied_any = False
        for tnode in transform_nodes:
            node_data = tnode.get("data", {})
            ttype = node_data.get("transformationType", "")
            cfg = node_data.get("config") or {}

            if ttype == "filter":
                condition = cfg.get("condition", "").strip()
                filter_type = cfg.get("filter_type", "include")
                if condition:
                    before = len(processed_rows)
                    processed_rows = _apply_filter_condition(
                        processed_rows, condition, include=(filter_type == "include")
                    )
                    applied_any = True
                    log(f"Filter '{condition}' ({filter_type}): {before} → {len(processed_rows)} rows")

            elif ttype == "sort":
                sort_by = cfg.get("sort_by", "")
                order = cfg.get("order", "asc")
                if sort_by:
                    reverse = order == "desc"
                    processed_rows = sorted(
                        processed_rows,
                        key=lambda r: (_safe_float(r.get(sort_by)) if _is_numeric_col(processed_rows, sort_by) else str(r.get(sort_by, ""))),
                        reverse=reverse,
                    )
                    applied_any = True
                    log(f"Sort by '{sort_by}' {order}: {len(processed_rows)} rows")

            elif ttype == "map":
                mappings_raw = cfg.get("mappings", "")
                drop_unmapped = cfg.get("drop_unmapped", False)
                if mappings_raw:
                    import json as _json
                    try:
                        parsed = _json.loads(mappings_raw) if isinstance(mappings_raw, str) else mappings_raw

                        # Accept two storage formats:
                        # 1. Array (new UI): [{source: "old_col", target: "new_col"}, ...]
                        # 2. Dict (legacy JSON textarea): {"new_col": "old_col", ...}
                        if isinstance(parsed, list):
                            mappings: dict = {
                                item["target"]: item["source"]
                                for item in parsed
                                if item.get("source") and item.get("target")
                            }
                        elif isinstance(parsed, dict):
                            mappings = parsed
                        else:
                            raise ValueError("Mappings must be a list or object")

                        if not mappings:
                            log("Map: no valid field mappings configured — skipping")
                        else:
                            new_rows = []
                            # Identify which source tokens are plain column names
                            # (used to decide what to keep when drop_unmapped=False)
                            plain_sources = {
                                expr for expr in mappings.values()
                                if processed_rows and expr in processed_rows[0]
                            }
                            for r in processed_rows:
                                new_r = {}
                                for new_col, expr in mappings.items():
                                    new_r[new_col] = _eval_expr(expr, r, custom_fns)
                                if not drop_unmapped:
                                    for k, v in r.items():
                                        if k not in plain_sources and k not in new_r:
                                            new_r[k] = v
                                new_rows.append(new_r)
                            processed_rows = new_rows
                            if new_rows:
                                headers = list(new_rows[0].keys())
                            applied_any = True
                            log(f"Map applied {len(mappings)} field mapping(s): "
                                + ", ".join(f"({expr})→{t}" for t, expr in mappings.items()))
                    except Exception as e:
                        log(f"Warning: map transformation failed: {e}")

            elif ttype == "schema_mapping":
                mapping_id = cfg.get("mapping_id")
                if mapping_id:
                    result = await self.db.execute(
                        select(SchemaMappingDefinition).filter(
                            SchemaMappingDefinition.id == int(mapping_id)
                        )
                    )
                    mapping_def = result.scalar_one_or_none()
                    if mapping_def and mapping_def.field_mappings:
                        new_rows = []
                        for row in processed_rows:
                            new_row = dict(row)
                            for fm in mapping_def.field_mappings:
                                mtype = fm.get("mapping_type", "direct")
                                dest = fm.get("destination_field")
                                trans = fm.get("transformation") or {}
                                if not dest:
                                    continue
                                if mtype == "direct":
                                    src = fm.get("source_field")
                                    if src:
                                        new_row[dest] = row.get(src)
                                elif mtype == "concat":
                                    sources = trans.get("source_fields", [fm.get("source_field")])
                                    sep = trans.get("separator", " ")
                                    new_row[dest] = sep.join(
                                        str(row.get(s) or "") for s in sources if s
                                    )
                                elif mtype == "split":
                                    src = fm.get("source_field")
                                    sep = trans.get("separator", " ")
                                    idx = int(trans.get("index", 0))
                                    parts = str(row.get(src) or "").split(sep)
                                    new_row[dest] = parts[idx] if idx < len(parts) else None
                            new_rows.append(new_row)
                        processed_rows = new_rows
                        applied_any = True
                        log(
                            f"Schema mapping '{mapping_def.name}' applied "
                            f"{len(mapping_def.field_mappings)} field mapping(s)"
                        )
                    elif not mapping_def:
                        log(f"Warning: schema mapping ID {mapping_id} not found — skipping")

            elif ttype == "saved_transformation":
                t_id = cfg.get("transformation_id")
                if t_id:
                    t_result = await self.db.execute(
                        select(Transformation).filter(Transformation.id == int(t_id))
                    )
                    t = t_result.scalar_one_or_none()
                    if not t:
                        log(f"Warning: saved transformation ID {t_id} not found — skipping")
                    elif not t.is_active:
                        log(f"Warning: saved transformation '{t.name}' is inactive — skipping")
                    else:
                        rules = t.transformation_rules or {}
                        ttype_saved = t.transformation_type

                        if ttype_saved == "filter":
                            condition = rules.get("condition", "")
                            field = rules.get("field", "")
                            operator = rules.get("operator", "equals")
                            value = rules.get("value")
                            before = len(processed_rows)
                            if condition:
                                processed_rows = _apply_filter_condition(processed_rows, condition)
                            elif field and value is not None:
                                _ops = {
                                    "equals":      lambda r: str(r.get(field, "")) == str(value),
                                    "not_equals":  lambda r: str(r.get(field, "")) != str(value),
                                    "contains":    lambda r: str(value).lower() in str(r.get(field, "")).lower(),
                                    "starts_with": lambda r: str(r.get(field, "")).lower().startswith(str(value).lower()),
                                    "greater_than": lambda r: _safe_float(r.get(field)) > _safe_float(value),
                                    "less_than":   lambda r: _safe_float(r.get(field)) < _safe_float(value),
                                    "is_null":     lambda r: r.get(field) is None or r.get(field) == "",
                                    "is_not_null": lambda r: r.get(field) is not None and r.get(field) != "",
                                }
                                fn = _ops.get(operator, _ops["equals"])
                                processed_rows = [r for r in processed_rows if fn(r)]
                            applied_any = True
                            log(f"Saved transformation '{t.name}' (filter): {before} → {len(processed_rows)} rows")

                        elif ttype_saved == "map":
                            mapping_rules = rules if rules else []
                            if isinstance(mapping_rules, list):
                                mappings_dict = {
                                    item["target"]: item["source"]
                                    for item in mapping_rules
                                    if item.get("source") and item.get("target")
                                }
                            elif isinstance(mapping_rules, dict):
                                mappings_dict = mapping_rules
                            else:
                                mappings_dict = {}
                            if mappings_dict:
                                new_rows = []
                                for r in processed_rows:
                                    new_r = dict(r)
                                    for target, expr in mappings_dict.items():
                                        new_r[target] = _eval_expr(expr, r, custom_fns)
                                    new_rows.append(new_r)
                                processed_rows = new_rows
                                applied_any = True
                                log(f"Saved transformation '{t.name}' (map): {len(mappings_dict)} field mapping(s)")

                        elif ttype_saved in ("deduplication", "deduplicate"):
                            unique_fields = rules.get("unique_fields") or t.source_fields or []
                            if unique_fields:
                                seen: set = set()
                                new_rows = []
                                before = len(processed_rows)
                                for r in processed_rows:
                                    key = tuple(str(r.get(f, "")) for f in unique_fields)
                                    if key not in seen:
                                        seen.add(key)
                                        new_rows.append(r)
                                processed_rows = new_rows
                                applied_any = True
                                log(f"Saved transformation '{t.name}' (dedup on {unique_fields}): {before} → {len(processed_rows)} rows")

                        elif ttype_saved == "sort":
                            sort_by = rules.get("sort_by") or (t.source_fields[0] if t.source_fields else None)
                            order = rules.get("order", "asc")
                            if sort_by:
                                is_num = _is_numeric_col(processed_rows, sort_by)
                                processed_rows = sorted(
                                    processed_rows,
                                    key=lambda r: (_safe_float(r.get(sort_by)) if is_num else str(r.get(sort_by, ""))),
                                    reverse=(order == "desc"),
                                )
                                applied_any = True
                                log(f"Saved transformation '{t.name}' (sort by '{sort_by}' {order})")

                        elif ttype_saved == "aggregate":
                            from collections import defaultdict as _dd
                            group_by = rules.get("group_by", [])
                            aggregations = rules.get("aggregations", [])
                            if group_by and aggregations:
                                groups: dict = _dd(list)
                                for r in processed_rows:
                                    key = tuple(str(r.get(f, "")) for f in group_by)
                                    groups[key].append(r)
                                new_rows = []
                                for key, g_rows in groups.items():
                                    new_r = {group_by[i]: key[i] for i in range(len(group_by))}
                                    for agg in aggregations:
                                        agg_field = agg.get("field")
                                        agg_fn = agg.get("function", "sum").lower()
                                        alias = agg.get("alias", f"{agg_fn}_{agg_field}")
                                        vals = [_safe_float(r.get(agg_field, 0)) for r in g_rows]
                                        if agg_fn == "sum":
                                            new_r[alias] = sum(vals)
                                        elif agg_fn == "count":
                                            new_r[alias] = len(g_rows)
                                        elif agg_fn in ("avg", "mean"):
                                            new_r[alias] = sum(vals) / len(vals) if vals else 0
                                        elif agg_fn == "min":
                                            new_r[alias] = min(vals) if vals else None
                                        elif agg_fn == "max":
                                            new_r[alias] = max(vals) if vals else None
                                    new_rows.append(new_r)
                                processed_rows = new_rows
                                applied_any = True
                                log(f"Saved transformation '{t.name}' (aggregate): {len(processed_rows)} group(s)")
                        else:
                            log(f"Warning: transformation type '{ttype_saved}' not supported in executor — skipping")

        # Legacy structured filters (transformation_config.filters)
        if not applied_any:
            filter_rules = transformation_config.get("filters", []) if transformation_config else []
            for rule in filter_rules:
                field = rule.get("field")
                operator = rule.get("operator", "eq")
                value = rule.get("value")
                if not field or value is None:
                    continue
                before = len(processed_rows)
                if operator == "eq":
                    processed_rows = [r for r in processed_rows if str(r.get(field, "")) == str(value)]
                elif operator == "neq":
                    processed_rows = [r for r in processed_rows if str(r.get(field, "")) != str(value)]
                elif operator == "contains":
                    processed_rows = [r for r in processed_rows if str(value).lower() in str(r.get(field, "")).lower()]
                elif operator == "gt":
                    processed_rows = [r for r in processed_rows if _safe_float(r.get(field)) > _safe_float(value)]
                elif operator == "lt":
                    processed_rows = [r for r in processed_rows if _safe_float(r.get(field)) < _safe_float(value)]
                log(f"Filter '{field} {operator} {value}': {before} → {len(processed_rows)} rows")
                applied_any = True

        if not applied_any:
            log("No transformations configured — passing all rows through")

        # ── 3. Load ───────────────────────────────────────────────────────────
        dest_type = dest_config.get("type", "file")

        if dest_type == "file":
            original_path: str = dest_config.get("config", {}).get("file_path", "")
            output_path, remapped = _resolve_output_path(original_path, pipeline.name)
            os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
            if remapped:
                log(f"Note: destination '{original_path}' is not writable from the server; "
                    f"writing to '{output_path}' instead")

            effective_headers = headers or (list(processed_rows[0].keys()) if processed_rows else [])
            with open(output_path, "w", newline="", encoding="utf-8") as f:
                writer = csv.DictWriter(f, fieldnames=effective_headers, extrasaction="ignore")
                writer.writeheader()
                writer.writerows(processed_rows)

            log(f"Output written: {output_path}")
            log(f"Records written: {len(processed_rows)}")

        elif dest_type in ("database", "unknown") or dest_config.get("destinationType") == "database":
            from backend.crud.connector import connector as crud_connector
            dest_connector_id = dest_config.get("config", {}).get("connector_id")
            if not dest_connector_id:
                raise ValueError("No connector_id in destination configuration")

            dest_connector = await crud_connector.get(self.db, id=int(dest_connector_id))
            if not dest_connector:
                raise ValueError(f"Destination connector {dest_connector_id} not found")

            if dest_connector.connector_type == "postgresql":
                import asyncpg

                table_name = (dest_config.get("config", {}).get("table_name") or "").strip()
                write_mode = dest_config.get("config", {}).get("write_mode", "insert")
                unique_key = (dest_config.get("config", {}).get("unique_key") or "").strip()
                dest_schema = dest_connector.config.get("schema", "public")

                if not table_name:
                    raise ValueError("Destination table name is not configured")

                ssl_req = dest_connector.config.get("ssl_mode", "disable") in (
                    "require", "verify-ca", "verify-full"
                )
                pg_conn = await asyncpg.connect(
                    host=dest_connector.config.get("host", "db"),
                    port=int(dest_connector.config.get("port", 5432)),
                    database=dest_connector.config.get("database"),
                    user=dest_connector.config.get("username"),
                    password=dest_connector.config.get("password"),
                    ssl=ssl_req,
                    timeout=30,
                )
                try:
                    fq_table = f'"{dest_schema}"."{table_name}"'

                    if write_mode == "replace":
                        await pg_conn.execute(f"TRUNCATE TABLE {fq_table}")
                        log(f"Truncated {fq_table} (replace mode)")

                    if processed_rows:
                        cols = list(processed_rows[0].keys())
                        col_sql = ", ".join(f'"{c}"' for c in cols)
                        placeholders = ", ".join(f"${i + 1}" for i in range(len(cols)))
                        values = [[r.get(c) for c in cols] for r in processed_rows]

                        if write_mode == "upsert" and unique_key:
                            update_set = ", ".join(
                                f'"{c}" = EXCLUDED."{c}"'
                                for c in cols if c != unique_key
                            )
                            sql_stmt = (
                                f'INSERT INTO {fq_table} ({col_sql}) VALUES ({placeholders}) '
                                f'ON CONFLICT ("{unique_key}") DO UPDATE SET {update_set}'
                            )
                        else:
                            sql_stmt = f"INSERT INTO {fq_table} ({col_sql}) VALUES ({placeholders})"

                        await pg_conn.executemany(sql_stmt, values)

                    log(f"Wrote {len(processed_rows)} rows to {fq_table} (mode: {write_mode})")
                finally:
                    await pg_conn.close()
            else:
                log(f"Warning: destination connector type '{dest_connector.connector_type}' not yet implemented")

        else:
            log(f"Warning: destination type '{dest_type}' not yet implemented — data not persisted")

        # ── 4. Persist stats & logs ───────────────────────────────────────────
        run_update = PipelineRunUpdate(
            records_processed=len(processed_rows),
            records_failed=0,
            logs="\n".join(log_lines),
        )
        await crud_pipeline_run.update(self.db, db_obj=run, obj_in=run_update)
        await self.db.commit()

        logger.info(
            "Pipeline %s (%s) completed: %d records processed",
            pipeline.id, pipeline.name, len(processed_rows)
        )

    async def cancel_run(self, run_id: int) -> PipelineRun:
        """Cancel a running pipeline."""
        run = await crud_pipeline_run.get(self.db, id=run_id)
        if not run:
            raise PipelineExecutionError(f"Pipeline run {run_id} not found")

        if run.status not in ["queued", "running"]:
            raise PipelineExecutionError(f"Cannot cancel run {run_id} with status {run.status}")

        run_update = PipelineRunUpdate(
            status="cancelled",
            completed_at=datetime.utcnow(),
            error_message="Cancelled by user"
        )

        run = await crud_pipeline_run.update(self.db, db_obj=run, obj_in=run_update)
        await self.db.commit()

        return run

    async def retry_run(self, run_id: int) -> PipelineRun:
        """Retry a failed or cancelled pipeline run."""
        original = await crud_pipeline_run.get(self.db, id=run_id)
        if not original:
            raise PipelineExecutionError(f"Pipeline run {run_id} not found")

        if original.status not in ("failed", "cancelled"):
            raise PipelineExecutionError(
                f"Cannot retry run {run_id} with status '{original.status}'. "
                "Only failed or cancelled runs can be retried."
            )

        return await self.execute_pipeline(
            pipeline_id=original.pipeline_id,
            execution_config=original.execution_config,
            triggered_by=f"retry:{original.triggered_by or 'manual'}"
        )

    async def get_run_status(self, run_id: int) -> Optional[PipelineRun]:
        """Get the status of a pipeline run."""
        return await crud_pipeline_run.get(self.db, id=run_id)

    async def get_pipeline_runs(
        self,
        pipeline_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> list[PipelineRun]:
        """Get all runs for a pipeline."""
        return await crud_pipeline_run.get_by_pipeline(
            self.db,
            pipeline_id=pipeline_id,
            skip=skip,
            limit=limit
        )