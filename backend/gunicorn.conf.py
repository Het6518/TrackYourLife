# gunicorn picks this file up automatically when started from backend/, so it
# applies whatever start command the host uses.

# a song upload streams the file in from the browser and then out to
# Cloudinary inside one request — the 30s default killed it mid-upload,
# which the browser only saw as "Failed to fetch"
timeout = 120

# threads keep the app responsive while some requests are busy uploading or
# streaming media through /api/media/; 2x4 fits a small (512 MB) instance
worker_class = "gthread"
workers = 2
threads = 4
