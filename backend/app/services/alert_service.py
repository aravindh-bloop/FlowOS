from sqlalchemy.orm import Session
from app.models.alert import Alert, Notification, AlertSeverity, NotificationType
from datetime import datetime

def create_alert(db: Session, alert_type: str, severity: AlertSeverity, title: str, message: str, department_id: int = None):
    alert = Alert(
        alert_type=alert_type,
        severity=severity,
        title=title,
        message=message,
        department_id=department_id,
        auto_generated=True
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert

def get_alerts(db: Session):
    return db.query(Alert).filter(Alert.is_active == True).order_by(Alert.created_at.desc()).all()

def acknowledge_alert(db: Session, alert_id: int, user_id: int):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if alert:
        alert.is_acknowledged = True
        alert.acknowledged_by = user_id
        alert.acknowledged_at = datetime.utcnow()
        alert.is_active = False
        db.commit()
        db.refresh(alert)
    return alert

def get_notifications(db: Session):
    return db.query(Notification).order_by(Notification.created_at.desc()).all()

def create_notification(db: Session, title: str, message: str, notification_type: NotificationType):
    notification = Notification(title=title, message=message, notification_type=notification_type)
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification
