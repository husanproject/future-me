"""
FutureMe AI — Database module
SQLite database for storing generation history.
"""
import sqlite3
import json
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "futureme.db")


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS generations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            original_filename TEXT NOT NULL,
            original_path TEXT NOT NULL,
            generated_paths TEXT NOT NULL DEFAULT '[]',
            params TEXT NOT NULL DEFAULT '{}',
            prompt TEXT DEFAULT '',
            negative_prompt TEXT DEFAULT '',
            ai_provider TEXT DEFAULT 'demo',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()


def save_generation(original_filename: str, original_path: str,
                    generated_paths: list, params: dict,
                    prompt: str, negative_prompt: str,
                    ai_provider: str) -> int:
    conn = get_db()
    cursor = conn.execute("""
        INSERT INTO generations 
        (original_filename, original_path, generated_paths, params, prompt, negative_prompt, ai_provider)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        original_filename,
        original_path,
        json.dumps(generated_paths),
        json.dumps(params),
        prompt,
        negative_prompt,
        ai_provider
    ))
    gen_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return gen_id


def get_all_generations():
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM generations ORDER BY created_at DESC"
    ).fetchall()
    conn.close()
    results = []
    for row in rows:
        r = dict(row)
        r["generated_paths"] = json.loads(r["generated_paths"])
        r["params"] = json.loads(r["params"])
        results.append(r)
    return results


def get_generation(gen_id: int):
    conn = get_db()
    row = conn.execute(
        "SELECT * FROM generations WHERE id = ?", (gen_id,)
    ).fetchone()
    conn.close()
    if row:
        r = dict(row)
        r["generated_paths"] = json.loads(r["generated_paths"])
        r["params"] = json.loads(r["params"])
        return r
    return None


def delete_generation(gen_id: int) -> bool:
    conn = get_db()
    cursor = conn.execute(
        "DELETE FROM generations WHERE id = ?", (gen_id,)
    )
    conn.commit()
    deleted = cursor.rowcount > 0
    conn.close()
    return deleted
