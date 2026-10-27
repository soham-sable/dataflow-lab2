# DataFlow Lab — Apache Spark project

This hands-on project uses **Apache Spark (PySpark)** to process CSV data. The JavaScript dashboard sends the selected file to a local Python API. PySpark reads the CSV as a Spark DataFrame, cleans the amount column, aggregates sales by category and region, and returns summary metrics and a small preview to the dashboard.

## Requirements

- Python 3.10 or newer
- Java 17 or newer, with `JAVA_HOME` configured
- VS Code (recommended)

The current Apache PySpark installation guide lists Python 3.10+ and Java 17+ as requirements and supports installing PySpark from PyPI: [Apache Spark installation guide](https://spark.apache.org/docs/latest/api/python/getting_started/install.html).

## First-time setup in VS Code (Windows)

1. Open the `big-data-frameworks` folder—the one containing `index.html` and `app.py`.
2. Open **Terminal → New Terminal**.
3. Create a Python environment and install dependencies:

   ```powershell
   python -m venv .venv
   .venv\Scripts\Activate.ps1
   python -m pip install -r requirements.txt
   ```

4. Start the Spark API:

   ```powershell
   python app.py
   ```

   Keep this terminal running. The first Spark startup may take a little while.

5. Open `http://127.0.0.1:5000` in your browser. The Python app serves the page and connects it to Spark, so Live Server is not needed.
6. Click **Run analysis**. Upload a CSV to process your own data.

## CSV columns

A CSV must include a header and a numeric column named `amount`, `sales`, `revenue`, `total`, `value`, or `price`. Optional category fields include `category`, `product`, or `item`; optional region fields include `region`, `city`, `country`, `location`, or `state`.

## What Spark does

The service uses a local Spark session (`local[*]`) and Spark SQL DataFrame operations to read, cast, filter, count, sum, average, and group records. This runs a genuine Spark job on your computer, while local mode uses one machine. A cluster can be configured later. Uploaded CSVs are written to a temporary file for Spark to read and deleted after analysis; they are not sent to a remote service.


