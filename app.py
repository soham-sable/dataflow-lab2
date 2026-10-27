from __future__ import annotations

import json
import os
import re
import tempfile
from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory
from pyspark.sql import SparkSession, functions as F

ROOT = Path(__file__).resolve().parent
app = Flask(__name__, static_folder=None)
app.config["MAX_CONTENT_LENGTH"] = 25 * 1024 * 1024
spark = (
    SparkSession.builder
    .appName("DataFlowLab")
    .master("local[*]")
    .config("spark.ui.enabled", "false")
    .config("spark.sql.shuffle.partitions", "4")
    .getOrCreate()
)
spark.sparkContext.setLogLevel("ERROR")


def normalize(name: str) -> str:
    return re.sub(r"[^a-z]", "", name.lower())


def find_column(columns: list[str], candidates: set[str]) -> str | None:
    return next((name for name in columns if normalize(name) in candidates), None)


def quoted_column(name: str):
    return F.col("`" + name.replace("`", "``") + "`")



@app.get("/healthz")
def healthz():
    return jsonify(status="ok", sparkVersion=spark.version)


@app.get("/")
def index():
    return send_from_directory(ROOT, "index.html")


@app.get("/<path:filename>")
def static_files(filename: str):
    return send_from_directory(ROOT, filename)


@app.route("/api/analyze", methods=["POST", "OPTIONS"])
def analyze():
    if request.method == "OPTIONS":
        return "", 204
    upload = request.files.get("file")
    if upload is None or not upload.filename:
        return jsonify(error="Choose a CSV file to analyze."), 400
    if not upload.filename.lower().endswith(".csv"):
        return jsonify(error="Please upload a .csv file."), 400

    temp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".csv") as temp:
            upload.save(temp)
            temp_path = temp.name

        df = (spark.read.option("header", True)
              .option("inferSchema", True)
              .option("mode", "DROPMALFORMED")
              .csv(temp_path))
        columns = df.columns
        if not columns:
            return jsonify(error="Spark could not find a header row in this CSV."), 400

        amount_col = find_column(columns, {"amount", "sales", "revenue", "total", "value", "price"})
        if not amount_col:
            return jsonify(error="Spark could not find a numeric column named amount, sales, revenue, total, value, or price."), 400

        category_col = find_column(columns, {"category", "productcategory", "product", "item", "type"})
        region_col = find_column(columns, {"region", "city", "country", "location", "state"})
        amount_text = F.regexp_replace(quoted_column(amount_col).cast("string"), r"[$,₹£€\s]", "")
        processed = df.withColumn("__amount", amount_text.cast("double"))
        valid = processed.filter(F.col("__amount").isNotNull())
        summary = valid.agg(F.count("*").alias("count"), F.sum("__amount").alias("total"), F.avg("__amount").alias("average")).first()
        count = int(summary["count"] or 0)
        if count == 0:
            return jsonify(error=f"Spark found “{amount_col}”, but no numeric values to analyze."), 400

        def grouped_totals(column_name: str | None):
            if column_name is None:
                return [{"name": "All records", "value": float(summary["total"] or 0)}]
            label = F.coalesce(F.nullif(F.trim(quoted_column(column_name).cast("string")), F.lit("")), F.lit("Unspecified"))
            rows = (valid.groupBy(label.alias("name"))
                    .agg(F.sum("__amount").alias("value"))
                    .orderBy(F.desc("value"))
                    .limit(12).collect())
            return [{"name": str(row["name"]), "value": float(row["value"] or 0)} for row in rows]

        categories = grouped_totals(category_col)
        regions = grouped_totals(region_col)
        preview_json = valid.drop("__amount").limit(8).toJSON().collect()
        preview = [json.loads(row) for row in preview_json]
        return jsonify(
            recordCount=count,
            totalSales=float(summary["total"] or 0),
            averageSale=float(summary["average"] or 0),
            topCategory=categories[0]["name"],
            topCategorySales=categories[0]["value"],
            categories=categories,
            regions=regions,
            headers=columns,
            rows=preview,
            invalidRows=int(df.count() - count),
            sparkVersion=spark.version,
            engine="Apache Spark / PySpark",
        )
    except Exception as exc:
        app.logger.exception("Spark analysis failed")
        return jsonify(error=f"Spark could not process this CSV: {str(exc)[:240]}"), 500
    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)


if __name__ == "__main__":
    print(f"DataFlow Lab Spark API is ready at http://127.0.0.1:5000 (Spark {spark.version})")
    app.run(host="127.0.0.1", port=5000, debug=False)


