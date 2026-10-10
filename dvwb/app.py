"""Local Utsav participant portal used as an intentionally vulnerable DVWB.

Only fictional data is used. Run on localhost or an isolated training network.
The four intentional vulnerabilities are SQL injection, IDOR, path traversal,
and broken access control.
"""
from __future__ import annotations

import hashlib
import html
import logging
import os
import secrets
from pathlib import Path

from fastapi import FastAPI, Form, Request
from fastapi.responses import HTMLResponse, PlainTextResponse, RedirectResponse, Response
from fastapi.staticfiles import StaticFiles
from sqlalchemy import ForeignKey, String, create_engine, event, inspect, text
from sqlalchemy.exc import OperationalError, SQLAlchemyError
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, sessionmaker
from urllib.parse import quote

BASE = Path(__file__).resolve().parent
TRAINING_FILES = BASE / "training_files"
PUBLIC_FILES = TRAINING_FILES / "public"
PRIVATE_FILES = TRAINING_FILES / "private"
DATABASE_URL = os.getenv("DVWB_DATABASE_URL", f"sqlite:///{BASE / 'dvwb.sqlite3'}")
IS_SQLITE = DATABASE_URL.startswith("sqlite")
SQLITE_CONNECT_ARGS = {"check_same_thread": False, "timeout": 15} if IS_SQLITE else {}
engine = create_engine(
    DATABASE_URL,
    connect_args=SQLITE_CONNECT_ARGS,
    pool_pre_ping=True,
)
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)
logger = logging.getLogger("dvwb.database")

if IS_SQLITE:
    @event.listens_for(engine, "connect")
    def _configure_sqlite_connection(dbapi_connection, _connection_record):
        # Make lock waits bounded and consistently enforce declared foreign keys.
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA busy_timeout=15000")
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    # WAL lets readers continue while another request writes a session or setting.
    # Some network/shared filesystems don't support WAL; continue with SQLite's
    # default journal in that case rather than preventing the app from starting.
    try:
        with engine.connect() as connection:
            connection.exec_driver_sql("PRAGMA journal_mode=WAL")
    except SQLAlchemyError:
        logger.warning("Could not enable SQLite WAL mode; continuing with default journal", exc_info=True)
app = FastAPI(title="Utsav Participant Portal", docs_url=None, redoc_url=None)
app.mount("/static", StaticFiles(directory=BASE / "static"), name="static")


class Base(DeclarativeBase):
    pass


class Participant(Base):
    __tablename__ = "participants"
    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(60), unique=True, index=True)
    display_name: Mapped[str] = mapped_column(String(80))
    password_hash: Mapped[str] = mapped_column(String(200))
    # Fictional plaintext credential exists only to make this isolated SQLi lab realistic.
    password_plain: Mapped[str] = mapped_column(String(100), default="")
    role: Mapped[str] = mapped_column(String(30), default="participant")


class PortalSession(Base):
    __tablename__ = "portal_sessions"
    token: Mapped[str] = mapped_column(String(100), primary_key=True)
    participant_id: Mapped[int] = mapped_column(ForeignKey("participants.id"), index=True)


class Product(Base):
    __tablename__ = "portal_products"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    category: Mapped[str] = mapped_column(String(50))
    description: Mapped[str] = mapped_column(String(300))
    price: Mapped[int] = mapped_column(default=0)


class PortalRecord(Base):
    __tablename__ = "portal_records"
    id: Mapped[int] = mapped_column(primary_key=True)
    owner: Mapped[str] = mapped_column(String(60), index=True)
    title: Mapped[str] = mapped_column(String(120))
    detail: Mapped[str] = mapped_column(String(500))


class DashboardView(Base):
    __tablename__ = "portal_dashboard_views"
    id: Mapped[int] = mapped_column(primary_key=True)
    view_type: Mapped[str] = mapped_column(String(30))
    title: Mapped[str] = mapped_column(String(120))
    description: Mapped[str] = mapped_column(String(300))


class PortalSetting(Base):
    __tablename__ = "portal_settings"
    id: Mapped[int] = mapped_column(primary_key=True)
    key: Mapped[str] = mapped_column(String(60), unique=True)
    value: Mapped[str] = mapped_column(String(200))


FLAG_TEXT = "you are in the right path"
FLAG_OCTAL_STAGE_ONE = "".join(f"{ord(char):03o}" for char in FLAG_TEXT)
FLAG_OCTAL_STAGE_TWO = " ".join(f"{ord(char):03o}" for char in FLAG_OCTAL_STAGE_ONE)


def digest(password: str, salt: str) -> str:
    return hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 180_000).hex()


def initialize_db() -> None:
    Base.metadata.create_all(engine)
    # Upgrade existing workshop databases in place. SQLAlchemy create_all does
    # not add newly introduced columns to an already-created SQLite table.
    participant_columns = {column["name"] for column in inspect(engine).get_columns("participants")}
    if "password_plain" not in participant_columns:
        with engine.begin() as connection:
            connection.execute(text("ALTER TABLE participants ADD COLUMN password_plain VARCHAR(100) NOT NULL DEFAULT ''"))
    with SessionLocal() as db:
        accounts = [
            ("participant.asha", "Asha Nair", "utsav-learn", "participant"),
            ("participant.rohan", "Rohan Das", "utsav-learn", "participant"),
            ("participant.kabir", "Kabir Menon", "utsav-learn", "participant"),
            ("participant.nila", "Nila Joseph", "utsav-learn", "participant"),
            ("participant.dev", "Dev Patel", "utsav-learn", "participant"),
            ("organizer.team", "Cyber Defence Team", "portal-coach", "organizer"),
        ]
        for username, display, password, role in accounts:
            account = db.query(Participant).filter_by(username=username).first()
            if account is None:
                salt = secrets.token_hex(16)
                db.add(Participant(username=username, display_name=display,
                                   password_hash=f"{salt}${digest(password, salt)}",
                                   password_plain=password, role=role))
            elif account.password_plain != password:
                # Keep the documented demo credentials in sync after upgrades.
                account.password_plain = password
        products = [
            ("Utsav Field Journal", "Stationery", "A compact notebook for session notes.", 180),
            ("ACE Signal Pin", "Accessories", "A small enamel portal-community pin.", 120),
            ("Workshop Tote", "Accessories", "Reusable canvas event tote.", 350),
            ("Session Pass Holder", "Supplies", "A clear badge holder with lanyard.", 90),
            ("Notebook Set", "Stationery", "Three ruled notebooks for session notes.", 260),
            ("Insulated Bottle", "Supplies", "Reusable stainless-steel bottle.", 540),
            ("Desk Cable Kit", "Accessories", "A small cable organizer for laptop setups.", 190),
            ("Event Lanyard", "Supplies", "Woven lanyard with participant badge clip.", 75),
            ("Pen Pack", "Stationery", "Four smooth-writing black ink pens.", 110),
            ("Workshop Planner", "Stationery", "A weekly planner with session notes pages.", 320),
            ("Archive Edition Journal", "Stationery", "Limited stock · Archive imprint: " + FLAG_OCTAL_STAGE_TWO, 295),
            ("Travel Mug", "Supplies", "Double-wall mug with spill-resistant lid.", 480),
            ("Badge Reel", "Accessories", "Retractable badge holder for event credentials.", 130),
            ("Sticky Note Set", "Stationery", "Color-coded notes for workshop planning.", 95),
            ("Laptop Sleeve", "Accessories", "Padded sleeve for laptops up to 14 inches.", 680),
            ("USB-C Adapter", "Electronics", "Compact multiport adapter for presentation rooms.", 890),
        ]
        for name, category, description, price in products:
            if not db.query(Product).filter_by(name=name).first():
                db.add(Product(name=name, category=category, description=description, price=price))
        # Refresh the archive imprint as well as seeding it. Existing local
        # databases otherwise retain the previous, incorrectly encoded value.
        archive_item = db.query(Product).filter_by(name="Archive Edition Journal").first()
        if archive_item:
            archive_item.description = "Limited stock · Archive imprint: " + FLAG_OCTAL_STAGE_TWO
        dashboard_views = [
            (1, "participant", "Participant overview", "Hello, participants. Your event information is gathered here."),
            (2, "president", "President portal", "Confidential office workspace and event operations."),
        ]
        for view_id, view_type, title, description in dashboard_views:
            view = db.get(DashboardView, view_id)
            if view is None:
                db.add(DashboardView(id=view_id, view_type=view_type, title=title, description=description))
            else:
                view.view_type, view.title, view.description = view_type, title, description
        records = [
            ("participant.asha", "Registration receipt", "Participant Asha Nair · General access · Status: confirmed"),
            ("participant.asha", "Workshop selection", "Secure Web Foundations · Seat A-14"),
            ("participant.asha", "Event pass", "UTSAV-26-A14 · General access · Hall 2"),
            ("participant.rohan", "Registration receipt", "Participant Rohan Das · General access · Status: confirmed"),
            ("participant.rohan", "Workshop selection", "Network Essentials · Seat B-09"),
            ("participant.rohan", "Event pass", "UTSAV-26-B09 · General access · Hall 2"),
            ("participant.kabir", "Registration receipt", "Participant Kabir Menon · General access · Status: confirmed"),
            ("participant.kabir", "Workshop selection", "Secure Web Foundations · Seat C-12"),
            ("participant.kabir", "Event pass", "UTSAV-26-C12 · General access · Hall 2"),
            ("participant.nila", "Registration receipt", "Participant Nila Joseph · General access · Status: confirmed"),
            ("participant.nila", "Workshop selection", "Network Essentials · Seat A-06"),
            ("participant.nila", "Event pass", "UTSAV-26-A06 · General access · Hall 2"),
            ("participant.dev", "Registration receipt", "Participant Dev Patel · General access · Status: confirmed"),
            ("participant.dev", "Workshop selection", "Secure Web Foundations · Seat B-18"),
            ("participant.dev", "Event pass", "UTSAV-26-B18 · General access · Hall 2"),
            ("organizer.team", "Organizer schedule", "Operations schedule · Staff copy"),
        ]
        for owner, title, detail in records:
            if not db.query(PortalRecord).filter_by(owner=owner, title=title).first():
                db.add(PortalRecord(owner=owner, title=title, detail=detail))
        if not db.query(PortalSetting).filter_by(key="notice").first():
            db.add(PortalSetting(key="notice", value="Welcome to the Utsav participant portal."))
        if not db.query(PortalSetting).filter_by(key="venue").first():
            db.add(PortalSetting(key="venue", value="ACE Learning Centre · Hall 2"))
        if not db.query(PortalSetting).filter_by(key="schedule_note").first():
            db.add(PortalSetting(key="schedule_note", value="Workshop rooms open 15 minutes before each session."))
        if not db.query(PortalSetting).filter_by(key="president_last_action").first():
            db.add(PortalSetting(key="president_last_action", value="No executive action has been recorded."))
        db.commit()


initialize_db()

CSS = r"""
:root{--ink:#18231f;--forest:#293630;--paper:#f1eee5;--white:#fbf9f3;--line:#d8d3c7;--muted:#6e7770;--rust:#bb4b2f;--rust-dark:#93391f;--lime:#d6e18b;--wash:#eef1d8}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:14px/1.6 'Segoe UI',Arial,sans-serif}a{color:inherit}button,input{font:inherit}button{cursor:pointer}.portal-header{position:sticky;top:0;z-index:5;display:flex;justify-content:space-between;align-items:center;gap:18px;padding:11px clamp(18px,4vw,52px);background:var(--ink);color:#f7f4ec;border-bottom:1px solid #ffffff20}.portal-brand{display:flex;align-items:center;gap:10px;text-decoration:none;font-weight:700;letter-spacing:.08em}.brand-symbol{display:grid;place-items:center;width:34px;height:34px;border:1px solid #d6e18b70;border-radius:50%;background:#111;color:var(--lime)}.portal-brand small{display:block;color:#b9c0b5;font:9px Consolas,monospace;letter-spacing:.1em}.portal-head-right{display:flex;gap:14px;align-items:center}.portal-user{color:#ccd1c8;font-size:12px}.logout{padding:7px 11px;border:1px solid #718075;border-radius:3px;background:transparent;color:#fff}.portal-wrap{width:min(1260px,calc(100% - 36px));margin:24px auto 50px}.portal-grid{display:grid;grid-template-columns:205px minmax(0,1fr);gap:24px}.sidenav{position:sticky;top:72px;align-self:start;padding:10px;border:1px solid var(--line);background:#eae7de}.sidenav-label{margin:5px 8px;color:#757b70;font:9px Consolas,monospace;letter-spacing:.08em}.sidenav a{display:flex;gap:8px;align-items:center;margin:2px 0;padding:8px;color:#465349;text-decoration:none;font-size:12px}.sidenav a:hover,.sidenav a.active{background:#dce2d5;color:#25382e;box-shadow:inset 3px 0 #a74f35}.nav-ico{width:22px;color:#526354}.main{min-width:0}.welcome{display:flex;justify-content:space-between;align-items:center;gap:18px;padding:22px 26px;border-left:4px solid var(--rust);background:var(--forest);color:#f7f4ec}.welcome h1{margin:5px 0;font:36px/1.1 Georgia,serif}.welcome p{margin:0;color:#d0d6cc}.eyebrow,.tag{color:#64725e;font:9px Consolas,monospace;letter-spacing:.07em;text-transform:uppercase}.welcome .eyebrow{color:var(--lime)}.avatar{display:grid;place-items:center;width:48px;height:48px;border:1px solid #a89b69;border-radius:50%;background:#1b2922;color:#e0d49d;font:18px Georgia,serif}.section-title{display:flex;justify-content:space-between;align-items:end;margin:26px 0 12px;padding-bottom:8px;border-bottom:1px solid var(--line)}.section-title h2{margin:0;font:21px Georgia,serif}.section-title small{color:#777b72;font:9px Consolas,monospace}.tiles{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:0;border-top:1px solid var(--line);border-left:1px solid var(--line)}.tile,.panel{padding:17px;border-right:1px solid var(--line);border-bottom:1px solid var(--line);background:var(--white)}.tile{display:block;min-height:128px;text-decoration:none}.tile:hover{background:#f3f0e7}.tile-ico{display:block;margin-bottom:10px;color:#48594b}.tile h3,.panel h3{margin:0 0 6px;font-size:15px}.tile p,.panel p,.panel li{color:#606960;font-size:12px}.panel{margin:0 0 14px}.panel h2{font:20px Georgia,serif}.two-col{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.tag{display:inline-block;margin-bottom:8px;padding:4px 7px;border:1px solid #d4d0c4;background:#eeece2}.button{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 14px;border:1px solid var(--rust-dark);border-radius:3px;background:var(--rust);color:white;text-decoration:none;font-size:12px;font-weight:700}.button:hover{background:var(--rust-dark)}.button.light{border-color:var(--line);background:#fbf9f3;color:var(--ink)}.field{display:grid;gap:6px;margin:13px 0;color:#56645b;font:10px Consolas,monospace;text-transform:uppercase}.field input{min-height:40px;padding:9px;border:1px solid #c8cdbf;background:white;color:var(--ink);font:13px 'Segoe UI',sans-serif}.field input:focus{outline:2px solid #bb4b2f50}.wide{width:100%}.result,.notice{margin:12px 0;padding:12px;border:1px solid var(--line);border-left:3px solid #687d6a;background:#f3f1e9;overflow-wrap:anywhere}.result.exposed{border-left-color:var(--rust);background:#f7ebe4}.notice{border-left-color:#a89b69;background:#eeece2}.data-table{width:100%;border-collapse:collapse;font-size:12px}.data-table th,.data-table td{padding:9px 7px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}.data-table th{color:#687166;font:9px Consolas,monospace;text-transform:uppercase}.price{color:#8e452f;font-weight:bold}.record-id{color:#74796e;font:10px Consolas,monospace}.row{display:flex;gap:9px;align-items:center;flex-wrap:wrap}.status{color:#527057;font:9px Consolas,monospace}.portal-footer{padding:20px;text-align:center;color:#777b72;font:9px Consolas,monospace}.login-page{min-height:100vh;display:grid;grid-template-columns:1fr 1fr}.login-story{position:relative;display:flex;flex-direction:column;justify-content:space-between;overflow:hidden;padding:clamp(30px,7vw,90px);background:var(--ink);color:#f6f3e9}.login-story:before{position:absolute;content:'';inset:0;background:url('/static/asciee-logo-circle.svg') no-repeat 92% 25%/min(30vw,320px);opacity:.07;mix-blend-mode:screen;pointer-events:none}.login-story:after{position:absolute;content:'';right:7%;bottom:5%;width:170px;height:170px;background:url('/static/ace-cybersecurity-logo.jpeg') center/contain no-repeat;opacity:.1;mix-blend-mode:screen;pointer-events:none}.brand-mark{position:relative;z-index:1;font-weight:700;letter-spacing:.1em}.brand-mark small{display:block;color:#aab4ac;font:9px Consolas,monospace}.story-copy{position:relative;z-index:1;max-width:580px}.story-copy h1{font:clamp(38px,5vw,64px)/1.03 Georgia,serif}.story-copy p{max-width:470px;color:#c0c8bd}.login-story .eyebrow{color:var(--lime)}.story-foot{position:relative;z-index:1;color:#aab4ac;font:10px Consolas,monospace}.login-side{display:grid;grid-template-columns:minmax(260px,440px) minmax(220px,1fr);align-content:center;align-items:center;gap:18px;padding:clamp(18px,3vw,42px);background:var(--paper)}.login-card{padding:26px;border:1px solid var(--line);background:var(--white)}.login-card h2{margin:5px 0;font:24px Georgia,serif}.muted{color:var(--muted);font-size:12px}.demo-creds{margin-top:16px;padding:11px;background:#eeece2;font-size:11px}.login-error{padding:10px;background:#f7ebe4;color:#8f3c25}.lab-page{display:grid;grid-template-columns:minmax(0,1fr) 280px;gap:18px;align-items:start}.lab-help{position:sticky;top:76px;padding:15px;border:1px solid #d7d2c7;border-top:3px solid #a89b69;background:#eae7de}.lab-help .lab-title{margin:0 0 12px;font:18px Georgia,serif}.lab-help .lab-field{margin:12px 0 4px;color:#697267;font:9px Consolas,monospace;text-transform:uppercase}.lab-help code{display:block;overflow-wrap:anywhere;padding:9px;border:1px solid var(--line);background:#f8f6ef;font:11px/1.5 Consolas,monospace;white-space:pre-wrap}.lab-help p{margin:4px 0 9px;color:#535f55;font-size:11px}.lab-disclaimer{padding-top:9px;border-top:1px solid var(--line)}.login-side .lab-help{position:relative;top:auto}@media(max-width:1000px){.login-page{grid-template-columns:1fr}.login-story{min-height:280px}.login-side{grid-template-columns:minmax(0,440px) minmax(230px,1fr)}}@media(max-width:780px){.login-side,.lab-page{grid-template-columns:1fr}.lab-help{position:static;grid-row:1}.portal-grid{grid-template-columns:1fr}.sidenav{position:static;display:flex;overflow:auto}.sidenav-label{display:none}.sidenav a{flex:0 0 auto}.sidenav a span:last-child{display:none}.tiles{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:560px){.portal-wrap{width:calc(100% - 22px);margin-top:12px}.portal-header{padding:10px 12px}.portal-user{display:none}.tiles,.two-col{grid-template-columns:1fr}.login-side{padding:14px}.login-story{min-height:250px;padding:26px}.welcome h1{font-size:29px}}
"""

CSS += r"""
:root{--ink:#191916;--forest:#29271f;--paper:#e9e4d7;--white:#f3efe5;--line:#60553a;--muted:#aaa28d;--rust:#a9472e;--rust-dark:#81321f;--lime:#c4ad69;--wash:#302e25}
body{background:#121210;color:#e9e4d7}.portal-header{background:#191916;border-color:#665b40}.portal-brand small{color:#c4b995}.brand-symbol{border-color:#9d8651;background:#111;color:#d8c58f}.portal-user{color:#c6beaa}.logout{border-color:#887348}.portal-wrap{color:#e9e4d7}.sidenav{border-color:#5b513a;background:#211f19}.sidenav-label{color:#b6aa8b}.sidenav a{color:#d2c9b4}.sidenav a:hover,.sidenav a.active{background:#302e25;color:#f3efe5;box-shadow:inset 3px 0 #a9472e}.nav-ico{color:#d8c58f}.welcome{border:1px solid #74613a;border-left:4px solid #a9472e;background:#211f19;color:#f3efe5}.welcome p{color:#c8c0ad}.welcome .eyebrow{color:#d8c58f}.avatar{border-color:#9d8651;background:#191916;color:#d8c58f}.section-title{border-color:#665b40}.section-title h2{color:#f3efe5}.section-title small{color:#b9ae90}.tiles{border-color:#5b513a}.tile,.panel{border-color:#514a37;background:#211f19;color:#e9e4d7}.tile:hover{background:#2b2921}.tile-ico,.tag{color:#d8c58f}.tile p,.panel p,.panel li{color:#c8c0ad}.tag{border-color:#776743;background:#302e25}.button{border-color:#81321f;background:#a9472e;color:#fff8e9}.button.light{border-color:#746443;background:#24221c;color:#f3efe5}.field{color:#d1c6a4}.field input{border-color:#64583d;background:#151512;color:#f3efe5}.result,.notice{border-color:#655b42;background:#27251e;color:#e9e4d7}.result.exposed{border-left-color:#a9472e;background:#32241e}.notice{border-left-color:#c4ad69;background:#29271f}.data-table{color:#e9e4d7}.data-table th,.data-table td{border-color:#514a37}.data-table th{background:#302e25;color:#d8c58f}.price{color:#d8c58f}.record-id{color:#c2b899}.status{color:#d5c48d}.portal-footer{border-color:#514a37;color:#aaa28d}.login-story{background:#191916}.login-story:before{background:url('/static/asciee-logo-circle.svg') no-repeat 91% 22%/min(30vw,340px);opacity:.09}.login-story:after{background-image:url('/static/ace-cybersecurity-logo.jpeg');opacity:.13}.login-side{background:#121210}.login-card{border-color:#62573b;background:#211f19;color:#e9e4d7}.login-card h2{color:#f3efe5}.muted{color:#b9b09a}.login-error{background:#39251f;color:#f2c1ae}.lab-help{border-color:#746443;border-top-color:#a9472e;background:#211f19;color:#d6ceba}.lab-help .eyebrow,.lab-help .lab-field{color:#d8c58f}.lab-help .lab-title{color:#f3efe5}.lab-help p{color:#c8c0ad}.lab-help code{border-color:#5d543d;background:#151512;color:#eee5d0}.lab-disclaimer{border-color:#514a37;color:#b9ae90}
@media(max-width:780px){.portal-grid{gap:10px}.sidenav{background:#211f19}.login-story:before{background-size:210px}.login-story:after{width:130px;height:130px}}
"""

CSS += r"""
body,button,input{font-family:'IBM Plex Sans','Segoe UI',Arial,sans-serif}
h1,h2,h3,.welcome h1,.section-title h2,.story-copy h1,.login-card h2,.lab-help .lab-title{font-family:'IBM Plex Serif',Georgia,'Times New Roman',serif}
.portal-brand{font-family:'IBM Plex Sans','Segoe UI',Arial,sans-serif}
code,.record-id,.sidenav-label,.section-title small,.lab-help .lab-field{font-family:'IBM Plex Mono',Consolas,monospace}
/* Crop each organization seal to a true circle; never show the source canvas. */
.login-story{isolation:isolate}
.login-story:before{inset:auto;top:17%;right:5%;width:min(29vw,300px);height:min(29vw,300px);border:1px solid #c4ad6940;border-radius:50%;clip-path:circle(50%);background:url('/static/asciee-logo-circle.svg') center/cover no-repeat;opacity:.11;mix-blend-mode:screen;pointer-events:none}
.login-story:after{right:8%;bottom:5%;width:min(18vw,175px);height:min(18vw,175px);border:1px solid #c4ad6940;border-radius:50%;clip-path:circle(50%);background:url('/static/ace-cybersecurity-logo.jpeg') center/cover no-repeat;opacity:.13;mix-blend-mode:screen;pointer-events:none}
@media(max-width:780px){.login-story:before{top:10%;right:4%;width:180px;height:180px}.login-story:after{right:5%;bottom:4%;width:112px;height:112px}}
"""

# The login route is the first page participants see. Keep its visual language
# aligned with The Forge: dark iron panels, restrained brass rules, and rust
# actions. These final selectors deliberately override the legacy portal CSS.
CSS += r"""
html,body{min-height:100%;background:#121210;color:#e9e4d7}
.login-page{min-height:100vh;grid-template-columns:minmax(0,1fr) minmax(0,1fr);background:#121210}
.login-story{min-height:100vh;padding:clamp(28px,5vw,72px);background:#191916;color:#f3efe5;border-right:1px solid #665b40}
.login-story:before,.login-story:after{content:"";position:absolute;display:block;overflow:hidden;border:1px solid #c4ad6940;border-radius:50%;clip-path:circle(50%);background-position:center;background-repeat:no-repeat;background-size:cover;mix-blend-mode:screen;pointer-events:none}
.login-story:before{inset:auto;top:17%;right:7%;width:clamp(150px,20vw,260px);aspect-ratio:1;background-image:url('/static/asciee-logo-circle.svg');opacity:.12}
.login-story:before{display:none!important;content:none!important;background:none!important}
.login-story:after{inset:8% 7% auto auto;width:clamp(72px,9vw,112px);aspect-ratio:1;background-image:url('/static/ace-cybersecurity-logo.jpeg');background-size:contain;opacity:.11}
.brand-mark{font:700 15px/1.2 'IBM Plex Sans','Segoe UI',sans-serif;letter-spacing:.14em;text-transform:uppercase}
.brand-mark small{margin-top:5px;color:#c4ad69;font:10px/1.4 'IBM Plex Mono',Consolas,monospace;letter-spacing:.1em}
.story-copy{max-width:620px}
.story-copy h1{max-width:600px;margin:.3em 0;font:clamp(44px,5.4vw,76px)/.98 'IBM Plex Serif',Georgia,serif;letter-spacing:-.035em}
.story-copy p:not(.eyebrow){max-width:490px;color:#c8c0ad;font-size:16px;line-height:1.65}
.login-story .eyebrow{color:#c4ad69}
.story-foot{color:#aaa28d;font:10px 'IBM Plex Mono',Consolas,monospace;letter-spacing:.08em}
.login-side{min-height:100vh;grid-template-columns:minmax(250px,430px) minmax(220px,310px);justify-content:center;gap:20px;padding:clamp(20px,3vw,44px);background:#121210}
.login-card{padding:clamp(22px,2.4vw,34px);border:1px solid #62573b;background:#211f19;color:#e9e4d7;box-shadow:0 16px 42px #0003}
.login-card h2{font:500 30px/1.15 'IBM Plex Serif',Georgia,serif;color:#f3efe5}
.login-card .eyebrow{color:#c4ad69}
.muted{color:#b9b09a}
.field{color:#d1c6a4}
.field input{border:1px solid #64583d;background:#151512;color:#f3efe5}
.field input:focus{outline:2px solid #a9472e80}
.button{border-color:#81321f;background:#a9472e;color:#fff8e9}
.lab-help{border:1px solid #746443;border-top:3px solid #a9472e;background:#211f19;color:#d6ceba}
.lab-help .eyebrow,.lab-help .lab-field{color:#d8c58f}
.lab-help .lab-title{color:#f3efe5}
.lab-help p{color:#c8c0ad}
.lab-help code{border-color:#5d543d;background:#151512;color:#eee5d0}
.lab-disclaimer{border-color:#514a37;color:#b9ae90}
.guide-section{margin:14px 0 0;padding-top:11px;border-top:1px solid #514a37}
.guide-section h3{margin:0 0 5px;color:#d8c58f;font:600 10px/1.4 'IBM Plex Mono',Consolas,monospace;letter-spacing:.07em;text-transform:uppercase}
.guide-section p{margin:0;color:#d2c9b7;font-size:12px;line-height:1.55}
.guide-section code{display:block;overflow-wrap:anywhere;padding:9px;border:1px solid #5d543d;background:#151512;color:#eee5d0;font:11px/1.5 'IBM Plex Mono',Consolas,monospace;white-space:pre-wrap}
.lab-help{max-height:calc(100vh - 94px);overflow-y:auto}
.guide-step{min-height:124px;margin:10px 0;padding:12px;border:1px solid #514a37;background:#191916}
.guide-step[hidden]{display:none}
.guide-step h3{margin:0 0 8px;color:#d8c58f;font:600 10px/1.4 'IBM Plex Mono',Consolas,monospace;letter-spacing:.07em;text-transform:uppercase}
.guide-step p{margin:0;color:#d2c9b7;font-size:12px;line-height:1.55}
.guide-step code{display:block;overflow-wrap:anywhere;padding:9px;border:1px solid #5d543d;background:#151512;color:#eee5d0;font:11px/1.5 'IBM Plex Mono',Consolas,monospace;white-space:pre-wrap}
.guide-progress{margin:10px 0 7px;color:#b9ae90;font:9px 'IBM Plex Mono',Consolas,monospace;letter-spacing:.05em;text-transform:uppercase}
.guide-controls{display:flex;justify-content:space-between;gap:8px}
.guide-controls button{min-height:34px;padding:5px 10px;border:1px solid #746443;background:#24221c;color:#f3efe5;font-size:11px}
.guide-controls button:hover:not(:disabled){background:#302e25}
.guide-controls button:disabled{opacity:.45;cursor:default}
.file-preview{margin:0;overflow-wrap:anywhere;white-space:pre-wrap;color:inherit;font:12px/1.65 'IBM Plex Mono',Consolas,monospace}
.file-open-card{max-width:760px;padding:clamp(20px,3vw,34px)}
.file-open-card h2{margin:.25em 0;font:500 28px/1.15 'IBM Plex Serif',Georgia,serif}
.file-meta{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0;margin:20px 0;border-top:1px solid #514a37;border-left:1px solid #514a37}
.file-meta div{min-width:0;padding:11px;border-right:1px solid #514a37;border-bottom:1px solid #514a37}
.file-meta dt{color:#d8c58f;font:9px 'IBM Plex Mono',Consolas,monospace;text-transform:uppercase}
.file-meta dd{margin:4px 0 0;overflow-wrap:anywhere;color:#e9e4d7;font-size:12px}
@media(max-width:520px){.file-meta{grid-template-columns:1fr}}
.login-side{min-width:0;grid-template-columns:minmax(0,430px) minmax(0,310px);gap:14px}
.login-card{min-width:0;padding:22px 24px}
.login-card .field{margin:9px 0}
.login-guide{min-width:0;align-self:center}
.login-guide>summary{padding:16px;border:1px solid #746443;border-top:3px solid #a9472e;background:#211f19;color:#d6ceba;cursor:pointer;list-style:none}
.login-guide>summary::-webkit-details-marker{display:none}
.login-guide-title{display:block;margin:0 0 8px;color:#f3efe5;font:500 19px/1.2 'IBM Plex Serif',Georgia,serif}
.login-guide-definition{display:block;color:#c8c0ad;font-size:12px;line-height:1.55}
.login-guide-toggle{display:block;margin-top:10px;color:#d8c58f;font:10px 'IBM Plex Mono',Consolas,monospace;text-transform:uppercase}
.login-guide-toggle:after{content:'  +'}
.login-guide[open] .login-guide-toggle:after{content:'  −'}
.login-guide[open]{max-height:68vh;overflow:auto}
.login-guide[open] .lab-help{margin-top:10px}
@media(max-width:1000px){.login-page{grid-template-columns:1fr}.login-story{min-height:42vh}.login-side{min-height:auto;grid-template-columns:minmax(0,430px) minmax(220px,310px)}}
@media(max-width:700px){.login-story{min-height:300px;padding:28px}.login-side{grid-template-columns:1fr;padding:16px}.login-side .lab-help{grid-row:auto}.login-story:before{top:12%;right:5%;width:150px}.login-story:after{right:7%;bottom:5%;width:100px}.story-copy h1{max-width:470px;font-size:48px}}
@media(max-width:1000px){.login-page{min-height:100vh;grid-template-columns:1fr;grid-template-rows:clamp(210px,30vh,270px) auto;align-content:start}.login-story{height:clamp(210px,30vh,270px);min-height:0;padding:22px clamp(24px,6vw,64px)}.story-copy h1{font-size:clamp(40px,5vw,52px)}.story-copy p:not(.eyebrow){font-size:14px;line-height:1.45}.story-foot{font-size:9px}.login-side{width:100%;grid-template-columns:minmax(0,430px) minmax(0,310px);justify-content:center;align-items:center;padding:16px 24px 24px}}
@media(max-width:700px){.login-page{grid-template-rows:clamp(190px,28vh,230px) auto}.login-story{height:clamp(190px,28vh,230px);min-height:0;padding:18px 22px}.story-copy h1{max-width:none;margin:7px 0;font-size:40px}.story-copy p:not(.eyebrow){max-width:490px;margin:4px 0;font-size:13px}.story-foot{display:none}.login-story:after{inset:14px 18px auto auto;width:64px}.login-side{grid-template-columns:1fr;gap:12px;padding:12px 16px 20px}.login-card{padding:15px 19px}.login-card h2{font-size:25px}.login-card .muted{margin:4px 0}.login-card .field{margin:7px 0}.login-card .field input{min-height:36px}.login-guide>summary{padding:12px}.login-guide-definition{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.login-guide .lab-help{padding:14px}}
"""

GUIDES = {
    "sqli": {
        "name": "SQL injection",
        "definition": "SQL injection is a vulnerability in which an application inserts untrusted input into an SQL statement as text. The database then parses part of that input as SQL syntax, so the input can change what the query means.",
        "where": "This portal demonstrates it in the sign-in form and the Utsav store and Service centre search forms. Each form sends a value to a route that constructs SQL using string interpolation.",
        "payload": "At sign-in, enter x' OR 1=1 -- as the username and leave the password empty. In a search box, try ' OR 1=1 --. These examples target only this local fictional portal.",
        "backend": "The sign-in handler builds a WHERE clause containing the submitted username and password. Search handlers place the submitted term inside SQL LIKE expressions. The database receives a completed statement whose structure includes the user input.",
        "mechanism": "In the login example, the apostrophe closes the SQL string containing the username. OR 1=1 adds a condition that is true, and the SQL comment marker makes the rest of that line ignored by SQLite. The query can therefore return a participant row even though the submitted value is not a real username.",
        "observe": "A successful login creates a normal portal session and redirects to the participant overview. A search may return rows that do not match the literal characters typed. Compare this with an ordinary name search to see the difference between data and query syntax.",
        "distinction": "This is different from a page merely displaying unusual text. The vulnerability exists because the database interprets the input while parsing a query. It is a server-side query construction problem.",
        "impact": "Depending on the query and database permissions, SQL injection can bypass a login check, reveal records, or change stored data. This exercise uses synthetic records and is restricted to the local portal.",
        "control": "Use parameterized queries so user input is sent as a value and cannot alter SQL structure. Apply the same rule to every query, use least-privilege database accounts, and avoid exposing raw database errors.",
    },
    "idor": {
        "name": "IDOR · Insecure Direct Object Reference",
        "definition": "IDOR (Insecure Direct Object Reference) is an object-level authorization flaw. An application uses a direct identifier—such as a record number—to find an object, but fails to check whether the signed-in user is allowed to access that particular object.",
        "where": "The participant dashboard selects a dashboard view from the `view` value in its URL. Registration and event-pass details also accept numeric record IDs.",
        "payload": "In the address bar, replace only `participant` with `president` in this URL, then press Enter: http://127.0.0.1:8002/dashboard?view=participant → http://127.0.0.1:8002/dashboard?view=president. Keep the same signed-in account and compare the two pages.",
        "backend": "The dashboard handler uses the caller-supplied view name to retrieve a DashboardView. It checks that someone is signed in, but does not check whether that view is authorized for the account or whether the account has the president role.",
        "mechanism": "The view name selects a dashboard object; it does not prove the requester is authorized to see it. Because the server looks up the requested view without an ownership or role check, changing `participant` to `president` returns the president portal to an ordinary participant.",
        "observe": "The greeting and dashboard content change to the president portal, which contains confidential fictional office files and an event notice form. The session remains the same; only the object reference changed.",
        "distinction": "IDOR focuses on access to a particular object selected by its identifier. Broken access control is the broader category for missing permission checks on resources or actions. IDOR is commonly one specific form of broken access control.",
        "impact": "In a real service, the same flaw can expose private account records or allow unauthorized edits or deletions when write operations use the same missing ownership check.",
        "control": "Use the authenticated identity on the server for every object lookup, for example by querying for both record ID and owner. Check permissions on every read, update, and delete; never rely on an unpredictable ID as authorization.",
    },
    "traversal": {
        "name": "Path traversal",
        "definition": "Path traversal is a file-access vulnerability in which a request-controlled filename or path is allowed to resolve outside the directory that the feature was meant to expose.",
        "where": "Both the participant Document centre and the president portal accept a file name and resolve it relative to their own file collection. The local training tree contains multiple public and confidential fictional text files.",
        "payload": "From the participant Document centre, try ../private/president-brief.txt or ../private/event-budget.txt. From the president file viewer, try ../public/welcome.txt or ../public/room-map.txt. The .. segment moves to the parent folder.",
        "backend": "Each viewer joins the submitted path to its intended public or private folder. The final path is kept inside the DVWB training-files sandbox, but the handler intentionally does not require it to remain inside the selected collection.",
        "mechanism": "Starting in either public/ or private/, the ../ component moves up to training_files/. The next component selects the sibling folder. This lets a request cross between the two collections while a separate sandbox boundary prevents access to files outside the exercise.",
        "observe": "The selected file opens as plain text in a separate browser view. Compare an ordinary file with a sibling-folder file and note that the viewer reads both from the same training tree.",
        "distinction": "Path traversal is about how a path is resolved across directory boundaries. It is not simply a request for a hidden page: the flaw is trusting a user-controlled path without keeping the final resolved target within the approved directory.",
        "impact": "If a production process can read sensitive files, a traversal flaw may expose configuration, source code, credentials, or private documents. The effect depends on the files available to that process.",
        "control": "Prefer fixed server-side document IDs mapped to approved resources. If paths must be accepted, canonicalize the final path, verify it is contained under the allowed directory, reject traversal, and limit filesystem permissions.",
    },
    "bac": {
        "name": "Broken access control",
        "definition": "Broken access control occurs when the server does not correctly enforce who may view a resource or perform an action. A user may be signed in, yet still lack the role or permission required for a particular operation.",
        "where": "The President portal contains an event-wide participant-notice editor. The update route should be restricted to an organizer, but the server checks only that a user is signed in.",
        "payload": "Use the dashboard reference to open the President portal, then edit the participant notice and save it while signed in as a participant. The notice is shared with the participant dashboard.",
        "backend": "The form submits the notice to the settings update route. That route accepts an authenticated session and writes the value to the shared portal setting, but does not verify the account's organizer role.",
        "mechanism": "Authentication answers who is signed in; authorization separately determines which actions that account may perform. The route omits the organizer permission check, so a participant can invoke the same operation.",
        "observe": "The President portal displays the changed notice, and the participant overview shows the same updated value. The server accepted the write because a session existed, not because the account had the required role.",
        "distinction": "Broken access control is the broader failure to enforce a policy. IDOR is a narrower object-level example where a direct object reference selects another user's record. Here, the demonstrated failure is permission to perform an organizer action, not merely selecting a record ID.",
        "impact": "In real applications, missing authorization checks can expose private functions or let ordinary users change shared settings, manage accounts, or access administrative data.",
        "control": "Enforce role and permission checks on the server for every protected action and resource. Deny by default, centralize policy checks where practical, and test each route using accounts with different roles.",
    },
}


def esc(value: object) -> str:
    return html.escape(str(value), quote=True)


def lab_help(kind: str) -> str:
    if kind not in GUIDES:
        return ""
    guide = GUIDES[kind]
    steps = [
        ("Definition", guide["definition"], "text"),
        ("Where it appears", guide["where"], "text"),
        ("Try it in this page", guide["payload"], "code"),
        ("What the server does", guide["backend"], "text"),
        ("Why it works", guide["mechanism"], "text"),
        ("What to observe", guide["observe"], "text"),
        ("How to distinguish it", guide["distinction"], "text"),
        ("Possible impact", guide["impact"], "text"),
        ("How to prevent it", guide["control"], "text"),
    ]
    step_markup = "".join(
        f'<section class="guide-step" data-guide-step="{i}"{" hidden" if i else ""}>'
        f'<h3>{esc(title)}</h3>{"<code>" + esc(body) + "</code>" if kind == "code" else "<p>" + esc(body) + "</p>"}</section>'
        for i, (title, body, kind) in enumerate(steps)
    )
    return (f'<aside class="lab-help" data-guide-stepper data-step="0"><p class="eyebrow">Field note · {esc(guide["name"])}</p>'
            f'<h2 class="lab-title">{esc(guide["name"])}</h2>'
            f'<div class="guide-progress" aria-live="polite">Section 1 of {len(steps)} · {esc(steps[0][0])}</div>'
            f'<div class="guide-panels">{step_markup}</div>'
            '<nav class="guide-controls" aria-label="Field note sections">'
            '<button type="button" data-guide-action="previous" disabled>← Back</button>'
            '<button type="button" data-guide-action="next">Next section →</button></nav>'
            '<p class="lab-disclaimer">Fictional data, local training exercise.</p></aside>')


def login_lab_help(kind: str) -> str:
    guide = GUIDES[kind]
    return (f'<details class="login-guide"><summary><span class="login-guide-title">{esc(guide["name"])}: Definition</span>'
            f'<span class="login-guide-definition">{esc(guide["definition"])}</span><span class="login-guide-toggle">Read the field note</span></summary>'
            f'{lab_help(kind)}</details>')


GUIDE_STEPPER_SCRIPT = """document.addEventListener('click',function(event){var button=event.target.closest('[data-guide-action]');if(!button)return;var box=button.closest('[data-guide-stepper]');if(!box)return;var steps=Array.from(box.querySelectorAll('[data-guide-step]'));if(!steps.length)return;var index=Number(box.dataset.step||0);if(button.dataset.guideAction==='previous')index=Math.max(0,index-1);else if(button.dataset.guideAction==='next')index=index>=steps.length-1?0:Math.min(steps.length-1,index+1);steps.forEach(function(step,i){step.hidden=i!==index});box.dataset.step=String(index);var heading=steps[index].querySelector('h3');var progress=box.querySelector('.guide-progress');if(progress)progress.textContent='Section '+(index+1)+' of '+steps.length+' · '+(heading?heading.textContent:'Field note');var previous=box.querySelector('[data-guide-action="previous"]');var next=box.querySelector('[data-guide-action="next"]');if(previous)previous.disabled=index===0;if(next)next.textContent=index===steps.length-1?'Review again ↻':'Next section →'});"""


def chrome(title: str, body: str, user: Participant | None = None) -> str:
    person = (f'<span class="portal-user">Signed in as <b>{esc(user.display_name)}</b></span><form action="/logout" method="post"><button class="logout">Sign out</button></form>' if user else '<a class="button light" href="/">Participant sign in</a>')
    return f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="dvwb-theme" content="forge-iron-brass-v2"><title>{esc(title)} · Utsav 2026</title><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Serif:wght@400;500;600;700&display=swap" rel="stylesheet"><style>{CSS}</style></head><body>
<header class="portal-header"><a class="portal-brand" href="/"><span class="brand-symbol">U</span><span>UTSAV 2026<small>ACE × ASCIEE · PARTICIPANT PORTAL</small></span></a><div class="portal-head-right">{person}</div></header>{body}<footer class="portal-footer">Utsav 2026 · Participant services · Local demonstration</footer><script>{GUIDE_STEPPER_SCRIPT}</script></body></html>'''


def account_from_request(request: Request) -> Participant | None:
    token = request.cookies.get("utsav_session")
    if not token:
        return None
    with SessionLocal() as db:
        session = db.get(PortalSession, token)
        return db.get(Participant, session.participant_id) if session else None


def require_user(request: Request) -> Participant | Response:
    user = account_from_request(request)
    return user if user else RedirectResponse("/", status_code=303)


def layout(content: str, user: Participant, active: str = "", lab: str = "") -> str:
    links = [("/dashboard", "⌂", "Overview"), ("/schedule", "◷", "Schedule"), ("/passes", "▣", "Event pass"),
             ("/store", "▦", "Utsav store"), ("/orders", "▤", "My registrations"),
             ("/documents", "▧", "Document centre"), ("/tools", "＋", "Service centre"), ("/settings", "⚙", "Portal settings")]
    nav = '<p class="sidenav-label">PARTICIPANT MENU</p>' + "".join(f'<a class="{"active" if path == active else ""}" href="{path}"><span class="nav-ico">{ico}</span><span>{label}</span></a>' for path, ico, label in links)
    main = f'<div class="lab-page"><section class="lab-main">{content}</section>{lab_help(lab)}</div>' if lab else content
    return f'<main class="portal-wrap"><div class="portal-grid"><aside class="sidenav">{nav}</aside><section class="main">{main}</section></div></main>'


def login_view(error: str = "") -> str:
    message = f'<p class="login-error">{esc(error)}</p>' if error else ""
    story = '<section class="login-story"><div class="brand-mark">UTSAV 2026<small>ACE × ASCIEE · PARTICIPANT PORTAL</small></div><div class="story-copy"><p class="eyebrow">PARTICIPANT SERVICES</p><h1>Your event, in one place.</h1><p>Review your registration, workshop selection, event resources and participant updates.</p></div><div class="story-foot">UTSAV 2026 · PARTICIPANT ACCESS</div></section>'
    form = f'''<section class="login-side"><div class="login-card"><p class="eyebrow">ACCOUNT ACCESS</p><h2>Sign in to Utsav</h2><p class="muted">Enter your participant account details.</p>{message}<form action="/login" method="post"><label class="field">Username<input name="username" autocomplete="username"></label><label class="field">Password<input name="password" type="password" autocomplete="current-password"></label><button class="button wide">Sign in</button></form></div><p class="muted">SQL injection exercises are available in this login form and the store and service-centre searches.</p></section>'''
    return chrome("Sign in", f'<main class="login-page">{story}{form}</main>')


@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    user = account_from_request(request)
    return RedirectResponse("/dashboard", status_code=303) if user else HTMLResponse(login_view())


@app.post("/login", response_class=HTMLResponse)
def login(request: Request, username: str = Form(""), password: str = Form("")):
    # Keep the deliberately injectable SELECT, but close its result before any
    # write and always roll back failed transactions. This prevents malformed
    # payloads from leaving a failed transaction open in the request session.
    statement = text(
        "SELECT id, username, display_name, role FROM participants "
        f"WHERE username = '{username}' AND password_plain = '{password}' ORDER BY id LIMIT 1"
    )
    token = secrets.token_urlsafe(32)
    try:
        with SessionLocal() as db:
            try:
                participant = db.execute(statement).mappings().first()
            except SQLAlchemyError:
                db.rollback()
                logger.info("Login SQL-injection exercise submitted invalid SQL", exc_info=True)
                return HTMLResponse(login_view("The database rejected that query. Try another payload."), status_code=400)
            if participant is None:
                return HTMLResponse(login_view("Those details were not recognized."), status_code=401)
            participant_id = participant["id"]
            db.add(PortalSession(token=token, participant_id=participant_id))
            db.commit()
    except OperationalError:
        logger.exception("Database remained locked during login after the configured wait")
        return HTMLResponse(login_view("The training database is busy. Please submit again."), status_code=503)
    except SQLAlchemyError:
        logger.exception("Database error while creating a login session")
        return HTMLResponse(login_view("The training database could not complete sign-in. Please retry."), status_code=503)
    response = RedirectResponse("/dashboard", status_code=303)
    response.set_cookie("utsav_session", token, httponly=True, samesite="lax")
    return response


@app.post("/logout")
def logout(request: Request):
    token = request.cookies.get("utsav_session")
    if token:
        with SessionLocal() as db:
            session = db.get(PortalSession, token)
            if session:
                db.delete(session)
                db.commit()
    response = RedirectResponse("/", status_code=303)
    response.delete_cookie("utsav_session")
    return response


@app.get("/dashboard", response_class=HTMLResponse)
def dashboard(request: Request, view: str | None = None):
    user = require_user(request)
    if isinstance(user, Response): return user
    if view is None:
        return RedirectResponse("/dashboard?view=participant", status_code=303)
    with SessionLocal() as db:
        # Intentional IDOR: look up the caller-selected view without an owner or role check.
        selected_view = db.query(DashboardView).filter_by(view_type=view).first()
        notice = db.query(PortalSetting).filter_by(key="notice").first()
        records = db.query(PortalRecord).filter_by(owner=user.username).all()
    if selected_view is None:
        return HTMLResponse(chrome("Dashboard not found", layout('<section class="panel"><h2>Dashboard not found</h2><a href="/dashboard">Return to overview</a></section>', user), user), status_code=404)
    if selected_view.view_type == "president":
        content = president_dashboard_content(notice.value if notice else "Welcome to Utsav.")
        title = "President portal"
        guide = "bac"
    else:
        content = f'''<section class="welcome"><div><p class="eyebrow">PARTICIPANT OVERVIEW</p><h1>Hello, participants.</h1><p>{esc(selected_view.description)}</p></div><span class="avatar">U</span></section>
<div class="notice"><b>Portal notice</b><br>{esc(notice.value if notice else "Welcome to Utsav.")}</div><div class="section-title"><h2>Your event at a glance</h2><small>UTSAV 2026</small></div><div class="tiles"><a class="tile" href="/store"><span class="tile-ico">▦ &nbsp; EVENT STORE</span><h3>Utsav store</h3><p>Browse event stationery and participant items.</p></a><a class="tile" href="/orders"><span class="tile-ico">▤ &nbsp; REGISTRATION</span><h3>My registrations</h3><p>View your registration receipt and workshop selection.</p></a><a class="tile" href="/documents"><span class="tile-ico">▧ &nbsp; RESOURCES</span><h3>Document centre</h3><p>Read event documents and participant information.</p></a></div>
<div class="section-title"><h2>Recent records</h2><small>{len(records)} ITEMS</small></div><section class="panel"><table class="data-table"><thead><tr><th>Record</th><th>Details</th><th>Reference</th></tr></thead><tbody>{''.join(f'<tr><td>{esc(r.title)}</td><td>{esc(r.detail)}</td><td><a href="/orders/{r.id}">View</a></td></tr>' for r in records)}</tbody></table></section>'''
        title = "Participant overview"
        guide = "idor"
    return HTMLResponse(chrome(title, layout(content, user, "/dashboard", guide), user))


def president_dashboard_content(notice_text: str) -> str:
    files = sorted(PRIVATE_FILES.glob("*.txt"))
    file_rows = "".join(f'<tr><td>{esc(path.stem.replace("-", " ").title())}</td><td>OFFICE · CONFIDENTIAL</td><td><a class="button light" href="/president/files?file={quote(path.name, safe="")}">Choose viewer</a></td></tr>' for path in files)
    return f'''<section class="welcome"><div><p class="eyebrow">EXECUTIVE OFFICE · RESTRICTED</p><h1>President portal</h1><p>Confidential office workspace and event operations.</p></div><span class="avatar">P</span></section>
<div class="notice"><b>Participant notice</b><br>{esc(notice_text)}</div><div class="section-title"><h2>Confidential files</h2><small>OFFICE DOCUMENTS</small></div><section class="panel"><p>Fictional office files for this isolated training portal.</p><table class="data-table"><thead><tr><th>File</th><th>Classification</th><th></th></tr></thead><tbody>{file_rows}</tbody></table><form action="/president/files" method="get"><label class="field">File name<input name="file" placeholder="Enter a file path"></label><button class="button light">Choose file viewer</button></form></section>
<div class="section-title"><h2>Update participant notice</h2><small>ORGANIZER FUNCTION</small></div><section class="panel"><p>Change the notice shown on the participant dashboard.</p><form action="/settings/update" method="post"><label class="field">Participant notice<input name="notice" maxlength="180" value="{esc(notice_text)}"></label><button class="button">Save notice</button></form></section>'''


@app.get("/store", response_class=HTMLResponse)
def store(request: Request, term: str = ""):
    user = require_user(request)
    if isinstance(user, Response): return user
    with SessionLocal() as db:
        # Keep the catalogue empty until a search is submitted. Search SQL is
        # intentionally built from user input for this exercise.
        if term:
            statement = text(f"SELECT id,name,category,description,price FROM portal_products WHERE name LIKE '%{term}%' OR category LIKE '%{term}%' ORDER BY category,name")
            try: products = db.execute(statement).all()
            except Exception: products = []
        else:
            products = []
    rows = "".join(f'<tr><td>{esc(p.name)}</td><td>{esc(p.category)}</td><td>{esc(p.description)}</td><td class="price">₹{int(p.price):,}</td></tr>' for p in products)
    content = f'''<div class="section-title"><h2>Utsav store</h2><small>PARTICIPANT COLLECTION</small></div><section class="panel"><p>Browse stationery, event supplies and workshop items.</p><form action="/store" method="get" class="row"><label class="field" style="flex:1">Search the catalogue<input name="term" value="{esc(term)}" placeholder="Search items or categories"></label><button class="button">Search</button></form><table class="data-table"><thead><tr><th>Item</th><th>Category</th><th>Description</th><th>Price</th></tr></thead><tbody>{rows or '<tr><td colspan="4">No items match this search.</td></tr>'}</tbody></table></section>'''
    return HTMLResponse(chrome("Utsav store", layout(content, user, "/store", "sqli"), user))


@app.get("/schedule", response_class=HTMLResponse)
def schedule(request: Request):
    user = require_user(request)
    if isinstance(user, Response): return user
    agenda = [
        ("09:00", "Registration desk opens", "Main foyer · Collect your badge"),
        ("10:00", "Opening session", "Hall 2 · Welcome and event orientation"),
        ("11:15", "Secure Web Foundations", "Lab 1 · Bring your laptop"),
        ("13:30", "Network Essentials", "Room 204 · Workshop session"),
        ("15:00", "Community and closing notes", "Hall 2 · All participants"),
    ]
    rows = "".join(f'<tr><td><b>{time}</b></td><td>{esc(title)}</td><td>{esc(details)}</td></tr>' for time, title, details in agenda)
    with SessionLocal() as db:
        note = db.query(PortalSetting).filter_by(key="schedule_note").first()
    content = f'<div class="section-title"><h2>Event schedule</h2><small>UTSAV 2026 · DAY 1</small></div><section class="panel"><p>Session times and room assignments for the participant programme.</p><table class="data-table"><thead><tr><th>Time</th><th>Session</th><th>Location and note</th></tr></thead><tbody>{rows}</tbody></table><div class="notice"><b>Before you arrive</b><br>Keep your event pass available and check this page for schedule updates.</div><h3>Shared schedule note</h3><p>{esc(note.value if note else "")}</p></section>'
    return HTMLResponse(chrome("Event schedule", layout(content, user, "/schedule", "bac"), user))


@app.get("/passes", response_class=HTMLResponse)
def passes(request: Request):
    user = require_user(request)
    if isinstance(user, Response): return user
    with SessionLocal() as db: records = db.query(PortalRecord).filter_by(owner=user.username, title="Event pass").all()
    rows = "".join(f'<tr><td class="record-id">#{record.id}</td><td>{esc(record.detail)}</td><td><a class="button light" href="/passes/{record.id}">View pass</a></td></tr>' for record in records)
    content = f'<div class="section-title"><h2>Event pass</h2><small>PARTICIPANT ACCESS</small></div><section class="panel"><p>Your event credential is connected to your registration. Keep the reference available at check-in.</p><table class="data-table"><thead><tr><th>Reference</th><th>Pass details</th><th></th></tr></thead><tbody>{rows}</tbody></table></section>'
    return HTMLResponse(chrome("Event pass", layout(content, user, "/passes", "idor"), user))


@app.get("/passes/{record_id}", response_class=HTMLResponse)
def pass_detail(request: Request, record_id: int):
    user = require_user(request)
    if isinstance(user, Response): return user
    with SessionLocal() as db: record = db.get(PortalRecord, record_id)  # Intentionally missing owner check.
    if not record or record.title != "Event pass":
        return HTMLResponse(chrome("Pass not found", layout('<section class="panel"><h2>Pass not found</h2><a href="/passes">Return to event pass</a></section>', user), user), status_code=404)
    content = f'<div class="section-title"><h2>Participant event pass</h2><small>REFERENCE · #{record.id}</small></div><section class="panel"><span class="tag">UTSAV 2026 · GENERAL ACCESS</span><h3>{esc(record.detail.split(" · ")[0])}</h3><p>Registered participant: {esc(record.owner)}</p><p>Venue: ACE Learning Centre · Hall 2</p><p>Present this reference at the registration desk. This digital pass contains fictional training data.</p><a class="button light" href="/passes">Back to passes</a></section>'
    return HTMLResponse(chrome("Participant event pass", layout(content, user, "/passes", "idor"), user))


@app.get("/orders", response_class=HTMLResponse)
def orders(request: Request):
    user = require_user(request)
    if isinstance(user, Response): return user
    with SessionLocal() as db: records = db.query(PortalRecord).filter_by(owner=user.username).all()
    rows = "".join(f'<tr><td class="record-id">#{r.id}</td><td>{esc(r.title)}</td><td>{esc(r.detail)}</td><td><a class="button light" href="/orders/{r.id}">Open record</a></td></tr>' for r in records)
    content = f'<div class="section-title"><h2>My registrations</h2><small>REGISTRATION RECORDS</small></div><section class="panel"><p>Your receipt and selected workshop are listed below.</p><table class="data-table"><thead><tr><th>Reference</th><th>Record</th><th>Details</th><th></th></tr></thead><tbody>{rows}</tbody></table></section>'
    return HTMLResponse(chrome("My registrations", layout(content, user, "/orders", "idor"), user))


@app.get("/orders/{record_id}", response_class=HTMLResponse)
def order_detail(request: Request, record_id: int):
    user = require_user(request)
    if isinstance(user, Response): return user
    with SessionLocal() as db: record = db.get(PortalRecord, record_id)  # Intentionally missing owner check.
    if not record: return HTMLResponse(chrome("Record not found", layout('<section class="panel"><h2>Record not found</h2><a href="/orders">Return to registrations</a></section>', user), user), status_code=404)
    content = f'<div class="section-title"><h2>{esc(record.title)}</h2><small>REGISTRATION DETAIL · #{record.id}</small></div><section class="panel"><span class="tag">Participant record</span><p>{esc(record.detail)}</p><p>Account reference: {esc(record.owner)}</p><a class="button light" href="/orders">Back to registrations</a></section>'
    return HTMLResponse(chrome("Registration detail", layout(content, user, "/orders", "idor"), user))


@app.get("/documents", response_class=HTMLResponse)
def documents(request: Request, file: str = ""):
    user = require_user(request)
    if isinstance(user, Response): return user
    if file:
        return file_open_prompt(file, PUBLIC_FILES, "/documents/view", "/documents", user, "traversal")
    files = sorted(PUBLIC_FILES.glob("*.txt"))
    file_tiles = "".join(f'<a class="tile" href="/documents?file={quote(path.name)}"><span class="tile-ico">PUBLIC FILE · {index:02d}</span><h3>{esc(path.stem.replace("-", " ").title())}</h3><p>{esc(path.read_text(encoding="utf-8").splitlines()[0])}</p><small>Choose a file viewer ↗</small></a>' for index, path in enumerate(files, 1))
    content = f'''<div class="section-title"><h2>Document centre</h2><small>EVENT RESOURCES</small></div><section class="panel"><p>Select a resource to choose how to open it. These fictional .txt samples are stored only in the DVWB exercise folder.</p><div class="tiles">{file_tiles}</div><form action="/documents" method="get"><label class="field">Document name<input name="file" placeholder="Enter a document path"></label><button class="button">Choose file viewer</button></form></section>'''
    return HTMLResponse(chrome("Document centre", layout(content, user, "/documents", "traversal"), user))


def file_open_prompt(requested_path: str, base: Path, viewer_route: str, back_route: str, user: Participant, lab: str) -> HTMLResponse:
    normalized = requested_path.replace("\\", "/").lstrip("/")
    target = (base / normalized).resolve()
    try:
        target.relative_to(TRAINING_FILES.resolve())
        valid = target.is_file()
    except ValueError:
        valid = False
    if not valid:
        content = '<section class="panel"><span class="tag">FILE VIEWER</span><h2>File not found</h2><p>That path does not resolve to a file in the DVWB training folder.</p><a class="button light" href="' + esc(back_route) + '">Back to files</a></section>'
        return HTMLResponse(chrome("File not found", layout(content, user, back_route, lab), user), status_code=404)
    relative = target.relative_to(TRAINING_FILES.resolve()).as_posix()
    open_url = f'{viewer_route}?file={quote(requested_path, safe="/")}'
    content = f'''<div class="section-title"><h2>Open file</h2><small>FILE VIEWER REQUEST</small></div><section class="panel file-open-card"><span class="tag">TEXT DOCUMENT · .TXT</span><h2>{esc(target.name)}</h2><p>This file is plain text encoded as UTF-8. Choose the DVWB text viewer to open its contents.</p><dl class="file-meta"><div><dt>Type</dt><dd>text/plain</dd></div><div><dt>Encoding</dt><dd>UTF-8</dd></div><div><dt>Training path</dt><dd>{esc(relative)}</dd></div><div><dt>Size</dt><dd>{target.stat().st_size:,} bytes</dd></div></dl><div class="row"><a class="button" href="{esc(open_url)}">Open in text viewer ↗</a><a class="button light" href="{esc(back_route)}">Cancel</a></div></section>'''
    return HTMLResponse(chrome("Open text file", layout(content, user, back_route, lab), user))


def training_text_response(base: Path, requested_path: str) -> PlainTextResponse:
    normalized = requested_path.replace("\\", "/").lstrip("/")
    target = (base / normalized).resolve()
    try:
        # Traversal within the training-files tree is intentionally possible;
        # requests cannot escape the local DVWB sandbox itself.
        target.relative_to(TRAINING_FILES.resolve())
        if not target.is_file():
            raise FileNotFoundError
        content = target.read_text(encoding="utf-8")
    except (ValueError, OSError):
        return PlainTextResponse("Training file not found.\n", status_code=404)
    disposition = f"inline; filename*=UTF-8''{quote(target.name)}"
    return PlainTextResponse(content, headers={"Content-Disposition": disposition})


@app.get("/documents/view", response_class=PlainTextResponse)
def document_text_view(request: Request, file: str = ""):
    user = require_user(request)
    if isinstance(user, Response): return user
    return training_text_response(PUBLIC_FILES, file)


@app.get("/president", response_class=HTMLResponse)
def president_portal(request: Request):
    user = require_user(request)
    if isinstance(user, Response): return user
    return RedirectResponse("/dashboard?view=president", status_code=303)


@app.get("/president/files", response_class=HTMLResponse)
def president_file_picker(request: Request, file: str = ""):
    user = require_user(request)
    if isinstance(user, Response): return user
    return file_open_prompt(file, PRIVATE_FILES, "/president/view", "/dashboard?view=president", user, "traversal")


@app.get("/president/files/{file_name}", response_class=HTMLResponse)
def president_file(request: Request, file_name: str):
    user = require_user(request)
    if isinstance(user, Response): return user
    return file_open_prompt(file_name, PRIVATE_FILES, "/president/view", "/dashboard?view=president", user, "traversal")


@app.get("/president/view", response_class=PlainTextResponse)
def president_file_query_text_view(request: Request, file: str = ""):
    user = require_user(request)
    if isinstance(user, Response): return user
    return training_text_response(PRIVATE_FILES, file)


@app.get("/president/view/{file_name}", response_class=PlainTextResponse)
def president_file_path_text_view(request: Request, file_name: str):
    user = require_user(request)
    if isinstance(user, Response): return user
    return training_text_response(PRIVATE_FILES, file_name)


@app.post("/president/action", response_class=HTMLResponse)
def president_action(request: Request, action: str = Form(""), note: str = Form("")):
    user = require_user(request)
    if isinstance(user, Response): return user
    allowed = {"Approve the workshop room plan", "Publish the participant notice", "Confirm the volunteer schedule"}
    if action not in allowed:
        return RedirectResponse("/president", status_code=303)
    value = f"{action} · {note[:140]}" if note else action
    with SessionLocal() as db:
        item = db.query(PortalSetting).filter_by(key="president_last_action").first()
        if item:
            item.value = value
        else:
            db.add(PortalSetting(key="president_last_action", value=value))
        db.commit()
    return RedirectResponse("/president", status_code=303)


@app.get("/tools", response_class=HTMLResponse)
def tools_page(request: Request):
    user = require_user(request)
    if isinstance(user, Response): return user
    term = request.query_params.get("term", "")
    matches = []
    if term:
        with SessionLocal() as db:
            # Intentionally interpolates the search term for the SQL-injection lab.
            statement = text(f"SELECT id,title,detail FROM portal_records WHERE title LIKE '%{term}%' OR detail LIKE '%{term}%' ORDER BY id")
            try: matches = db.execute(statement).all()
            except Exception: matches = []
    results = ''.join(f'<tr><td>{esc(row.title)}</td><td>{esc(row.detail)}</td><td>#{int(row.id)}</td></tr>' for row in matches)
    content = f'''<div class="section-title"><h2>Service centre</h2><small>PARTICIPANT SUPPORT</small></div><div class="two-col"><section class="panel"><span class="tag">PORTAL STATUS</span><h3>Participant services</h3><p>Registration records, event resources and the participant catalogue are available.</p><p class="status">● Services available</p></section><section class="panel"><span class="tag">HELP DESK</span><h3>Event assistance</h3><p>For event questions, visit the Utsav information desk at the ACE Learning Centre.</p><a href="/documents">Browse participant documents</a></section></div><section class="panel"><div class="section-title"><h2>Search service records</h2><small>SUPPORT INDEX</small></div><p>Search fictional support and registration records by keyword.</p><form action="/tools" method="get" class="row"><label class="field" style="flex:1">Search term<input name="term" value="{esc(term)}" placeholder="Try a participant or record keyword"></label><button class="button">Search</button></form><table class="data-table"><thead><tr><th>Record</th><th>Details</th><th>Reference</th></tr></thead><tbody>{results or '<tr><td colspan="3">Enter a search term to view matching records.</td></tr>'}</tbody></table></section>'''
    return HTMLResponse(chrome("Service centre", layout(content, user, "/tools", "sqli"), user))


@app.get("/settings", response_class=HTMLResponse)
def settings(request: Request):
    user = require_user(request)
    if isinstance(user, Response): return user
    with SessionLocal() as db:
        notice = db.query(PortalSetting).filter_by(key="notice").first()
        venue = db.query(PortalSetting).filter_by(key="venue").first()
    content = f'''<div class="section-title"><h2>Portal settings</h2><small>EVENT-WIDE NOTICE</small></div><section class="panel"><p>Current venue: {esc(venue.value if venue else "ACE Learning Centre · Hall 2")}</p><p>Current notice: {esc(notice.value if notice else "")}</p><p>Event-wide notice changes are managed by the organizer.</p></section>'''
    return HTMLResponse(chrome("Portal settings", layout(content, user, "/settings", "bac"), user))


@app.post("/settings/update", response_class=HTMLResponse)
def settings_update(request: Request, notice: str = Form("")):
    user = require_user(request)
    if isinstance(user, Response): return user
    # Intentionally authenticates but omits the organizer authorization check.
    with SessionLocal() as db:
        item = db.query(PortalSetting).filter_by(key="notice").first()
        if item: item.value = notice[:180]
        db.commit()
    return RedirectResponse("/dashboard?view=president", status_code=303)
