# Deploy DataFlow Lab with Apache Spark

The simplest public deployment for this project is a Docker-based web service. The Dockerfile installs Java 17, Python, PySpark, and Gunicorn, and the container serves both the dashboard and Spark API from one URL.

## Before deployment

1. Put the `big-data-frameworks` project folder in a GitHub repository. The repository root should contain `Dockerfile`, `app.py`, `requirements.txt`, `index.html`, `app.js`, and `styles.css`.
2. Create a Render account and connect that repository.
3. Create a **Web Service** and select the **Docker** runtime. Render will build the included Dockerfile and detect the web port from `PORT`.
4. Select a machine with at least 2 GB RAM for a more reliable Spark demo. Spark runs a JVM in addition to Python and Flask. Render's free web service has 512 MB RAM and spins down after 15 minutes without traffic, so it may not have enough memory for Spark and will have a cold start.
5. Deploy, then open the `onrender.com` URL Render gives you. Upload a small CSV first.

This uses Spark local mode on one machine. It is a public web demo, not a Spark cluster. On public deployment, an uploaded CSV is sent to that hosting service for processing. The app stores it temporarily and deletes the temporary file after analysis; files are not retained as project data.

## Render references

- [Deploy Docker on Render](https://render.com/docs/docker)
- [Render web services and port binding](https://render.com/docs/web-services)
- [Render free service limits](https://render.com/docs/free)
