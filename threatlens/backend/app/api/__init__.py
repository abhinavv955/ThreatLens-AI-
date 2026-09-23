from app.api.dashboard_bp import dashboard_bp
from app.api.analyze_bp import analyze_bp
from app.api.activities_bp import activities_bp
from app.api.alerts_bp import alerts_bp
from app.api.analytics_bp import analytics_bp
from app.api.dataset_bp import dataset_bp
from app.api.model_bp import model_bp
from app.api.report_bp import report_bp
from app.api.advisor_bp import advisor_bp
from app.api.system_bp import system_bp

def register_blueprints(app):
    app.register_blueprint(dashboard_bp, url_prefix="/api")
    app.register_blueprint(analyze_bp, url_prefix="/api")
    app.register_blueprint(activities_bp, url_prefix="/api")
    app.register_blueprint(alerts_bp, url_prefix="/api")
    app.register_blueprint(analytics_bp, url_prefix="/api")
    app.register_blueprint(dataset_bp, url_prefix="/api")
    app.register_blueprint(model_bp, url_prefix="/api")
    app.register_blueprint(report_bp, url_prefix="/api")
    app.register_blueprint(advisor_bp, url_prefix="/api")
    app.register_blueprint(system_bp, url_prefix="/api")
